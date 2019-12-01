const createDebug = require('debug');
const pathToRegexp = require('path-to-regexp');
const openMermaidPage = require('../shared/openMermaidPage');
const renderSVG = require('../shared/renderSVG');
const getSVG = require('../shared/getSVG');

const debug = createDebug('app:services:oembed');

const parseAndValidateURL = inputURL => {
  let url;

  try {
    url = new URL(inputURL);
  } catch (e) {
    debug('invalid URL: %o', e);
    throw new Error('Invalid URL');
  }

  const { protocol, hostname } = url;

  if (protocol !== 'https:') {
    throw new Error('URL protocol supported: https');
  } else if (hostname !== 'mermaid.ink') {
    throw new Error('URL hostname supported: mermaid.ink');
  }

  return url;
};

const getEncodedCodeFromURL = ({ pathname }) => {
  const regexp = pathToRegexp('/img/:encodedCode');
  const matches = regexp.exec(pathname);

  if (!matches) {
    throw new Error('URL pathname supported: /img/:code, /svg/:code');
  }

  const [, encodedCode] = matches;
  return encodedCode;
};

module.exports = async (ctx, _next) => {
  const {
    query: { url = '' },
  } = ctx;
  if (!url) {
    ctx.throw(400, 'query "url" is required');
    return;
  }

  let encodedCode = '';
  try {
    encodedCode = getEncodedCodeFromURL(parseAndValidateURL(url));
  } catch (e) {
    ctx.throw(404, `${e}`);
    return;
	}

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

    const { width, height } = await svg.boundingBox();
    debug(
      'took bounding box from element, width: %o, height: %o',
      width,
      height
    );

    ctx.type = 'application/json';
    ctx.body = {
      version: '1.0',
      type: 'photo',
      provider_name: 'Mermaid Ink',
      provider_url: 'https://mermaid.ink',
      url,
      width,
      height,
    };
  } finally {
    if (page) await page.close();
  }
};
