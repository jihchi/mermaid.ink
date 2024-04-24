const createDebug = require('debug');
const renderImgOrSvg = require('renderImgOrSvg');

const debug = createDebug('app:views:pdf');

const pdf = async (ctx, page, size) => {
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

  const paperFormat = [
    'letter',
    'legal',
    'tabloid',
    'ledger',
    'a0',
    'a1',
    'a2',
    'a3',
    'a4',
    'a5',
    'a6',
  ].includes(ctx.query.paper?.toLowerCase())
    ? ctx.query.paper?.toLowerCase()
    : 'a4';
  const landscape = ctx.query.landscape !== undefined;
  const pdfFit = ctx.query.fit !== undefined;
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

  const pdf = await page.pdf(pdfOptions);
  debug('printed to pdf, file size: %o', pdf.length);

  ctx.type = 'application/pdf';
  ctx.body = pdf;
};

module.exports = renderImgOrSvg(pdf);
