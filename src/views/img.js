const createDebug = require('debug');
const openMermaidPage = require('../shared/openMermaidPage');
const renderSVG = require('../shared/renderSVG');
const getSVG = require('../shared/getSVG');

const debug = createDebug('app:img');

module.exports = async (ctx, encodedCode, _next) => {
  debug('start to render');

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

    const image = await svg.screenshot({
      type: 'jpeg',
      quality: 90,
      omitBackground: true,
    });
    debug('took screenshot form element, size: %o', image.length);

    ctx.type = 'image/jpeg';
    ctx.body = image;
  } finally {
    if (page) await page.close();
  }
};
