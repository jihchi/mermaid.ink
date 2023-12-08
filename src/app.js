const Koa = require('koa');
const cors = require('@koa/cors');
const createDebug = require('debug');
const route = require('koa-route');
const puppeteer = require('puppeteer');
const views = require('./views');

const debug = createDebug('app:main');
const pptr = createDebug('app:pptr');
const app = new Koa();

app.use(cors({ allowMethods: 'GET' }));
app.use(route.get('/', views.home));
app.use(route.get('/services/oembed', views.servicesOembed));
app.use(route.get('/img/:encodedCode', views.img));
app.use(route.get('/svg/:encodedCode', views.svg));

async function setup() {
  if (app.context.shutdown) {
    debug("application is shutting down, won't re-launch browser");
    return;
  }

  debug('launch headless browser instance');

  app.context.browser = await puppeteer.launch({
    executablePath: process.env.MERMAID_INK_USE_CHROMIUM
      ? 'chromium'
      : undefined,
    headless: pptr.enabled ? false : 'new',
    devtools: pptr.enabled,
    dumpio: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    // https://peter.sh/experiments/chromium-command-line-switches/
    args: [
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-device-discovery-notifications',
      '--disable-extensions',
      '--disable-hang-monitor',
      '--disable-infobars',
      '--disable-ipc-flooding-protection',
      '--disable-new-avatar-menu',
      '--disable-new-profile-management',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-offer-upload-credit-cards',
      '--disable-password-generation',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-renderer-throttling',
      '--disable-restore-session-state',
      '--disable-save-password-bubble',
      '--disable-single-click-autofill',
      '--disable-sync',
      '--disable-translate',
      '--enable-async-dns',
      '--enable-simple-cache-backend',
      '--enable-tcp-fast-open',
      '--media-cache-size=33554432',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--noerrdialogs',
      '--prerender-from-omnibox=disabled',
      // less-secure workaround to enable `import .. from '../node_modules/..'` in `src/static/mermaid.html`
      '--allow-file-access-from-files',
    ],
  });

  app.context.browser.on('disconnected', setup);
}

async function shutdown() {
  debug('shutdown server');
  app.context.shutdown = true;

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
