import createDebug from 'debug';
import postgres from 'postgres';

/**
 * @file PostgreSQL database abstraction layer for caching rendered diagrams.
 *
 * Provides connection management, asset metadata/blob CRUD operations,
 * and PostgreSQL advisory lock support for preventing duplicate renders.
 * Database features are only active when ENABLE_DATABASE=true.
 *
 * @module helpers/db
 */

const { ENABLE_DATABASE, PGHOST, PGPORT, PGDATABASE, PGUSERNAME } = process.env;

const debug = createDebug('app:helpers:db');

export const isEnabled = ENABLE_DATABASE?.toLowerCase() === 'true';

/**
 * Establish a PostgreSQL connection.
 * @returns {Promise<?import('postgres').Sql>} postgres connection instance, or undefined if database is disabled
 */
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

/**
 * Close the PostgreSQL connection.
 * @param {?import('postgres').Sql} sql - postgres connection instance
 * @returns {Promise<void>}
 */
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

/**
 * Read asset metadata by cache key.
 * @param {?import('postgres').Sql} sql - postgres connection instance
 * @param {?Buffer} id - cache key (BYTEA)
 * @returns {Promise<?{res_status_code: number, res_mime_type: string}>} Metadata with {res_status_code, res_mime_type} if found, undefined if cache miss
 */
export const readAsset = async (sql, id) => {
  if (sql == null) {
    throw new Error('parameter `sql` is required');
  } else if (id == null) {
    throw new Error('parameter `id` is required');
  }

  const [data] = await sql`
    SELECT res_status_code, res_mime_type
    FROM mermaid_ink_meta
    WHERE id = ${id}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return data;
};

/**
 * Read rendered asset blob by cache key.
 * @param {?import('postgres').Sql} sql - postgres connection instance
 * @param {?Buffer} id - cache key (BYTEA)
 * @returns {Promise<?Buffer>} Rendered output blob if found, undefined if cache miss
 */
export const readBlob = async (sql, id) => {
  if (sql == null) {
    throw new Error('parameter `sql` is required');
  } else if (id == null) {
    throw new Error('parameter `id` is required');
  }

  const [data] = await sql`
    SELECT data
    FROM mermaid_ink_blob
    WHERE id = ${id}
  `;

  return data?.data;
};

/**
 * Insert asset metadata and optional blob.
 * @param {?import('postgres').Sql} sql - postgres connection instance
 * @param {{id: Buffer | undefined, path: string | undefined, querystring: string | undefined, statusCode: number | undefined, mimeType: string | undefined, blob: Buffer | undefined}} options - asset fields
 * @returns {Promise<void>}
 */
export const insertAsset = async (
  sql,
  { id, path, querystring, statusCode, mimeType, blob }
) => {
  if (sql == null) {
    throw new Error('parameter `sql` is required');
  } else if (id == null) {
    throw new Error('parameter `id` is required');
  }

  return await sql.begin(async (sql) => {
    const entry = { id };
    const fields = ['id'];

    if (path) {
      entry.req_pathname = path;
      fields.push('req_pathname');
    }

    if (querystring) {
      entry.req_search = querystring;
      fields.push('req_search');
    }

    if (statusCode) {
      entry.res_status_code = statusCode;
      fields.push('res_status_code');
    }

    if (mimeType) {
      entry.res_mime_type = mimeType;
      fields.push('res_mime_type');
    }

    await sql`
      INSERT INTO mermaid_ink_meta ${sql(entry, fields)}
      ON CONFLICT (id, created_at) DO NOTHING
    `;

    if (blob) {
      await sql`
        INSERT INTO mermaid_ink_blob
          (id, data)
        VALUES
          (${id}, ${blob})
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
      `;
    }
  });
};

/**
 * Update asset metadata and/or blob.
 * @param {?import('postgres').Sql} sql - postgres connection instance
 * @param {{id: Buffer | undefined, path: string | undefined, querystring: string | undefined, statusCode: number | undefined, mimeType: string | undefined, blob: Buffer | undefined}} options - update fields
 * @returns {Promise<void>}
 */
export const updateAsset = async (
  sql,
  { id, path, querystring, statusCode, mimeType, blob }
) => {
  if (sql == null) {
    throw new Error('parameter `sql` is required');
  } else if (id == null) {
    throw new Error('parameter `id` is required');
  }

  const entry = {};
  const fields = [];

  if (path) {
    fields.push('req_pathname');
    entry.req_pathname = path;
  }

  if (querystring) {
    fields.push('req_search');
    entry.req_search = querystring;
  }

  if (statusCode) {
    fields.push('res_status_code');
    entry.res_status_code = statusCode;
  }

  if (mimeType) {
    fields.push('res_mime_type');
    entry.res_mime_type = mimeType;
  }

  if (fields.length === 0 && !blob) {
    return;
  }

  return await sql.begin(async (sql) => {
    if (fields.length) {
      await sql`
        UPDATE mermaid_ink_meta SET ${sql(entry, fields)}
        WHERE id = ${id}
    `;
    }

    if (blob) {
      await sql`
        INSERT INTO mermaid_ink_blob
          (id, data)
        VALUES
          (${id}, ${blob})
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
      `;
    }
  });
};

/**
 * Convert first 8 bytes of cache key Buffer to BigInt for PostgreSQL advisory lock.
 * Advisory locks require a single 64-bit signed integer as the lock ID.
 *
 * @param {Buffer} buffer - cache key (should be SHA256 hash = 32 bytes)
 * @returns {BigInt} First 8 bytes interpreted as signed 64-bit big-endian integer
 * @throws {Error} If buffer is not a Buffer or less than 8 bytes
 */
export const bufferToLockKey = (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('value must be a Buffer');
  } else if (buffer.length < 8) {
    throw new Error('value must be at least 8 bytes');
  }

  return buffer.readBigInt64BE();
};

/**
 * Try to acquire a non-blocking PostgreSQL advisory lock.
 * Used to prevent concurrent rendering of the same diagram.
 * Returns immediately with true/false—does not wait.
 *
 * @param {?import('postgres').Sql} sql - postgres connection instance
 * @param {Buffer} cacheKey - cache key to lock on
 * @returns {Promise<boolean>} true if lock acquired, false if already held by another session
 */
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

/**
 * Release a PostgreSQL advisory lock.
 * Typically called in finally block to ensure cleanup even if rendering fails.
 * Silently catches errors to prevent lock release failures from masking render errors.
 *
 * @param {?import('postgres').Sql} sql - postgres connection instance
 * @param {Buffer} cacheKey - cache key that was locked
 * @returns {Promise<void>}
 */
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
