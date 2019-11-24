const createDebug = require('debug');
const createApp = require('./app');

const debug = createDebug('app:index');
const PORT = process.env.PORT || 3000;

(async () => {
  const { app } = await createApp();
  await app.listen(PORT);
  debug('server listening on %o', PORT);
})();
