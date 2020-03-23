const createDebug = require('debug');
const renderImgOrSvg = require('renderImgOrSvg');

const debug = createDebug('app:views:img');

const img = async (ctx, page) => {
  const svg = await page.$('#container > svg');
  debug('got the svg element');

  const image = await svg.screenshot({
    type: 'jpeg',
    quality: 90,
    omitBackground: true,
  });
  debug('took a screenshot from the element, file size: %o', image.length);

  ctx.type = 'image/jpeg';
  ctx.body = image;
};

module.exports = renderImgOrSvg(img);
