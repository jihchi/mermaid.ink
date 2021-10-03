const createDebug = require('debug');
const renderImgOrSvg = require('renderImgOrSvg');

const debug = createDebug('app:views:svg');

const svg = async (ctx, page) => {
  const svg = await page.$eval('#container > svg', (e) =>
    // this is a work-around by @hat215, for more details:
    // https://github.com/mermaid-js/mermaid-live-editor/issues/26#issuecomment-667678228
    //e.style.background = 'red';
    e.outerHTML.replace(/<br>/gi, '<br/>')
  );
  debug('got the svg element, file size: %o', svg.length);

  ctx.type = 'image/svg+xml';
  ctx.body = svg;
};

module.exports = renderImgOrSvg(svg);
