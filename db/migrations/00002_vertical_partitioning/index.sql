-- Blob storage table with HASH partitioning for I/O distribution
-- 16 partitions balances lookup overhead vs. partition size
-- Adjust MODULUS if expected throughput > 1000 req/s per partition
CREATE TABLE IF NOT EXISTS mermaid_ink_blob (
  id BYTEA NOT NULL,
  data BYTEA COMPRESSION lz4,
  PRIMARY KEY (id)
)
PARTITION BY
  HASH (ID);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_00 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 0);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_01 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 1);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_02 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 2);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_03 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 3);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_04 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 4);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_05 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 5);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_06 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 6);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_07 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 7);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_08 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 8);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_09 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 9);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_10 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 10);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_11 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 11);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_12 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 12);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_13 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 13);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_14 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 14);

CREATE TABLE IF NOT EXISTS mermaid_ink_blob_15 PARTITION OF mermaid_ink_blob FOR
VALUES
WITH
  (MODULUS 16, REMAINDER 15);

-- Metadata table with RANGE partitioning by created_at for time-based retention
-- PK (id, created_at) enables efficient time-range queries and future archival
-- Supports purging old cache entries by dropping partitions
CREATE TABLE IF NOT EXISTS mermaid_ink_meta (
  id BYTEA NOT NULL,
  req_pathname TEXT,
  req_search TEXT,
  res_status_code SMALLINT,
  res_mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
)
PARTITION BY
  RANGE (created_at);

CREATE TABLE IF NOT EXISTS mermaid_ink_meta_default PARTITION OF mermaid_ink_meta DEFAULT;

-- Index by status code for cache analytics and filtering
-- Enables efficient queries for cache hit rates, error analysis, etc.
CREATE INDEX IF NOT EXISTS idx_mermaid_ink_meta_res_status_code ON mermaid_ink_meta (res_status_code);

-- Index by mime type for analytics and filtering by asset type
-- Enables efficient grouping and filtering by response type (SVG, PNG, PDF, etc.)
CREATE INDEX IF NOT EXISTS idx_mermaid_ink_meta_res_mime_type ON mermaid_ink_meta (res_mime_type);

-- Data migration from old single-table schema to new two-table schema
-- This safely migrates existing data from mermaid_ink_assets (if it exists)
DO $$
BEGIN
  -- Check if old table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mermaid_ink_assets') THEN
    -- Migrate metadata
    INSERT INTO mermaid_ink_meta (id, req_pathname, req_search, res_status_code, res_mime_type, created_at)
        SELECT id, req_pathname, req_search, res_status_code, res_mime_type, created_at
        FROM mermaid_ink_assets
    ON CONFLICT (id, created_at) DO NOTHING;

    -- Migrate blob data (only non-null res_body)
    INSERT INTO mermaid_ink_blob (id, data)
        SELECT id, res_body
        FROM mermaid_ink_assets
        WHERE res_body IS NOT NULL
    ON CONFLICT (id) DO NOTHING;

    -- Rename old table such that user can decide what to do with it
	ALTER TABLE mermaid_ink_assets RENAME TO mermaid_ink_assets_deprecated;
  END IF;
END $$;
