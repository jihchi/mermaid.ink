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
