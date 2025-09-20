const Koa = require('koa');
const cors = require('@koa/cors');
const createDebug = require('debug');
const route = require('koa-route');

const views = require('./views');
const browsersPool = require('./browsersPool');

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
app.use(route.get('/', views.home));
app.use(route.get('/services/oembed', views.servicesOembed));
app.use(route.get('/img/:encodedCode', views.img));
app.use(route.get('/svg/:encodedCode', views.svg));
app.use(route.get('/pdf/:encodedCode', views.pdf));

async function setup() {
  if (app.context.shutdown) {
    debug("application is shutting down, won't re-launch browser");
    return;
  }

  debug('launch browsers pool');

  app.context.browsersPool = browsersPool.createPool();
}

async function shutdown() {
  debug('shutdown server');
  app.context.shutdown = true;

  debug('drain browsers pool');
  await app.context.browsersPool.drain();
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
