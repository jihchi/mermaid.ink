const Koa = require('koa');
const cors = require('@koa/cors');
const createDebug = require('debug');
const route = require('koa-route');
const puppeteer = require('puppeteer');
const { createClient, RESP_TYPES } = require('redis');

const views = require('./views');

const debug = createDebug('app:main');
const app = new Koa();

const getHeadlessMode = () => {
  const mode = process.env.HEADLESS_MODE?.toLowerCase();

  if (mode) {
    debug('headless mode:', mode);
  }

  if (mode === 'shell') {
    return 'shell';
  }

  if (mode === 'true') {
    return true;
  }

  if (mode === 'false') {
    return false;
  }
};

// Set global config
app.use(async (ctx, next) => {
  ctx.state.customFontAwesomeCssUrl = process.env.FONT_AWESOME_CSS_URL;
  ctx.state.maxWidth = process.env.MAX_WIDTH ? process.env.MAX_WIDTH : 10000;
  ctx.state.maxHeight = process.env.MAX_HEIGHT ? process.env.MAX_HEIGHT : 10000;
  await next();
});

app.use(
  cors({
    allowMethods: 'GET',
    origin(ctx) {
      return ctx.get('Origin') || '*';
    },
  })
);

const fileCache = (handler) => async (ctx, encodedCode, next) => {
  const {
    request: { url },
    cache,
  } = ctx;
  const cacheKey = `render:${url}`;
  const cached = await cache.hmGet(cacheKey, ['status', 'body']);
  const [status, body] = cached;
  const truncatedUrl = cacheKey.slice(0, 100) + (url.length > 100 ? '...' : '');

  if (body != null) {
    debug('hit cache!', truncatedUrl);
    ctx.status = parseInt(status.toString(), 10);
    ctx.body = body;
    return;
  }

  debug('no cache, start rendering', truncatedUrl);
  let doCache = true;
  try {
    await handler(ctx, encodedCode, next);
  } catch (error) {
    doCache = error.status < 500;
    debug('caught exception', { doCache, error });
    ctx.status = error.status;
  }

  if (doCache) {
    debug('cache result', {
      truncatedUrl,
      status: ctx.response.status,
      body: ctx.response.body?.length,
    });
    const {
      response: { status, body = '' },
    } = ctx;
    await cache.hSet(cacheKey, { status, body });
  }
};

app.use(route.get('/', views.home));
app.use(route.get('/services/oembed', fileCache(views.servicesOembed)));
app.use(route.get('/img/:encodedCode', fileCache(views.img)));
app.use(route.get('/svg/:encodedCode', fileCache(views.svg)));
app.use(route.get('/pdf/:encodedCode', fileCache(views.pdf)));

app.use(
  route.get('/info', async (ctx) => {
    const pages = await ctx.browser.pages();
    ctx.body = pages.length;
  })
);

async function setup() {
  if (app.context.shutdown) {
    debug("application is shutting down, won't re-launch browser");
    return;
  }

  debug('connect cache server');
  const cache = createClient({ url: process.env.REDIS_URL }).withTypeMapping({
    [RESP_TYPES.BLOB_STRING]: Buffer,
  });
  cache.on('error', (error) => debug('cache client error', error));
  app.context.cache = cache;
  await cache.connect();

  debug('launch headless browser instance');

  app.context.browser = await puppeteer.launch({
    protocolTimeout: process.env.PROTOCOL_TIMEOUT,
    headless: getHeadlessMode(),
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
      '--no-sandbox',
    ].filter(Boolean),
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

  if (app.context.cache) {
    debug('disconnect from cache server');
    await app.context.cache.quit();
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
