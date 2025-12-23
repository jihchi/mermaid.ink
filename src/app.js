import Koa from 'koa';
import PQueue from 'p-queue';
import cors from '@koa/cors';
import createDebug from 'debug';
import puppeteer from 'puppeteer';
import route from 'koa-route';

import home from '#@/views/home.js';
import img from '#@/views/img.js';
import pdf from '#@/views/pdf.js';
import servicesOembed from '#@/views/services.oembed.js';
import svg from '#@/views/svg.js';
import readCacheFromDb from '#@/helpers/readCacheFromDb.js';
import { connect, disconnect } from '#@/helpers/db.js';
import { getHeadlessMode, getQueueConcurrency } from '#@/helpers/utils.js';

const debug = createDebug('app:main');
const app = new Koa();

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

app.use(route.get('/', home));
app.use(route.get('/services/oembed', servicesOembed));
app.use(route.get('/img/:encodedCode', readCacheFromDb(img, 'img')));
app.use(route.get('/svg/:encodedCode', readCacheFromDb(svg, 'svg')));
app.use(route.get('/pdf/:encodedCode', readCacheFromDb(pdf, 'pdf')));

async function setup() {
  debug('start the service');

  if (app.context.shutdown) {
    debug("application is shutting down, won't re-launch browser");
    return;
  }

  debug('initialize job queue');

  const renderingJobQueue = new PQueue({
    concurrency: getQueueConcurrency(),
  });

  app.context.renderingJobQueue = renderingJobQueue;

  app.context.sql = await connect();

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
      '--disable-gpu',
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
      process.env.CI ? '--no-sandbox' : undefined,
      process.env.CI ? '--no-zygote' : undefined,
      process.env.CI ? '--disable-setuid-sandbox' : undefined,
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

  await disconnect(app.context.sql);
}

export default async () => {
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
