import createDebug from 'debug';

/** @constant {number} Number of milliseconds in one second */
const SECOND_MS = 1000;

const debug = createDebug('app:helpers:utils');

/**
 * Gets the Puppeteer headless mode from the HEADLESS_MODE environment variable.
 * @returns {'shell' | true | false | undefined} The headless mode - 'shell' for new headless,
 *   true for old headless, false for headed mode, or undefined if not set.
 */
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

/**
 * Gets the queue concurrency from the QUEUE_CONCURRENCY environment variable.
 * @returns {number} The queue concurrency value, defaults to 1 if not set or invalid.
 */
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

/**
 * Gets the queue add timeout from the QUEUE_ADD_TIMEOUT environment variable.
 * @returns {number} The queue timeout in milliseconds, defaults to 3000ms if not set or invalid.
 */
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

/**
 * Extracts and normalizes the background color from query parameters.
 * @param {{bgColor: string | undefined}} query - The query parameters object. bgColor is background color as a named color prefixed with "!" (e.g., "!red")
 *   or a hexadecimal value without "#" (e.g., "444", "EFEFEF", "FF000055").
 * @returns {string | undefined} The normalized color (named color or hex with "#" prefix),
 *   or undefined if invalid or not provided.
 */
export const extractBgColor = (query) => {
  const bgColor = query?.bgColor?.trim();
  if (bgColor && /^(![a-z]+)|([\da-f]{3,8})$/i.test(bgColor)) {
    // either a named color if prefixed with "!" (e.g. "!red"),
    // or hexadecimal without the "#" (444, EFEFEF, FF000055)
    return bgColor.startsWith('!') ? bgColor.substring(1) : `#${bgColor}`;
  }
};

/**
 * Extracts width, height, and scale dimensions from query parameters.
 * Scale (1-3) is applied as a multiplier to width/height when both scale and dimensions are provided.
 * @param {{width: string | undefined, height: string | undefined, scale: string | undefined}} query - The query parameters object. width/height in pixels, scale is multiplier (1-3).
 * @param {{maxWidth: number | undefined, maxHeight: number | undefined}} [options] - Optional constraints for dimensions.
 * @returns {{ width: number | null, height: number | null } | undefined} Object with scaled dimensions,
 *   or undefined if query is null/undefined.
 *
 */
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

/**
 * Extracts the Mermaid theme from query parameters.
 * @param {{theme: string | undefined}} query - The query parameters object. theme is the theme name (case-insensitive).
 * @returns {import('#@/types.js').MermaidTheme | undefined} The validated theme name, or undefined if not provided or invalid.
 */
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

/**
 * Extracts the PDF paper size from query parameters.
 * @param {{paper: string | undefined}} query - The query parameters object. paper is the paper size name (case-insensitive).
 * @returns {import('#@/types.js').PaperSize} The paper size, defaults to 'a4'.
 */
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

/**
 * Extracts the image output type from query parameters.
 * @param {{type: string | undefined}} query - The query parameters object. type is the image type (case-insensitive).
 * @returns {import('#@/types.js').ImageType} The image type, defaults to 'jpeg'.
 */
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

/**
 * Checks if landscape mode is enabled for PDF output.
 * @param {{landscape: string | undefined}} query - The query parameters object. landscape enables landscape mode if present (any value).
 * @returns {boolean} True if landscape mode is enabled.
 */
export const isLandscape = (query) => {
  return query?.landscape != null;
};

/**
 * Checks if fit-to-content mode is enabled for PDF output.
 * @param {Object} query - The query parameters object.
 * @param {*} [query.fit] - If present (any value), enables fit-to-content mode.
 * @returns {boolean} True if fit-to-content mode is enabled.
 */
export const isFit = (query) => {
  return query?.fit != null;
};

/**
 * Validates query parameters for dimension and scale values.
 * @param {{width: string | undefined, height: string | undefined, scale: string | undefined}} [query={}] - The query parameters object.
 * @param {{maxWidth: number | undefined, maxHeight: number | undefined}} [state={}] - State object containing constraints.
 * @throws {Error} If width is not a positive number.
 * @throws {Error} If height is not a positive number.
 * @throws {Error} If scale is set without width or height.
 * @throws {Error} If scale is not between 1 and 3.
 * @throws {Error} If scaled width exceeds maxWidth.
 * @throws {Error} If scaled height exceeds maxHeight.
 * @returns {void}
 */
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
        `the scaled width must be between 1 and ${state.maxWidth}`
      );
    }

    const scaledHeight = height * scale;
    if (
      scaledHeight <= 0 ||
      (state.maxHeight && scaledHeight > state.maxHeight)
    ) {
      throw new Error(
        `the scaled height must be between 1 and ${state.maxHeight}`
      );
    }
  }
};
