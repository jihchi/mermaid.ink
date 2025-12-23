import createDebug from 'debug';

const SECOND_MS = 1000;

const debug = createDebug('app:helpers:utils');

export const getHeadlessMode = () => {
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

export const getQueueConcurrency = () => {
  const envConcurrency = process.env.QUEUE_CONCURRENCY;

  if (envConcurrency) {
    const concurrency = Number.parseInt(envConcurrency, 10);

    if (Number.isFinite(concurrency)) {
      return concurrency;
    }
  }

  return 1;
};

export const getQueueAddTimeout = () => {
  const envTimeout = process.env.QUEUE_ADD_TIMEOUT;

  if (envTimeout) {
    const timeout = Number.parseInt(envTimeout, 10);

    if (Number.isFinite(timeout)) {
      return timeout;
    }
  }

  return 3 * SECOND_MS;
};

export const extractBgColor = (query) => {
  const bgColor = query?.bgColor?.trim();
  if (bgColor && /^(![a-z]+)|([\da-f]{3,8})$/i.test(bgColor)) {
    // either a named color if prefixed with "!" (e.g. "!red"),
    // or hexadecimal without the "#" (444, EFEFEF, FF000055)
    return bgColor.startsWith('!') ? bgColor.substring(1) : `#${bgColor}`;
  }
};

export const extractDimension = (query, options) => {
  if (query == null) {
    return;
  }

  let width = null;
  let height = null;
  let scale = 1;

  if (query.width) {
    const parsedWidth = Number.parseInt(query.width, 10);
    if (Number.isFinite(parsedWidth)) {
      width = parsedWidth;
    }
  }

  if (query.height) {
    const parsedHeight = Number.parseInt(query.height, 10);
    if (Number.isFinite(parsedHeight)) {
      height = parsedHeight;
    }
  }

  if (query.scale && (width || height)) {
    const parsedScale = Number.parseFloat(query.scale);
    if (Number.isFinite(parsedScale) && parsedScale >= 1 && parsedScale <= 3) {
      // round scale to 2 decimal places
      scale = Math.round((parsedScale + Number.EPSILON) * 100) / 100;
    }
  }

  if (width) {
    const scaledWidth = width * scale;

    if (
      scaledWidth > 0 &&
      (!options?.maxWidth || scaledWidth <= options.maxWidth)
    ) {
      width = scaledWidth;
    }
  }

  if (height) {
    const scaledHeight = height * scale;

    if (
      scaledHeight > 0 &&
      (!options?.maxHeight || scaledHeight <= options.maxHeight)
    ) {
      height = scaledHeight;
    }
  }

  return { width, height };
};

export const extractTheme = (query) => {
  if (!query?.theme) {
    return;
  }

  const theme = query.theme.toLowerCase();

  switch (theme) {
    case 'default':
    case 'neutral':
    case 'dark':
    case 'forest':
      return theme;
  }
};

export const extractPaper = (query) => {
  if (query?.paper) {
    const paper = query.paper.toLowerCase();

    switch (paper) {
      case 'letter':
      case 'legal':
      case 'tabloid':
      case 'ledger':
      case 'a0':
      case 'a1':
      case 'a2':
      case 'a3':
      case 'a4':
      case 'a5':
      case 'a6':
        return paper;
    }
  }

  return 'a4';
};

export const extractImageType = (query) => {
  // read type from query parameter, allow all types supported by puppeteer https://pptr.dev/api/puppeteer.screenshotoptions.type
  // defaults to jpeg, because that was originally the hardcoded type
  const type = query?.type?.toLowerCase();

  switch (type) {
    case 'jpeg':
    case 'png':
    case 'webp':
      return type;
  }

  return 'jpeg';
};

export const isLandscape = (query) => {
  return query?.landscape != null;
};

export const isFit = (query) => {
  return query?.fit != null;
};

export const validateQuery = (query = {}, state = {}) => {
  let width;
  let height;

  if (query.width) {
    width = Number.parseInt(query.width, 10);
    if (!Number.isFinite(width) || width <= 0) {
      throw new Error('invalid width value');
    }
  }

  if (query.height) {
    height = Number.parseInt(query.height, 10);
    if (!Number.isFinite(height) || height <= 0) {
      throw new Error('invalid height value');
    }
  }

  if (query.scale) {
    if (!width && !height) {
      throw new Error(
        'scale can only be set when either width or height is set'
      );
    }

    const scale = Number.parseFloat(query.scale);
    if (!Number.isFinite(scale) || scale < 1 || scale > 3) {
      throw new Error('invalid scale value - must be a number between 1 and 3');
    }

    const scaledWidth = width * scale;
    if (scaledWidth <= 0 || (state.maxWidth && scaledWidth > state.maxWidth)) {
      throw new Error(
        `the scaled width must be between 0 and ${state.maxWidth}`
      );
    }

    const scaledHeight = height * scale;
    if (
      scaledHeight <= 0 ||
      (state.maxHeight && scaledHeight > state.maxHeight)
    ) {
      throw new Error(
        `the scaled height must be between 0 and ${state.maxHeight}`
      );
    }
  }
};
