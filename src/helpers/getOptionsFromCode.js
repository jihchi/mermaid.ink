// copied from https://github.com/mermaid-js/mermaid-live-editor/blob/develop/src/lib/util/serde.ts
import { inflate } from 'pako';
import { toUint8Array, fromBase64 } from 'js-base64';

const DEFAULT_MAX_ENCODED_LENGTH = 65536;
const DEFAULT_MAX_DECODED_LENGTH = 262144;

const parsePositiveInt = (value, defaultValue) => {
  if (!value) return defaultValue;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
};

const MAX_ENCODED_LENGTH = parsePositiveInt(
  process.env.MAX_ENCODED_LENGTH,
  DEFAULT_MAX_ENCODED_LENGTH
);
const MAX_DECODED_LENGTH = parsePositiveInt(
  process.env.MAX_DECODED_LENGTH,
  DEFAULT_MAX_DECODED_LENGTH
);

class UnknownSerdeError extends Error {
  constructor(message) {
    super(message);
  }
}

class PayloadTooLargeError extends Error {
  constructor(message) {
    super(message);
  }
}

export { PayloadTooLargeError };

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

const validateDecodedLength = (str) => {
  if (str.length > MAX_DECODED_LENGTH) {
    throw new PayloadTooLargeError(
      `Decoded diagram exceeds maximum allowed size of ${MAX_DECODED_LENGTH} characters`
    );
  }
  return str;
};

const deserializers = {
  pako: (state) => {
    const data = toUint8Array(state);
    return validateDecodedLength(inflate(data, { to: 'string' }));
  },
  base64: (state) => {
    return validateDecodedLength(fromBase64(state));
  },
};

export default (serializedState) => {
  if (serializedState.length > MAX_ENCODED_LENGTH) {
    throw new PayloadTooLargeError(
      `Encoded diagram exceeds maximum allowed size of ${MAX_ENCODED_LENGTH} characters`
    );
  }

  try {
    return deserializeState(serializedState);
  } catch (error) {
    if (
      error instanceof UnknownSerdeError ||
      error instanceof PayloadTooLargeError
    ) {
      throw error;
    }
    // continue previous method.
  }

  const str = Buffer.from(serializedState, 'base64').toString('utf8');
  validateDecodedLength(str);

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
