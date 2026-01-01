/**
 * @typedef {'img' | 'svg' | 'pdf'} AssetType
 */

/**
 * @typedef {'default' | 'neutral' | 'dark' | 'forest'} MermaidTheme
 */

/**
 * @typedef {'letter' | 'legal' | 'tabloid' | 'ledger' | 'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6'} PaperSize
 */

/**
 * @typedef {'jpeg' | 'png' | 'webp'} ImageType
 */

/**
 * @callback RenderFunction
 * @param {import('koa').Context} ctx - Koa context
 * @param {Buffer | null} cacheKey - Cache key for the rendered asset (null when DB is disabled)
 * @param {import('puppeteer').Page} page - Puppeteer page with rendered SVG
 * @param {{width: number | undefined, height: number | undefined, scale: number | undefined}} size - Diagram dimensions
 * @returns {Promise<void>}
 */

export {};
