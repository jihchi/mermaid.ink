// copied from https://github.com/mermaid-js/mermaid-live-editor/blob/develop/src/lib/util/serde.ts
const { inflate } = require('pako');
const { toUint8Array, fromBase64 } = require('js-base64');

class UnknownSerdeError extends Error {
  constructor(message) {
    super(message);
  }
}

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

const deserializers = {
  pako: (state) => {
    const data = toUint8Array(state);
    return inflate(data, { to: 'string' });
  },
  base64: (state) => {
    return fromBase64(state);
  },
};

module.exports = (serializedState) => {
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
