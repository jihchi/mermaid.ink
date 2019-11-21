import Koa from 'koa';
import route from 'koa-route';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

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
  route.get('/img/:code', async (ctx, code) => {
    ctx.body = { code };
  })
);

(async () => {
  let browser;
  try {
    console.log('launch headless browser instance');
    browser = await puppeteer.launch();

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
