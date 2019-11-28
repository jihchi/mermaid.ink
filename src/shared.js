const path = require('path');
const pathToRegexp = require('path-to-regexp');

const mermaidHTML = path.resolve(__dirname, './mermaid.html');

function getEncodedCodeFromURL(url) {
  const { pathname } = new URL(url);
  const re = pathToRegexp('/img/:encodedCode');
  const m = re.exec(pathname);

  if (!m) return '';

  const [, encodedCode] = m;
  return encodedCode;
}

// copied from https://github.com/mermaidjs/mermaid-live-editor/blob/master/src/utils.js
function getOptionsFromCode(base64) {
  const theme = 'default';
  const str = Buffer.from(base64, 'base64').toString('utf8');
  let state;
  try {
    state = JSON.parse(str);
    if (state.code === undefined) {
      // not valid json
      state = { code: str, mermaid: { theme } };
    }
  } catch (e) {
    state = { code: str, mermaid: { theme } };
  }
  return state;
}

const openMermaidPage = async ctx => {
  const { browser } = ctx;
  const page = await browser.newPage();
  await page.goto(`file://${mermaidHTML}`);
  return page;
};

const renderSVG = async ({ page, encodedCode }) => {
  const { code, mermaid: config } = getOptionsFromCode(encodedCode);
  await page.evaluate((def, cfg) => render(def, cfg), code, config);
  return;
};

const getSVG = async page => await page.$('#container > svg');

module.exports = {
  getOptionsFromCode,
  getEncodedCodeFromURL,
  openMermaidPage,
  renderSVG,
  getSVG,
};
