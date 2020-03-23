const supertest = require('supertest');
const createApp = require('../src/app');

describe('app', () => {
  let request;
  let app;
  let shutdown;

  beforeAll(async () => {
    ({ app, shutdown } = await createApp());
    request = supertest(app.callback());
  });

  afterAll(async () => {
    await shutdown();
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
        height: expect.any(Number),
        provider_name: 'Mermaid Ink',
        provider_url: 'https://mermaid.ink',
        type: 'photo',
        url:
          'https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtBXSAtLT4gQihCKVxuXHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19',
        version: '1.0',
        width: expect.any(Number),
      });
    });
  });

  describe('/img', () => {
    test('returns 400 when there is no code provided', async () => {
      const resp = await request.get('/img');
      expect(resp.status).toEqual(404);
    });

    test('flowchart', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(10000);
    });

    test('sequence diagram', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgQWxpY2UgLT4-IEJvYjogSGVsbG8gQm9iLCBob3cgYXJlIHlvdT9cbiAgICBCb2ItLT4-Sm9objogSG93IGFib3V0IHlvdSBKb2huP1xuICAgIEJvYi0teCBBbGljZTogSSBhbSBnb29kIHRoYW5rcyFcbiAgICBCb2IteCBKb2huOiBJIGFtIGdvb2QgdGhhbmtzIVxuICAgIE5vdGUgcmlnaHQgb2YgSm9objogQm9iIHRoaW5rcyBhIGxvbmc8YnIvPmxvbmcgdGltZSwgc28gbG9uZzxici8-dGhhdCB0aGUgdGV4dCBkb2VzPGJyLz5ub3QgZml0IG9uIGEgcm93LlxuXG4gICAgQm9iLS0-QWxpY2U6IENoZWNraW5nIHdpdGggSm9obi4uLlxuICAgIEFsaWNlLT5Kb2huOiBZZXMuLi4gSm9obiwgaG93IGFyZSB5b3U_IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(10000);
    });

    test('class diagram', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiY2xhc3NEaWFncmFtXG5cdEFuaW1hbCA8fC0tIER1Y2tcblx0QW5pbWFsIDx8LS0gRmlzaFxuXHRBbmltYWwgPHwtLSBaZWJyYVxuXHRBbmltYWwgOiAraW50IGFnZVxuXHRBbmltYWwgOiArU3RyaW5nIGdlbmRlclxuXHRBbmltYWw6ICtpc01hbW1hbCgpXG5cdEFuaW1hbDogK21hdGUoKVxuXHRjbGFzcyBEdWNre1xuXHRcdCtTdHJpbmcgYmVha0NvbG9yXG5cdFx0K3N3aW0oKVxuXHRcdCtxdWFjaygpXG5cdH1cblx0Y2xhc3MgRmlzaHtcblx0XHQtaW50IHNpemVJbkZlZXRcblx0XHQtY2FuRWF0KClcblx0fVxuXHRjbGFzcyBaZWJyYXtcblx0XHQrYm9vbCBpc193aWxkXG5cdFx0K3J1bigpXG5cdH1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(10000);
    });

    test('state diagram', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoic3RhdGVEaWFncmFtXG5cdFsqXSAtLT4gU3RpbGxcblx0U3RpbGwgLS0-IFsqXVxuXG5cdFN0aWxsIC0tPiBNb3Zpbmdcblx0TW92aW5nIC0tPiBTdGlsbFxuXHRNb3ZpbmcgLS0-IENyYXNoXG5cdENyYXNoIC0tPiBbKl1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(10000);
    });

    test('gantt chart', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ2FudHRcblx0dGl0bGUgQSBHYW50dCBEaWFncmFtXG5cdGRhdGVGb3JtYXQgIFlZWVktTU0tRERcblx0c2VjdGlvbiBTZWN0aW9uXG5cdEEgdGFzayAgICAgICAgICAgOmExLCAyMDE0LTAxLTAxLCAzMGRcblx0QW5vdGhlciB0YXNrICAgICA6YWZ0ZXIgYTEgICwgMjBkXG5cdHNlY3Rpb24gQW5vdGhlclxuXHRUYXNrIGluIHNlYyAgICAgIDoyMDE0LTAxLTEyICAsIDEyZFxuXHRhbm90aGVyIHRhc2sgICAgICA6IDI0ZFxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(10000);
    });

    test('pie chart', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoicGllIHRpdGxlIFBldHMgYWRvcHRlZCBieSB2b2x1bnRlZXJzXG5cdFwiRG9nc1wiIDogMzg2XG5cdFwiQ2F0c1wiIDogODVcblx0XCJSYXRzXCIgOiAxNVxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(10000);
    });

    test('returns 400 when encoded code is invalid', async () => {
      const resp = await request.get('/img/eyJjb2RlIjoiZ3JhcGgg');
      expect(resp.status).toEqual(400);
    });
  });

  describe('/svg', () => {
    test('returns 400 when there is no code provided', async () => {
      const resp = await request.get('/svg');
      expect(resp.status).toEqual(404);
    });

    test('flowchart', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.toString()).toMatchSnapshot();
    });

    test('sequence diagram', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgQWxpY2UgLT4-IEJvYjogSGVsbG8gQm9iLCBob3cgYXJlIHlvdT9cbiAgICBCb2ItLT4-Sm9objogSG93IGFib3V0IHlvdSBKb2huP1xuICAgIEJvYi0teCBBbGljZTogSSBhbSBnb29kIHRoYW5rcyFcbiAgICBCb2IteCBKb2huOiBJIGFtIGdvb2QgdGhhbmtzIVxuICAgIE5vdGUgcmlnaHQgb2YgSm9objogQm9iIHRoaW5rcyBhIGxvbmc8YnIvPmxvbmcgdGltZSwgc28gbG9uZzxici8-dGhhdCB0aGUgdGV4dCBkb2VzPGJyLz5ub3QgZml0IG9uIGEgcm93LlxuXG4gICAgQm9iLS0-QWxpY2U6IENoZWNraW5nIHdpdGggSm9obi4uLlxuICAgIEFsaWNlLT5Kb2huOiBZZXMuLi4gSm9obiwgaG93IGFyZSB5b3U_IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.toString()).toMatchSnapshot();
    });

    test('class diagram', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiY2xhc3NEaWFncmFtXG5cdEFuaW1hbCA8fC0tIER1Y2tcblx0QW5pbWFsIDx8LS0gRmlzaFxuXHRBbmltYWwgPHwtLSBaZWJyYVxuXHRBbmltYWwgOiAraW50IGFnZVxuXHRBbmltYWwgOiArU3RyaW5nIGdlbmRlclxuXHRBbmltYWw6ICtpc01hbW1hbCgpXG5cdEFuaW1hbDogK21hdGUoKVxuXHRjbGFzcyBEdWNre1xuXHRcdCtTdHJpbmcgYmVha0NvbG9yXG5cdFx0K3N3aW0oKVxuXHRcdCtxdWFjaygpXG5cdH1cblx0Y2xhc3MgRmlzaHtcblx0XHQtaW50IHNpemVJbkZlZXRcblx0XHQtY2FuRWF0KClcblx0fVxuXHRjbGFzcyBaZWJyYXtcblx0XHQrYm9vbCBpc193aWxkXG5cdFx0K3J1bigpXG5cdH1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.toString()).toMatchSnapshot();
    });

    test('state diagram', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoic3RhdGVEaWFncmFtXG5cdFsqXSAtLT4gU3RpbGxcblx0U3RpbGwgLS0-IFsqXVxuXG5cdFN0aWxsIC0tPiBNb3Zpbmdcblx0TW92aW5nIC0tPiBTdGlsbFxuXHRNb3ZpbmcgLS0-IENyYXNoXG5cdENyYXNoIC0tPiBbKl1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.toString()).toMatchSnapshot();
    });

    test('gantt chart', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ2FudHRcblx0dGl0bGUgQSBHYW50dCBEaWFncmFtXG5cdGRhdGVGb3JtYXQgIFlZWVktTU0tRERcblx0c2VjdGlvbiBTZWN0aW9uXG5cdEEgdGFzayAgICAgICAgICAgOmExLCAyMDE0LTAxLTAxLCAzMGRcblx0QW5vdGhlciB0YXNrICAgICA6YWZ0ZXIgYTEgICwgMjBkXG5cdHNlY3Rpb24gQW5vdGhlclxuXHRUYXNrIGluIHNlYyAgICAgIDoyMDE0LTAxLTEyICAsIDEyZFxuXHRhbm90aGVyIHRhc2sgICAgICA6IDI0ZFxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.toString()).toMatchSnapshot();
    });

    test('pie chart', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoicGllIHRpdGxlIFBldHMgYWRvcHRlZCBieSB2b2x1bnRlZXJzXG5cdFwiRG9nc1wiIDogMzg2XG5cdFwiQ2F0c1wiIDogODVcblx0XCJSYXRzXCIgOiAxNVxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.toString()).toMatchSnapshot();
    });

    test('returns 400 when encoded code is invalid', async () => {
      const resp = await request.get('/svg/eyJjb2RlIjoiZ3JhcGgg');
      expect(resp.status).toEqual(400);
    });
  });

  test.skip('GET 200 even though browser is crashed or disconnected', async () => {
    // this will trigger 'disconnected' event and app will try to re-launch browser
    await app.context.browser.close();
    const resp = await request.get(
      '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
    );
    expect(resp.status).toEqual(500);
    // TODO: figure out how to "observe" browser has been re-created
    const ok = await request.get(
      '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
    );
    expect(ok.status).toEqual(200);
  });
});
