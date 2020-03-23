const path = require('path');

const mermaidHTML = path.resolve(__dirname, '../static/mermaid.html');

module.exports = async (ctx) => {
  const { browser } = ctx;
  const page = await browser.newPage();
  await page.goto(`file://${mermaidHTML}`);
  return page;
};
