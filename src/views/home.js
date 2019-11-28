const { promises: fs } = require('fs');
const path = require('path');

const indexHTML = fs.readFile(path.resolve(__dirname, '../static/index.html'), {
  encoding: 'utf-8',
});

module.exports = async (ctx, _next) => {
  ctx.type = 'text/html';
  ctx.body = await indexHTML;
};
