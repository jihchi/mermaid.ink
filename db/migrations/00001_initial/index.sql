CREATE TABLE IF NOT EXISTS mermaid_ink_assets
(
    id BYTEA PRIMARY KEY,
    req_pathname TEXT NOT NULL,
    req_search TEXT,
    res_status_code SMALLINT,
    res_mime_type TEXT,
    res_body BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mermaid_ink_assets_created_at
ON mermaid_ink_assets (created_at);

CREATE INDEX idx_mermaid_ink_assets_res_status_code
ON mermaid_ink_assets (res_status_code);

CREATE INDEX idx_assets_status_created
ON mermaid_ink_assets (res_status_code, created_at);
