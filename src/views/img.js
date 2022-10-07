const createDebug = require('debug');
const renderImgOrSvg = require('renderImgOrSvg');

const debug = createDebug('app:views:img');

const img = async (ctx, page) => {
  const svg = await page.$('#container > svg');
  debug('got the svg element');

  // read type from query parameter, allow all types supported by puppeteer https://pptr.dev/api/puppeteer.screenshotoptions.type
  // defaults to jpeg, because that was originally the hardcoded type
  const type = ['jpeg', 'png', 'webp'].includes(ctx.query.type) ? ctx.query.type : 'jpeg';
  debug('screenshot type: %s', type);

  const screenshotOptions = {
    type,
    // omit quality option if type is png https://pptr.dev/api/puppeteer.screenshotoptions.quality
    quality: type !== 'png' ? 90 : undefined,
    omitBackground: true,
  };

  const image = await svg.screenshot(screenshotOptions);
  debug('took a screenshot from the element, file size: %o', image.length);

  // dynamically set media type
  ctx.type = `image/${type}`;
  ctx.body = image;
};

module.exports = renderImgOrSvg(img);
