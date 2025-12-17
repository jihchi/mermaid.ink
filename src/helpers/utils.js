const SECOND_MS = 1000;

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
