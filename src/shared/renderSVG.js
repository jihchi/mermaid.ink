const getOptionsFromCode = require('./getOptionsFromCode');

module.exports = async ({ page, encodedCode }) => {
  const { code, mermaid: config } = getOptionsFromCode(encodedCode);
  await page.evaluate((def, cfg) => render(def, cfg), code, config);
  return;
};
