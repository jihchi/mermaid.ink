import fs from 'node:fs/promises';
import path from 'node:path';

const indexHTML = fs.readFile(
  path.resolve(import.meta.dirname, '../static/index.html'),
  {
    encoding: 'utf-8',
  }
);

export default async (ctx, _next) => {
  ctx.type = 'text/html';
  ctx.body = await indexHTML;
};
