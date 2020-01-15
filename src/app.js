const Koa = require('koa');
const createDebug = require('debug');
const route = require('koa-route');
const puppeteer = require('puppeteer');
const views = require('./views');
const DEBUG_MODE = require('debugMode');

const debug = createDebug('app:main');
const app = new Koa();

app.use(route.get('/', views.home));
app.use(route.get('/services/oembed', views.servicesOembed));
app.use(route.get('/img/:encodedCode', views.img));

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
        '--disable-background-timer-throttling', // Disable task throttling of timer tasks from background pages.
        '--disable-backgrounding-occluded-windows', // Prevent renderer process backgrounding when set.
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-infobars', // Prevent infobars from appearing.
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-offer-upload-credit-cards',
        '--disable-renderer-backgrounding',
        '--disable-sync', // Disables syncing browser data to a Google Account.
        '--enable-async-dns',
        '--enable-simple-cache-backend',
        '--enable-tcp-fast-open',
        '--media-cache-size=33554432',
        '--no-default-browser-check',
        '--no-first-run', // Skip First Run tasks, whether or not it's actually the First Run.
        '--no-pings',
        '--no-sandbox',
        '--no-zygote',
        '--prerender-from-omnibox=disabled',
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
