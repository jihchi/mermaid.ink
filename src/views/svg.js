const createDebug = require('debug');
const renderImgOrSvg = require('renderImgOrSvg');

const debug = createDebug('app:views:svg');

const svg = async (ctx, page) => {
  const svg = await page.$eval('#container > svg', (e) => e.outerHTML);
  debug('got the svg element, file size: %o', svg.length);

  ctx.type = 'image/svg+xml';
  ctx.body = svg;
};

module.exports = renderImgOrSvg(svg);
