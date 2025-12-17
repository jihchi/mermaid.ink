import createDebug from 'debug';
import openMermaidPage from '#@/helpers/openMermaidPage.js';
import renderSVG from '#@/helpers/renderSVG.js';
import { TimeoutError } from 'p-queue';
import { getQueueAddTimeout } from '#@/helpers/utils.js';

const QUEUE_ADD_TIMEOUT = getQueueAddTimeout();

const debug = createDebug('app:renderImgOrSvg');

function bgColorFromContext(ctx) {
  const bgColor = ctx.query.bgColor?.trim();
  if (bgColor && /^(![a-z]+)|([\da-f]{3,8})$/i.test(bgColor)) {
    // either a named color if prefiexed with "!" (e.g. "!red"),
    // or an hexadecimal without the "#" (444, EFEFEF, FF000055)
    return bgColor.startsWith('!') ? bgColor.substring(1) : `#${bgColor}`;
  }
}

function sizeFromContext(ctx) {
  let width = null;
  let height = null;

  if (ctx.query.width) {
    const parsedWidth = Number.parseInt(ctx.query.width, 10);
    if (!parsedWidth) {
      ctx.throw(400, 'invalid width value');
    }
    width = parsedWidth;
  }

  if (ctx.query.height) {
    const parsedHeight = Number.parseInt(ctx.query.height, 10);
    if (!parsedHeight) {
      ctx.throw(400, 'invalid height value');
    }
    height = parsedHeight;
  }

  let scale = 1;
  if (ctx.query.scale) {
    if (!width && !height) {
      ctx.throw(
        400,
        'scale can only be set when either width or height is set'
      );
    }
    const parsedScale = parseFloat(ctx.query.scale);
    if (!parsedScale || parsedScale < 1 || parsedScale > 3) {
      ctx.throw(400, 'invalid scale value - must be a number between 1 and 3');
    }
    scale = parsedScale;
  }

  if (width) {
    width *= scale;

    if (width <= 0 || (ctx.state.maxWidth && width > ctx.state.maxWidth)) {
      ctx.throw(400, `the scaled width must be between 0 and ${ctx.maxWidth}`);
    }
  }

  if (height) {
    height *= scale;

    if (height <= 0 || (ctx.state.maxHeight && height > ctx.state.maxHeight)) {
      ctx.throw(
        400,
        `the scaled height must be between 0 and ${ctx.maxHeight}`
      );
    }
  }

  return { width, height };
}

function themeFromContext(ctx) {
  return ['default', 'neutral', 'dark', 'forest'].includes(
    ctx.query.theme?.toLowerCase()
  )
    ? ctx.query.theme?.toLowerCase()
    : null;
}

function renderCode(ctx, render, encodedCode) {
  return async ({ signal }) => {
    let page;

    try {
      page = await openMermaidPage(ctx);
      debug('loaded local mermaid page');
      const bgColor = bgColorFromContext(ctx);
      debug('set background color to %s', bgColor);
      const size = sizeFromContext(ctx);
      debug('set size to %s', size);
      const theme = themeFromContext(ctx);
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

      await render(ctx, page, size);
      debug('body is ready to respond');
    } finally {
      if (page) {
        await page.close();
      }
    }
  };
}

export default (render) => async (ctx, encodedCode, _next) => {
  const controller = new AbortController();

  try {
    debug(`start to render, code: ${encodedCode}`);

    await ctx.renderingJobQueue.add(renderCode(ctx, render, encodedCode), {
      timeout: QUEUE_ADD_TIMEOUT,
      signal: controller.signal,
    });
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
