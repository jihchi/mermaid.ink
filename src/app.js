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
