/**
 * @file Home page route handler that serves the static index.html file.
 * This is the landing page for the mermaid.ink service.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const indexHTML = fs.readFile(
  path.resolve(import.meta.dirname, '../static/index.html'),
  {
    encoding: 'utf-8',
  }
);

/**
 * Koa middleware that serves the home page HTML.
 * @param {import('koa').Context} ctx - Koa context object
 * @param {import('koa').Next} _next - Koa next middleware function (unused)
 * @returns {Promise<void>}
 */
export default async (ctx, _next) => {
  ctx.type = 'text/html';
  ctx.body = await indexHTML;
};
