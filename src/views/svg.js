const FA_VERSION =
  require('@fortawesome/fontawesome-free/package.json').version;
const createDebug = require('debug');
const renderImgOrSvg = require('renderImgOrSvg');

const debug = createDebug('app:views:svg');

const svg = async (ctx, page, size) => {
  let fontAwesomeCssUrl;
  if (ctx.state.customFontAwesomeCssUrl) {
    fontAwesomeCssUrl = ctx.state.customFontAwesomeCssUrl.replaceAll(
      'FA_VERSION',
      FA_VERSION
    );
  } else {
    fontAwesomeCssUrl = `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/${FA_VERSION}/css/all.min.css`;
  }

  const svgString = await page.evaluate((fontAwesomeCssUrl) => {
    function injectXmlnsXlink(svgElement) {
      // Mermaid.js supports binding a click event to a node, it will compile a DOM
      // element with a `xlink:href` attribute. The `xmlns:xlink` parameter is essential
      // for the `xlink:href` parameter to not cause an error (for example: Namespace
      // prefix xlink for href on a is not defined).
      //
      // For more details, see:
      // 1. https://developer.mozilla.org/en-US/docs/Web/SVG/Namespaces_Crash_Course
      // 2. https://mermaid.js.org/syntax/classDiagram.html#interaction
      svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    }

    function injectFontAwesomeCss(svgElement) {
      const style = document.createElement('style');

      style.innerText = `@import url("${fontAwesomeCssUrl}");`;
      svgElement.prepend(style);
    }

    function fixTags(svgElement) {
      // Ensure all HTML is valid XML in SVG - fixes <br>, <img> and other tags
      // XMLSerializer is more effective than manual string find/replace.
      // See https://github.com/mermaid-js/mermaid-cli/pull/378
      const xmlSerializer = new XMLSerializer();
      return xmlSerializer.serializeToString(svgElement);
    }

    // Clone the SVG element so that injected font does not load in browser
    const svgElement = document
      .querySelector('#container > svg')
      .cloneNode(true);
    injectXmlnsXlink(svgElement);
    injectFontAwesomeCss(svgElement);
    const svgString = fixTags(svgElement);
    return svgString;
  }, fontAwesomeCssUrl);

  debug('got the svg element, file size: %o', svgString.length);

  ctx.type = 'image/svg+xml';
  ctx.body = svgString;
};

module.exports = renderImgOrSvg(svg);
