import createDebug from 'debug';

const SECOND_MS = 1000;
const DEFAULT_MAX_DIMENSION = 10000;
const DEFAULT_PROTOCOL_TIMEOUT = 30000;

const debug = createDebug('app:helpers:utils');

export const parsePositiveInt = (envValue, defaultValue) => {
  if (!envValue) return defaultValue;
  const n = Number.parseInt(envValue, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(
      `Invalid env value "${envValue}": must be a positive integer`
    );
  }
  return n;
};

export const getMaxWidth = () =>
  parsePositiveInt(process.env.MAX_WIDTH, DEFAULT_MAX_DIMENSION);

export const getMaxHeight = () =>
  parsePositiveInt(process.env.MAX_HEIGHT, DEFAULT_MAX_DIMENSION);

export const getProtocolTimeout = () => {
  const envValue = process.env.PROTOCOL_TIMEOUT;
  if (!envValue) return DEFAULT_PROTOCOL_TIMEOUT;
  const n = Number.parseInt(envValue, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(
      `Invalid PROTOCOL_TIMEOUT "${envValue}": must be a positive integer`
    );
  }
  return n;
};

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

const parseDimensions = (query) => {
  let width = null;
  let height = null;
  let scale = null;

  if (query?.width) {
    const parsed = Number.parseInt(query.width, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      width = parsed;
    }
  }

  if (query?.height) {
    const parsed = Number.parseInt(query.height, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      height = parsed;
    }
  }

  if (query?.scale) {
    const parsed = Number.parseFloat(query.scale);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 3) {
      scale = Math.round((parsed + Number.EPSILON) * 100) / 100;
    }
  }

  return { width, height, scale };
};

export const extractDimension = (query, options) => {
  if (query == null) {
    return;
  }

  let { width, height, scale } = parseDimensions(query);
  scale = scale ?? 1;

  if (width) {
    if (options?.maxWidth && width > options.maxWidth) {
      width = null;
    } else {
      const scaledWidth = width * scale;
      if (
        scaledWidth > 0 &&
        (!options?.maxWidth || scaledWidth <= options.maxWidth)
      ) {
        width = scaledWidth;
      }
    }
  }

  if (height) {
    if (options?.maxHeight && height > options.maxHeight) {
      height = null;
    } else {
      const scaledHeight = height * scale;
      if (
        scaledHeight > 0 &&
        (!options?.maxHeight || scaledHeight <= options.maxHeight)
      ) {
        height = scaledHeight;
      }
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
  const { maxWidth, maxHeight } = state;

  if (query.width) {
    const parsed = Number.parseInt(query.width, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error('invalid width value');
    }
    if (maxWidth && parsed > maxWidth) {
      throw new Error(`width must be between 0 and ${maxWidth}`);
    }
  }

  if (query.height) {
    const parsed = Number.parseInt(query.height, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error('invalid height value');
    }
    if (maxHeight && parsed > maxHeight) {
      throw new Error(`height must be between 0 and ${maxHeight}`);
    }
  }

  if (query.scale) {
    const { width, height, scale } = parseDimensions(query);

    if (!width && !height) {
      throw new Error(
        'scale can only be set when either width or height is set'
      );
    }

    if (scale === null) {
      throw new Error('invalid scale value - must be a number between 1 and 3');
    }

    if (width) {
      const scaledWidth = width * scale;
      if (maxWidth && scaledWidth > maxWidth) {
        throw new Error(`the scaled width must be between 0 and ${maxWidth}`);
      }
    }

    if (height) {
      const scaledHeight = height * scale;
      if (maxHeight && scaledHeight > maxHeight) {
        throw new Error(`the scaled height must be between 0 and ${maxHeight}`);
      }
    }
  }
};
