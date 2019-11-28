const pathToRegexp = require('path-to-regexp');

module.exports = url => {
  const { pathname } = new URL(url);
  const re = pathToRegexp('/img/:encodedCode');
  const m = re.exec(pathname);

  if (!m) return '';

  const [, encodedCode] = m;
  return encodedCode;
};
