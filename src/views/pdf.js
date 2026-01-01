import createDebug from 'debug';
import renderImgOrSvg from '#@/helpers/renderImgOrSvg.js';
import { isEnabled as isDatabaseEnabled, updateAsset } from '#@/helpers/db.js';
import { extractPaper, isLandscape, isFit } from '#@/helpers/utils.js';

const debug = createDebug('app:views:pdf');

const pdf = async (ctx, cacheKey, page, size) => {
  // If a size value has been explicitely set
  if (size.width || size.height) {
    await page.$eval('#container > svg', (svgElement) => {
      // Allow the element's max-width to exceed 100% for full resolution when screenshotted
      svgElement.style.maxWidth = null;
    });
  }

  const clip = await page.$eval('#container > svg', (svgElement) => {
    const rect = svgElement.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  });

  let pdfOptions = {
    omitBackground: true,
    printBackground: true,
  };

  const paperFormat = extractPaper(ctx.query);
  const landscape = isLandscape(ctx.query);
  const pdfFit = isFit(ctx.query);

  if (pdfFit) {
    pdfOptions = {
      ...pdfOptions,
      width: Math.ceil(clip.width) + clip.x * 2 + 'px',
      height: Math.ceil(clip.height) + clip.y * 2 + 'px',
      pageRanges: '1-1',
    };
  } else {
    pdfOptions = {
      ...pdfOptions,
      format: paperFormat,
      landscape,
    };
  }

  const pdfData = await page.pdf(pdfOptions);
  const pdfBuffer = Buffer.from(pdfData);
  debug('printed to pdf, file size: %o', pdfBuffer.length);

  if (isDatabaseEnabled) {
    debug('cache the result');

    try {
      await updateAsset(ctx.sql, {
        id: cacheKey,
        statusCode: 200,
        mimeType: 'application/pdf',
        blob: pdfBuffer,
      });
    } catch (error) {
      debug('failed to cache the result', error);
    }
  }

  ctx.type = 'application/pdf';
  ctx.body = pdfBuffer;
};

export default renderImgOrSvg(pdf);
