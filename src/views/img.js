import createDebug from 'debug';
import renderImgOrSvg from '../node_modules/renderImgOrSvg.js';

const debug = createDebug('app:views:img');

const img = async (ctx, page, size) => {
  const svg = await page.$('#container > svg');
  debug('got the svg element');

  // If a size value has been explicitely set
  if (size.width || size.height) {
    await page.$eval('#container > svg', (svgElement) => {
      // Allow the element's max-width to exceed 100% for full resolution when screenshotted
      svgElement.style.maxWidth = null;
    });
  }

  // read type from query parameter, allow all types supported by puppeteer https://pptr.dev/api/puppeteer.screenshotoptions.type
  // defaults to jpeg, because that was originally the hardcoded type
  const type = ['jpeg', 'png', 'webp'].includes(ctx.query.type?.toLowerCase())
    ? ctx.query.type?.toLowerCase()
    : 'jpeg';
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
  ctx.body = Buffer.from(image);
};

export default renderImgOrSvg(img);
