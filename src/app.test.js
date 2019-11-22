const supertest = require('supertest');
const createApp = require('./app');

describe('app', () => {
  let request;
  let cleanup;

  beforeAll(async () => {
    const { app, shutdown } = await createApp();
    request = supertest(app.callback());
    cleanup = shutdown;
  });

  afterAll(async () => {
    await cleanup();
  });

  test('GET /', async () => {
    const resp = await request.get('/');
    expect(resp.status).toEqual(200);
    expect(resp.body).toEqual({ hello: 'mermaid.ink' });
  });

  test('GET /img without encoded code', async () => {
    const resp = await request.get('/img');
    expect(resp.status).toEqual(404);
  });

  test('GET /img with encoded code', async () => {
    const resp = await request.get(
      '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
    );
    expect(resp.status).toEqual(200);
    expect(resp.type).toEqual('image/jpeg');
    expect(resp.body.length).toEqual(17571);
  });
});
