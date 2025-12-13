import path from 'node:path';

const mermaidHTML = path.resolve(import.meta.dirname, '../static/mermaid.html');

export default async (ctx) => {
  const { browser } = ctx;
  const page = await browser.newPage();
  await page.goto(`file://${mermaidHTML}`);
  return page;
};
