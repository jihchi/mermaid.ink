const puppeteer = require('puppeteer');
const createDebug = require('debug');
const path = require('path');
const genericPool = require('generic-pool');

const debug = createDebug('app:browsersPool');
const mermaidHTML = path.resolve(__dirname, './static/mermaid.html');

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

const factory = {
  async create() {
    debug('create new browser instance');
    const browser = await puppeteer.launch({
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
        process.env.CI ? '--no-sandbox' : undefined,
      ].filter(Boolean),
    });

    debug('create new page');
    const page = await browser.newPage();

    debug('load default page');
    await page.goto(`file://${mermaidHTML}`);

    return { browser, page };
  },
  async destroy({ browser }) {
    debug('close browser');
    return browser.close();
  },
};

exports.createPool = (opts) => genericPool.createPool(factory, opts);
