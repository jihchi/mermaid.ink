const createDebug = require('debug');
const getEncodedCodeFromURL = require('../shared/getEncodedCodeFromURL');
const openMermaidPage = require('../shared/openMermaidPage');
const renderSVG = require('../shared/renderSVG');
const getSVG = require('../shared/getSVG');

const debug = createDebug('app:services:oembed');

module.exports = async (ctx, _next) => {
  const {
    query: { url = '' },
  } = ctx;

  if (!url) {
    ctx.throw(400, 'query "url" is required');
    return;
  }

  const encodedCode = getEncodedCodeFromURL(url);
  let page;
  try {
    page = await openMermaidPage(ctx);
    debug('loaded local mermaid page');

    try {
      await renderSVG({ page, encodedCode });
      debug('rendered SVG in DOM');
    } catch (e) {
      debug('mermaid failed to render SVG: %o', e);
      ctx.throw(400, 'invalid encoded code');
    }

    const svg = await getSVG(page);
    debug('got the svg element');

    const { width, height } = await svg.boundingBox();
    debug(
      'took bounding box from element, width: %o, height: %o',
      width,
      height
    );

    ctx.type = 'application/json';
    ctx.body = {
      version: '1.0',
      type: 'photo',
      provider_name: 'Mermaid Ink',
      provider_url: 'https://mermaid.ink',
      url,
      width,
      height,
    };
  } finally {
    if (page) await page.close();
  }
};
