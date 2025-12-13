import getOptionsFromCode from '#@/helpers/getOptionsFromCode.js';

export default async ({ page, encodedCode, bgColor, size, theme }) => {
  const { code, mermaid: config } = getOptionsFromCode(encodedCode);
  const configObj = typeof config === 'string' ? JSON.parse(config) : config;
  if (theme) {
    configObj.theme = theme;
  }

  await page.evaluate(
    (def, cfg, bgColor, size) => window.App.render(def, cfg, bgColor, size),
    code,
    configObj,
    bgColor,
    size
  );
};
