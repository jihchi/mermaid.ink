/**
 * @file Image route handler that renders Mermaid diagrams as raster images.
 * Supports PNG, JPEG, and WebP output formats via Puppeteer screenshots.
 */

import createDebug from 'debug';
import renderImgOrSvg from '#@/helpers/renderImgOrSvg.js';
import { isEnabled as isDatabaseEnabled, updateAsset } from '#@/helpers/db.js';
import { extractImageType } from '#@/helpers/utils.js';

const debug = createDebug('app:views:img');

/**
 * Takes a screenshot of the rendered Mermaid diagram and caches the result.
 * Handles custom dimensions by removing max-width constraints on the SVG element.
 * @param {import('koa').Context} ctx - Koa context object with query params and response
 * @param {Buffer | null} cacheKey - SHA256 hash used as the cache key for database storage (null when DB is disabled)
 * @param {import('puppeteer').Page} page - Puppeteer page with the rendered diagram
 * @param {{width: number | undefined, height: number | undefined}} size - Requested dimensions
 * @returns {Promise<void>}
 */
const img = async (ctx, cacheKey, page, size) => {
  const svg = await page.$('#container > svg');
  debug('got the svg element');

  // If a size value has been explicitly set
  if (size.width || size.height) {
    await page.$eval('#container > svg', (svgElement) => {
      // Allow the element's max-width to exceed 100% for full resolution when screenshotted
      svgElement.style.maxWidth = null;
    });
  }

  const type = extractImageType(ctx.query);
  debug('screenshot type: %s', type);

  const screenshotOptions = {
    type,
    // omit quality option if type is png https://pptr.dev/api/puppeteer.screenshotoptions.quality
    quality: type !== 'png' ? 90 : undefined,
    omitBackground: true,
  };

  const image = await svg.screenshot(screenshotOptions);
  debug('took a screenshot from the element, file size: %o', image.length);

  if (isDatabaseEnabled) {
    debug('cache the result');

    try {
      await updateAsset(ctx.sql, {
        id: cacheKey,
        statusCode: 200,
        mimeType: `image/${type}`,
        blob: image,
      });
    } catch (error) {
      debug('failed to cache the result', error);
    }
  }

  // dynamically set media type
  ctx.type = `image/${type}`;
  ctx.body = Buffer.from(image);
};

/**
 * Koa middleware that renders Mermaid diagrams as raster images.
 * Wrapped with renderImgOrSvg for queue management, page setup, and timeout handling.
 * @type {import('koa').Middleware}
 */
export default renderImgOrSvg(img);
