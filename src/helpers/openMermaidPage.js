import path from 'node:path';
import createDebug from 'debug';

const debug = createDebug('app:helpers:openMermaidPage');

const mermaidHTML = path.resolve(import.meta.dirname, '../static/mermaid.html');

const ALLOWED_HTTPS_HOSTS = new Set([
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]);

export default async (ctx) => {
  const { browser, state } = ctx;
  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on('request', (request) => {
    const url = new URL(request.url());

    if (url.protocol === 'file:') {
      request.continue();
      return;
    }

    if (url.protocol === 'data:') {
      request.continue();
      return;
    }

    if (url.protocol === 'https:') {
      const customFontAwesomeHost = state.customFontAwesomeCssUrl
        ? new URL(state.customFontAwesomeCssUrl).hostname
        : null;

      if (
        ALLOWED_HTTPS_HOSTS.has(url.hostname) ||
        url.hostname === customFontAwesomeHost
      ) {
        request.continue();
        return;
      }
    }

    debug('blocked request to %s', request.url());
    request.abort('blockedbyclient');
  });

  await page.goto(`file://${mermaidHTML}`);
  return page;
};
