import createDebug from 'debug';
import openMermaidPage from '#@/helpers/openMermaidPage.js';
import renderSVG from '#@/helpers/renderSVG.js';
import { TimeoutError } from 'p-queue';
import {
  getQueueAddTimeout,
  extractBgColor,
  extractDimension,
  extractTheme,
  validateQuery,
} from '#@/helpers/utils.js';

const QUEUE_ADD_TIMEOUT = getQueueAddTimeout();

const debug = createDebug('app:renderImgOrSvg');

/**
 * Creates a queue job function that handles the Mermaid rendering pipeline.
 *
 * @private
 * @param {import('koa').Context} ctx - Koa context with browser and query params
 * @param {import('#@/types.js').RenderFunction} render - Output format renderer (img/svg/pdf)
 * @param {Buffer | null} cacheKey - Cache key for storing the result
 * @param {string} encodedCode - Serialized Mermaid state string (e.g., base64 or pako-prefixed)
 * @returns {function({signal: AbortSignal}): Promise<void>} Queue job function
 * @throws {Error} 400 if query validation fails or Mermaid rendering fails
 */
function renderCode(ctx, render, cacheKey, encodedCode) {
  return async ({ signal }) => {
    let page;

    try {
      validateQuery(ctx.query, ctx.state);
    } catch (error) {
      ctx.throw(400, error.message);
    }

    try {
      page = await openMermaidPage(ctx);
      debug('loaded local mermaid page');
      const bgColor = extractBgColor(ctx.query);
      debug('set background color to %s', bgColor);
      const size = extractDimension(ctx.query, ctx.state);
      debug('set size to %s', size);
      const theme = extractTheme(ctx.query);
      debug('set theme to %s', theme);

      if (signal.aborted) {
        debug('timeout triggered, abort rendering SVG');
        return;
      }

      try {
        await renderSVG({ page, encodedCode, bgColor, size, theme });
        debug('rendered SVG in DOM');
      } catch (e) {
        debug('mermaid failed to render SVG: %o', e);
        ctx.throw(400, e);
      }

      if (signal.aborted) {
        debug('timeout triggered, abort producing artifact');
        return;
      }

      await render(ctx, cacheKey, page, size);
      debug('body is ready to respond');
    } finally {
      if (page) {
        await page.close();
      }
    }
  };
}

/**
 * Higher-order function that wraps a render function with queue management,
 * timeout handling, and error recovery.
 *
 * @param {import('#@/types.js').RenderFunction} render - Output format renderer (e.g., img, svg, pdf handler)
 * @returns {function(import('koa').Context, Buffer | null, string, function): Promise<void>}. Middleware-like function accepting (ctx, cacheKey, encodedCode, next)
 * @throws {Error} 503 if the rendering job times out
 * @throws {Error} Re-throws any non-timeout errors from the rendering pipeline
 */
export default (render) => async (ctx, cacheKey, encodedCode, _next) => {
  const controller = new AbortController();

  try {
    debug(`start to render, code: ${encodedCode}`);

    await ctx.renderingJobQueue.add(
      renderCode(ctx, render, cacheKey, encodedCode),
      {
        timeout: QUEUE_ADD_TIMEOUT,
        signal: controller.signal,
      }
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      debug('rendering job timed out');
      controller.abort();
      ctx.throw(503);
    } else {
      debug('*** caught exception from rendering job queue ***');
      debug(error);
      throw error;
    }
  }
};
