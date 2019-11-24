const Koa = require('koa');
const { promises: fs } = require('fs');
const route = require('koa-route');
const path = require('path');
const puppeteer = require('puppeteer');
const { getOptionsFromCode } = require('./shared');

const DEBUG_MODE = process.env.hasOwnProperty('DEBUG_MODE');
const indexHTML = fs.readFile(path.resolve(__dirname, './index.html'), {
  encoding: 'utf-8',
});
const mermaidHTML = path.resolve(__dirname, './mermaid.html');

const app = new Koa();

app.use(
  route.get('/', async (ctx, _next) => {
    ctx.type = 'text/html';
    ctx.body = await indexHTML;
  })
);

app.use(
  route.get('/img/:encodedCode', async (ctx, encodedCode, _next) => {
    let page;
    try {
      console.log('start to render: %o', encodedCode);

      const { browser } = ctx;
      const { code, mermaid: config } = getOptionsFromCode(encodedCode);

      console.log('code: %o, config: %o', code, config);

      console.log('create new blank page');
      page = await browser.newPage();

      console.log('load local mermaid page');
      await page.goto(`file://${mermaidHTML}`);

      try {
        console.log('invoke mermaid to render SVG in DOM');
        await page.evaluate(
          (definition, config) => render(definition, config),
          code,
          config
        );
      } catch (e) {
        console.log('mermaid failed to render SVG: %o', e);
        ctx.throw(400, 'invalid encoded code');
      }

      console.log('select the svg');
      const svg = await page.$('#container > svg');

      console.log('take screenshot form container');
      const image = await svg.screenshot({
        type: 'jpeg',
        quality: 90,
        omitBackground: true,
      });

      console.log('respond image size: %o', image.length);
      ctx.type = 'image/jpeg';
      ctx.body = image;
    } catch (e) {
      throw e;
    } finally {
      if (page) await page.close();
    }
  })
);

module.exports = async () => {
  let browser;
  const shutdown = async () => {
    console.log('shutdown server');
    if (browser) await browser.close();
  };

  try {
    console.log('launch headless browser instance');
    browser = await puppeteer.launch({
      headless: !DEBUG_MODE,
      devtools: DEBUG_MODE,
      // https://peter.sh/experiments/chromium-command-line-switches/
      args: [
        // Disables syncing browser data to a Google Account.
        '--disable-sync',
        // Skip First Run tasks, whether or not it's actually the First Run.
        '--no-first-run',
        // Prevent infobars from appearing.
        '--disable-infobars',
        // Disable task throttling of timer tasks from background pages.
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        // Prevent renderer process backgrounding when set.
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-sync',
      ],
    });
    app.context.browser = browser;

    return {
      app,
      shutdown,
    };
  } catch (e) {
    console.error('*** caught exception ***');
    console.error(e);
    await shutdown();
    process.exit(1);
  }

  return null;
};
