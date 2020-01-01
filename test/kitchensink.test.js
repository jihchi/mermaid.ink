const supertest = require('supertest');
const createApp = require('../src/app');

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
    expect(resp.type).toEqual('text/html');
    expect(resp.charset).toEqual('utf-8');
  });

  describe('GET /services/oembed', () => {
    test('returns 400 when url is missing', async () => {
      const resp = await request.get('/services/oembed');
      expect(resp.status).toEqual(400);
      expect(resp.text).toMatchInlineSnapshot(`"query \\"url\\" is required"`);
    });

    test('returns 404 when url is invalid', async () => {
      const url = encodeURIComponent('abc');
      const resp = await request.get(`/services/oembed?url=${url}`);
      expect(resp.status).toEqual(404);
      expect(resp.text).toMatchInlineSnapshot(`"Error: Invalid URL"`);
    });

    test('returns 404 when protocol is unsupported', async () => {
      const url = encodeURIComponent('http://mermaid.ink');
      const resp = await request.get(`/services/oembed?url=${url}`);
      expect(resp.status).toEqual(404);
      expect(resp.text).toMatchInlineSnapshot(
        `"Error: URL protocol supported: https"`
      );
    });

    test('returns 404 when hostname is unsupported', async () => {
      const url = encodeURIComponent('https://github.com');
      const resp = await request.get(`/services/oembed?url=${url}`);
      expect(resp.status).toEqual(404);
      expect(resp.text).toMatchInlineSnapshot(
        `"Error: URL hostname supported: mermaid.ink"`
      );
    });

    test('returns 404 when pathname is unsupported', async () => {
      const url = encodeURIComponent('https://mermaid.ink/foo/bar');
      const resp = await request.get(`/services/oembed?url=${url}`);
      expect(resp.status).toEqual(404);
      expect(resp.text).toMatchInlineSnapshot(
        `"Error: URL pathname supported: /img/:code, /svg/:code"`
      );
    });

    test('returns correct response', async () => {
      const url = encodeURIComponent(
        'https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtBXSAtLT4gQihCKVxuXHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19'
      );
      const resp = await request.get(`/services/oembed?url=${url}`);

      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('application/json');
      expect(resp.charset).toEqual('utf-8');
      expect(resp.body).toMatchObject({
        height: 142,
        provider_name: 'Mermaid Ink',
        provider_url: 'https://mermaid.ink',
        type: 'photo',
        url:
          'https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtBXSAtLT4gQihCKVxuXHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19',
        version: '1.0',
        width: 46.671875,
      });
    });
  });

  test('GET /img without encoded code', async () => {
    const resp = await request.get('/img');
    expect(resp.status).toEqual(404);
  });

  test('GET flowchart', async () => {
    const resp = await request.get(
      '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
    );
    expect(resp.status).toEqual(200);
    expect(resp.type).toEqual('image/jpeg');
    expect(resp.body.length).toBeGreaterThan(10000);
  });

  test('GET sequence diagram', async () => {
    const resp = await request.get(
      '/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgQWxpY2UgLT4-IEJvYjogSGVsbG8gQm9iLCBob3cgYXJlIHlvdT9cbiAgICBCb2ItLT4-Sm9objogSG93IGFib3V0IHlvdSBKb2huP1xuICAgIEJvYi0teCBBbGljZTogSSBhbSBnb29kIHRoYW5rcyFcbiAgICBCb2IteCBKb2huOiBJIGFtIGdvb2QgdGhhbmtzIVxuICAgIE5vdGUgcmlnaHQgb2YgSm9objogQm9iIHRoaW5rcyBhIGxvbmc8YnIvPmxvbmcgdGltZSwgc28gbG9uZzxici8-dGhhdCB0aGUgdGV4dCBkb2VzPGJyLz5ub3QgZml0IG9uIGEgcm93LlxuXG4gICAgQm9iLS0-QWxpY2U6IENoZWNraW5nIHdpdGggSm9obi4uLlxuICAgIEFsaWNlLT5Kb2huOiBZZXMuLi4gSm9obiwgaG93IGFyZSB5b3U_IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0'
    );
    expect(resp.status).toEqual(200);
    expect(resp.type).toEqual('image/jpeg');
    expect(resp.body.length).toBeGreaterThan(10000);
  });

  test('GET 400 when encoded code is invalid', async () => {
    const resp = await request.get('/img/eyJjb2RlIjoiZ3JhcGgg');
    expect(resp.status).toEqual(400);
  });
});
