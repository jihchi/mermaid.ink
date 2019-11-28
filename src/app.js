const Koa = require('koa');
const createDebug = require('debug');
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
const debug = createDebug('app:server');
const app = new Koa();

app.use(
  route.get('/', async (ctx, _next) => {
    ctx.type = 'text/html';
    ctx.body = await indexHTML;
  })
);

app.use(
  route.get('/services/oembed', async (ctx, _next) => {
    const {
      query: { url = '' },
    } = ctx;

    if (!url) {
      ctx.throw(400, 'query "url" is required');
      return;
    }

    ctx.type = 'application/json';
    ctx.body = {
      version: '1.0',
      type: 'photo',
      provider_name: 'Mermaid Ink',
      provider_url: 'https://mermaid.ink',
      url,
      width: 800,
      height: 600,
    };
  })
);

app.use(
  route.get('/img/:encodedCode', async (ctx, encodedCode, _next) => {
    let page;
    try {
      debug('start to render: %o', encodedCode);

      const { browser } = ctx;
      const { code, mermaid: config } = getOptionsFromCode(encodedCode);

      debug('code: %o, config: %o', code, config);

      debug('create new blank page');
      page = await browser.newPage();

      debug('load local mermaid page');
      await page.goto(`file://${mermaidHTML}`);

      try {
        debug('invoke mermaid to render SVG in DOM');
        await page.evaluate(
          (definition, config) => render(definition, config),
          code,
          config
        );
      } catch (e) {
        debug('mermaid failed to render SVG: %o', e);
        ctx.throw(400, 'invalid encoded code');
      }

      debug('select the svg');
      const svg = await page.$('#container > svg');

      debug('take screenshot form container');
      const image = await svg.screenshot({
        type: 'jpeg',
        quality: 90,
        omitBackground: true,
      });

      debug('respond image size: %o', image.length);
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
    debug('shutdown server');
    if (browser) await browser.close();
  };

  try {
    debug('launch headless browser instance');
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
    debug('*** caught exception ***');
    debug(e);
    await shutdown();
    process.exit(1);
  }

  return null;
};
