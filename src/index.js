/**
 * @file Entry point for the mermaid.ink server.
 *
 * Initializes the Koa application with Puppeteer browser instance,
 * job queue, and optional database connection, then starts listening
 * for HTTP requests.
 *
 * @module index
 */

import createDebug from 'debug';
import createApp from '#@/app.js';

const debug = createDebug('app:index');
const PORT = process.env.PORT || 3000;

/**
 * Immediately Invoked Function Expression (IIFE) that bootstraps the server.
 *
 * Creates the application instance via the {@link module:app} default export
 * and starts the HTTP server on the configured port.
 *
 * @async
 * @returns {Promise<void>}
 */
(async () => {
  const { app } = await createApp();
  app.listen(PORT);
  debug('server listening on %o', PORT);
})();
