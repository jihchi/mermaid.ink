import createDebug from 'debug';
import postgres from 'postgres';

const { ENABLE_DATABASE, PGHOST, PGPORT, PGDATABASE, PGUSERNAME } = process.env;

const debug = createDebug('app:helpers:db');

export const isEnabled = ENABLE_DATABASE?.toLowerCase() === 'true';

export const connect = async () => {
  if (!isEnabled) {
    debug('`ENABLE_DATABASE` is not enabled. Skip database mode');
    return;
  }

  debug(`connect to database ${PGUSERNAME}@${PGHOST}:${PGPORT}/${PGDATABASE}`);

  const sql = postgres({
    // required for advisory lock: we need a single, long-lived connection so that the lock is not lost
    // when the pool rotates connections. See https://github.com/porsager/postgres/discussions/387#discussioncomment-2866976
    max: 1, // only one connection in the pool so the advisory lock stays on a single backend
    max_lifetime: false, // disable automatic connection recycling so the advisory lock is not dropped
  });

  // test connection
  await sql`SELECT 1`;

  return sql;
};

export const disconnect = async (sql) => {
  if (!isEnabled) {
    debug('`ENABLE_DATABASE` is not enabled. Skip database disconnection');
    return;
  }

  if (!sql) {
    debug('failed to disconnect from database: sql instance is unavailable');
    return;
  }

  debug('disconnect from database');
  await sql.end();
};

export const readAsset = async (sql, id) => {
  if (sql == null) {
    throw new Error('parameter `sql` is required');
  } else if (id == null) {
    throw new Error('parameter `id` is required');
  }

  const [data] = await sql`
    SELECT res_status_code, res_mime_type, res_body
    FROM mermaid_ink_assets
    WHERE id = ${id}
  `;

  return data;
};

export const insertAsset = async (
  sql,
  { id, path, querystring, statusCode, mimeType, body }
) => {
  if (sql == null) {
    throw new Error('parameter `sql` is required');
  } else if (id == null) {
    throw new Error('parameter `id` is required');
  }

  const asset = { id };
  const fields = ['id'];

  if (path) {
    fields.push('req_pathname');
    asset.req_pathname = path;
  }

  if (querystring) {
    fields.push('req_search');
    asset.req_search = querystring;
  }

  if (statusCode) {
    fields.push('res_status_code');
    asset.res_status_code = statusCode;
  }

  if (mimeType) {
    fields.push('res_mime_type');
    asset.res_mime_type = mimeType;
  }

  if (body) {
    fields.push('res_body');
    asset.res_body = body;
  }

  return await sql`
    INSERT INTO mermaid_ink_assets ${sql([asset], fields)}
    ON CONFLICT (id) DO NOTHING
  `;
};

export const updateAsset = async (
  sql,
  { id, path, querystring, statusCode, mimeType, body }
) => {
  if (sql == null) {
    throw new Error('parameter `sql` is required');
  } else if (id == null) {
    throw new Error('parameter `id` is required');
  }

  const asset = {};
  const fields = [];

  if (path) {
    fields.push('req_pathname');
    asset.req_pathname = path;
  }

  if (querystring) {
    fields.push('req_search');
    asset.req_search = querystring;
  }

  if (statusCode) {
    fields.push('res_status_code');
    asset.res_status_code = statusCode;
  }

  if (mimeType) {
    fields.push('res_mime_type');
    asset.res_mime_type = mimeType;
  }

  if (body) {
    fields.push('res_body');
    asset.res_body = body;
  }

  return await sql`
    UPDATE mermaid_ink_assets SET ${sql(asset, fields)}
    WHERE id = ${id}
  `;
};

// convert first 8 bytes of cache key (Buffer) to BigInt for advisory lock
export const bufferToLockKey = (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('value must be a Buffer');
  } else if (buffer.length < 8) {
    throw new Error('value must be at least 8 bytes');
  }

  return buffer.readBigInt64BE();
};

export const tryAcquireLock = async (sql, cacheKey) => {
  if (sql == null) {
    throw new Error('parameter `sql` is required');
  } else if (cacheKey == null) {
    throw new Error('parameter `cacheKey` is required');
  }

  const lockKey = bufferToLockKey(cacheKey);

  debug('try to acquire an advisory lock', lockKey);

  const [{ pg_try_advisory_lock: acquired }] = await sql`
    SELECT pg_try_advisory_lock(${lockKey})
  `;

  debug('acquired advisory lock?', acquired);

  return acquired;
};

export const releaseLock = async (sql, cacheKey) => {
  if (sql == null) {
    throw new Error('parameter `sql` is required');
  } else if (cacheKey == null) {
    throw new Error('parameter `cacheKey` is required');
  }

  const lockKey = bufferToLockKey(cacheKey);
  try {
    debug('release the advisory lock', lockKey);
    await sql`SELECT pg_advisory_unlock(${lockKey})`;
    debug('advisory lock released');
  } catch (error) {
    debug('failed to release advisory lock %s: %o', lockKey, error);
  }
};
