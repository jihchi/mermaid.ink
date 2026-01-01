// copied from https://github.com/mermaid-js/mermaid-live-editor/blob/develop/src/lib/util/serde.ts
import { inflate } from 'pako';
import { toUint8Array, fromBase64 } from 'js-base64';

/**
 * Error thrown when an unknown serialization format is encountered.
 * @extends Error
 */
class UnknownSerdeError extends Error {
  /**
   * Creates an UnknownSerdeError instance.
   * @param {string} message - The error message describing the unknown format
   */
  constructor(message) {
    super(message);
  }
}

/**
 * Deserializes an encoded state string into a parsed object.
 * Supports 'pako' (compressed) and 'base64' formats. Format is detected by
 * prefix (e.g., 'pako:...'), defaulting to 'base64' if no prefix is present.
 *
 * @private
 * @param {string} state - The serialized state string, optionally prefixed with format type
 * @returns {Object} The parsed state object containing code and mermaid configuration
 * @throws {UnknownSerdeError} When the state uses an unrecognized serialization format
 */
const deserializeState = (state) => {
  let type, serialized;
  if (state.includes(':')) {
    let tempType;
    [tempType, serialized] = state.split(':');
    if (tempType in deserializers) {
      type = tempType;
    } else {
      throw new UnknownSerdeError(`Unknown serde type: ${tempType}`);
    }
  } else {
    type = 'base64';
    serialized = state;
  }
  const json = deserializers[type](serialized);
  return JSON.parse(json);
};

/**
 * Map of deserializer functions for each supported serialization format.
 * @private
 * @type {Object.<string, function(string): string>}
 * @property {function(string): string} pako - Decompresses pako-compressed base64 data
 * @property {function(string): string} base64 - Decodes standard base64 data
 */
const deserializers = {
  pako: (state) => {
    const data = toUint8Array(state);
    return inflate(data, { to: 'string' });
  },
  base64: (state) => {
    return fromBase64(state);
  },
};

/**
 * Parses a serialized mermaid state string and returns the code and configuration.
 * Supports multiple encoding formats: pako-compressed, base64-encoded JSON, and plain base64.
 * Falls back to treating the input as raw mermaid code if parsing fails.
 *
 * @param {string} serializedState - The encoded mermaid state from the URL
 * @returns {{code: string, mermaid: string | Object}} Object containing the mermaid diagram code
 *   and mermaid configuration as either a JSON string or a plain object
 * @throws {UnknownSerdeError} When the state uses an unrecognized serialization format prefix
 */
export default (serializedState) => {
  try {
    return deserializeState(serializedState);
  } catch (error) {
    if (error instanceof UnknownSerdeError) {
      // Re-throw serde error
      throw error;
    }
    // continue previous method.
  }

  const str = Buffer.from(serializedState, 'base64').toString('utf8');
  const defaultState = {
    code: str,
    mermaid: JSON.stringify({ theme: 'default' }),
  };
  let state;
  try {
    state = JSON.parse(str);
    if (state.code === undefined) {
      // not valid json
      state = defaultState;
    }
  } catch (e) {
    state = defaultState;
  }
  return state;
};
