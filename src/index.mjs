import Koa from 'koa';
import route from 'koa-route';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import { getOptionsFromCode } from './shared.mjs';

const DEBUG_MODE = process.env.hasOwnProperty('DEBUG_MODE');
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const indexHTML = resolve(__dirname, './index.html');

const app = new Koa();

app.use(
  route.get('/', async (ctx, next) => {
    ctx.body = { hello: 'mermaid.ink' };
  })
);

app.use(
  route.get('/img/:encodedCode', async (ctx, encodedCode) => {
    console.log('start to render: %o', encodedCode);

    const { page } = ctx;
    const { code, mermaid: config } = getOptionsFromCode(encodedCode);

    console.log('code: %o, config: %o', code, config);

    console.log('invoke mermaid to render SVG in DOM');
    await page.evaluate(
      (definition, config) => render(definition, config),
      code,
      config
    );

    console.log('select the container');
    const container = await page.$('#container');

    console.log('take screenshot form container');
    const image = await container.screenshot({
      type: 'jpeg',
      quality: 90,
      omitBackground: true,
    });

    console.log('respond image size: %o', image.length);
    ctx.type = 'jpeg';
    ctx.body = image;
  })
);

(async () => {
  let browser;
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

    console.log('create new blank page');
    const page = await browser.newPage();

    console.log('load local web page');
    await page.goto(`file://${indexHTML}`);

    app.context.page = page;

    await app.listen(PORT);
    console.log(`server listening on ${PORT}`);
  } catch (e) {
    console.error('*** caught exception ***');
    console.error(e);

    if (browser) await browser.close();
    process.exit(1);
  }
})();
