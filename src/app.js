const Koa = require('koa');
const createDebug = require('debug');
const route = require('koa-route');
const puppeteer = require('puppeteer');
const views = require('./views');

const debug = createDebug('app:main');
const pptr = createDebug('app:pptr');
const app = new Koa();

app.use(route.get('/', views.home));
app.use(route.get('/services/oembed', views.servicesOembed));
app.use(route.get('/img/:encodedCode', views.img));

async function setup() {
  debug('launch headless browser instance');

  app.context.browser = await puppeteer.launch({
    headless: !pptr.enabled,
    devtools: pptr.enabled,
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

  app.context.browser.on('disconnected', setup);
}

async function shutdown() {
	debug('shutdown server');

  if (app.context.browser) {
    debug('shutdown browser');
    await app.context.browser.close();
  }
}

module.exports = async () => {
  try {
    await setup();
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
};
