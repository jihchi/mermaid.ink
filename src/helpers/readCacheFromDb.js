import createDebug from 'debug';
import createCacheKey from '#@/helpers/createCacheKey.js';
import {
  isEnabled,
  readAsset,
  readBlob,
  insertAsset,
  updateAsset,
  tryAcquireLock,
  releaseLock,
} from '#@/helpers/db.js';

const debug = createDebug('app:helpers:readCacheFromDb');

export default (handler, assetType) => async (ctx, encodedCode, next) => {
  if (!isEnabled) {
    await handler(ctx, null, encodedCode, next);
    return;
  }

  const {
    request: { path, query, querystring },
    state: { maxWidth, maxHeight },
    sql,
  } = ctx;

  debug('create cache key');
  const cacheKey = createCacheKey({
    encodedCode,
    query,
    assetType,
    options: { maxWidth, maxHeight },
  });

  debug('query cache data by key', cacheKey.toString('hex'));
  const cacheData = await readAsset(sql, cacheKey);

  if (cacheData) {
    const { res_status_code: status, res_mime_type: mimeType } = cacheData;

    // treat 503 as cache miss - previous render may have failed
    if (status === 503) {
      debug('found stale 503 entry, attempting re-render');
    } else if (status === 200) {
      const blob = await readBlob(sql, cacheKey);
      if (blob == null) {
        debug('metadata found but blob missing, treating as cache miss');
      } else {
        debug('got from cache', {
          length: blob?.length,
          mimeType,
        });

        ctx.body = blob;
        ctx.type = mimeType;
        ctx.status = 200;
        return;
      }
    } else if (status === 400) {
      // Only fetch blob for 400 error (where error message is cached as body)
      const blob = await readBlob(sql, cacheKey);
      debug('got cached error from cache', {
        status,
        mimeType,
        bodySize: blob?.length,
      });
      ctx.body = blob;
      ctx.type = mimeType;
      ctx.status = 400;
      return;
    } else {
      // For other errors (for example, 5xx), no blob expected—just headers
      debug('got cached error from cache', { status, mimeType });
      ctx.type = mimeType;
      ctx.throw(status);
      return;
    }
  }

  // try to acquire advisory lock
  const lockAcquired = await tryAcquireLock(sql, cacheKey);

  if (!lockAcquired) {
    debug('lock not acquired, another request is rendering');
    ctx.set('Retry-After', '1'); // second
    ctx.throw(503, 'Diagram is being rendered. Please retry.');
    return;
  }

  debug('lock acquired, proceeding with render');

  try {
    // double-check cache after acquiring lock
    const recheckData = await readAsset(sql, cacheKey);
    if (recheckData && recheckData.res_status_code === 200) {
      const blob = await readBlob(sql, cacheKey);
      if (blob) {
        debug('cache populated while waiting for lock');
        ctx.body = blob;
        ctx.type = recheckData.res_mime_type;
        ctx.status = 200;
        return;
      }
    }

    debug('inserting 503 placeholder');
    await insertAsset(sql, {
      id: cacheKey,
      path,
      querystring,
      statusCode: 503,
      mimeType: 'text/plain',
    });

    try {
      await handler(ctx, cacheKey, encodedCode, next);
    } catch (error) {
      const status = error.status ?? error.statusCode;
      if (status >= 400 && status < 500) {
        debug('caching 4xx error', { status, message: error.message });
        try {
          await updateAsset(sql, {
            id: cacheKey,
            statusCode: status,
            mimeType: 'text/plain',
            blob: Buffer.from(error.message, 'utf-8'),
          });
        } catch (cacheError) {
          debug('failed to cache 4xx error', cacheError);
        }
      }
      throw error;
    }
  } finally {
    debug('releasing advisory lock');
    await releaseLock(sql, cacheKey);
  }
};
