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
const RENDER_TIMEOUT = QUEUE_ADD_TIMEOUT * 2;

const debug = createDebug('app:renderImgOrSvg');

function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() =>
    clearTimeout(timeoutId)
  );
}

function renderCode(ctx, render, cacheKey, encodedCode) {
  return async ({ signal }) => {
    let page;
    let pagePromise;

    try {
      validateQuery(ctx.query, ctx.state);
    } catch (error) {
      ctx.throw(400, error.message);
    }

    try {
      pagePromise = openMermaidPage(ctx);
      page = await withTimeout(pagePromise, RENDER_TIMEOUT, 'openMermaidPage');
      debug('loaded local mermaid page');
      const bgColor = extractBgColor(ctx.query);
      debug('set background color to %s', bgColor);
      const size = extractDimension(ctx.query, ctx.state);
      debug('set size to %s', size);
      const theme = extractTheme(ctx.query);
      debug('set theme to %s', theme);

      if (signal.aborted) {
        debug(
          'timeout triggered after page load, abort rendering (encodedCode length: %d)',
          encodedCode.length
        );
        return;
      }

      try {
        await withTimeout(
          renderSVG({ page, encodedCode, bgColor, size, theme }),
          RENDER_TIMEOUT,
          'renderSVG'
        );
        debug('rendered SVG in DOM');
      } catch (e) {
        debug('mermaid failed to render SVG: %o', e);
        ctx.throw(400, e);
      }

      if (signal.aborted) {
        debug(
          'timeout triggered after SVG render, abort producing artifact (encodedCode length: %d)',
          encodedCode.length
        );
        return;
      }

      await withTimeout(
        render(ctx, cacheKey, page, size),
        RENDER_TIMEOUT,
        'render'
      );
      debug('body is ready to respond');
    } finally {
      if (page) {
        await page.close();
      } else if (pagePromise) {
        pagePromise
          .then((p) => p?.close())
          .catch((err) => debug('failed to close orphaned page: %o', err));
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
