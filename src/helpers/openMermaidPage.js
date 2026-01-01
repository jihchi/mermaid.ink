import path from 'node:path';

const mermaidHTML = path.resolve(import.meta.dirname, '../static/mermaid.html');

/**
 * Opens a new Puppeteer page with the local mermaid.html template loaded.
 *
 * @param {{browser: import('puppeteer').Browser}} ctx - Koa context containing the browser instance
 * @returns {Promise<import('puppeteer').Page>} A new Puppeteer page with mermaid.html loaded
 */
export default async (ctx) => {
  const { browser } = ctx;
  const page = await browser.newPage();
  await page.goto(`file://${mermaidHTML}`);
  return page;
};
