import getOptionsFromCode from '#@/helpers/getOptionsFromCode.js';

/**
 * Renders a Mermaid diagram to SVG in the given Puppeteer page.
 *
 * @param {{page: import('puppeteer').Page, encodedCode: string, bgColor: string | undefined, size: {width: number | undefined, height: number | undefined}, theme: string | undefined}} options - Render options
 * @returns {Promise<void>} Resolves when rendering is complete
 * @throws {Error} If deserialization, configuration parsing, or Mermaid rendering fails
 */
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
