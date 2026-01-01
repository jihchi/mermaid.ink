import createDebug from 'debug';
import createApp from '#@/app.js';

const debug = createDebug('app:index');
const PORT = process.env.PORT || 3000;

(async () => {
  const { app, shutdown } = await createApp();
  const server = app.listen(PORT);
  debug('server listening on %o', PORT);

  const gracefulShutdown = async (signal) => {
    debug('received %s, shutting down gracefully', signal);

    server.close(() => {
      debug('HTTP server closed');
    });

    await shutdown();
    debug('shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();
