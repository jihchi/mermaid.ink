const supertest = require('supertest');
const createApp = require('../src/app');

const KB = 1024;

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
      expect(resp.text).toMatchInlineSnapshot(`"query \"url\" is required"`);
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
        url: 'https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtBXSAtLT4gQihCKVxuXHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19',
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
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('flowchart base64', async () => {
      const resp = await request.get(
        '/img/base64:eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('flowchart pako', async () => {
      const resp = await request.get(
        '/img/pako:eNpVkM1qw0AMhF9F6NRC_AI-BBo7zSWQQHLz5iC8SnZJ9gd5TQm2373r_ECrk9B8MwwasA2ascSLUDRwrJWHPF9NZcR2yVF3gqJYjhtO4ILn-wirj02AzoQYrb98PvnVDEE1bGeMIRnrr9NTqh7-necR6mZLMYV4-qscf8II68buTY7_rxjh7PpuzlSeqWhJoCJ5IbhAx-LI6lx-mG8Kk2HHCsu8apKrQuWnzPVRU-K1tikI5qRbxwukPoXD3bdYJun5DdWW8iPci5p-AUT3W9o'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('flowchart png', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?type=png'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/png');
      expect(resp.body.length).toBeGreaterThan(18 * KB);
    });

    test('flowchart webp', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?type=webp'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/webp');
      expect(resp.body.length).toBeGreaterThan(10 * KB);
    });

    test('flowchart uppercase type', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?type=PNG'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/png');
      expect(resp.body.length).toBeGreaterThan(19 * KB);
    });

    test('flowchart unknown type', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?type=abcd'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('sequence diagram', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgQWxpY2UgLT4-IEJvYjogSGVsbG8gQm9iLCBob3cgYXJlIHlvdT9cbiAgICBCb2ItLT4-Sm9objogSG93IGFib3V0IHlvdSBKb2huP1xuICAgIEJvYi0teCBBbGljZTogSSBhbSBnb29kIHRoYW5rcyFcbiAgICBCb2IteCBKb2huOiBJIGFtIGdvb2QgdGhhbmtzIVxuICAgIE5vdGUgcmlnaHQgb2YgSm9objogQm9iIHRoaW5rcyBhIGxvbmc8YnIvPmxvbmcgdGltZSwgc28gbG9uZzxici8-dGhhdCB0aGUgdGV4dCBkb2VzPGJyLz5ub3QgZml0IG9uIGEgcm93LlxuXG4gICAgQm9iLS0-QWxpY2U6IENoZWNraW5nIHdpdGggSm9obi4uLlxuICAgIEFsaWNlLT5Kb2huOiBZZXMuLi4gSm9obiwgaG93IGFyZSB5b3U_IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(31 * KB);
    });

    test('class diagram', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiY2xhc3NEaWFncmFtXG5cdEFuaW1hbCA8fC0tIER1Y2tcblx0QW5pbWFsIDx8LS0gRmlzaFxuXHRBbmltYWwgPHwtLSBaZWJyYVxuXHRBbmltYWwgOiAraW50IGFnZVxuXHRBbmltYWwgOiArU3RyaW5nIGdlbmRlclxuXHRBbmltYWw6ICtpc01hbW1hbCgpXG5cdEFuaW1hbDogK21hdGUoKVxuXHRjbGFzcyBEdWNre1xuXHRcdCtTdHJpbmcgYmVha0NvbG9yXG5cdFx0K3N3aW0oKVxuXHRcdCtxdWFjaygpXG5cdH1cblx0Y2xhc3MgRmlzaHtcblx0XHQtaW50IHNpemVJbkZlZXRcblx0XHQtY2FuRWF0KClcblx0fVxuXHRjbGFzcyBaZWJyYXtcblx0XHQrYm9vbCBpc193aWxkXG5cdFx0K3J1bigpXG5cdH1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(11 * KB);
    });

    test('state diagram', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoic3RhdGVEaWFncmFtXG5cdFsqXSAtLT4gU3RpbGxcblx0U3RpbGwgLS0-IFsqXVxuXG5cdFN0aWxsIC0tPiBNb3Zpbmdcblx0TW92aW5nIC0tPiBTdGlsbFxuXHRNb3ZpbmcgLS0-IENyYXNoXG5cdENyYXNoIC0tPiBbKl1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(5 * KB);
    });

    test('gantt chart', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ2FudHRcblx0dGl0bGUgQSBHYW50dCBEaWFncmFtXG5cdGRhdGVGb3JtYXQgIFlZWVktTU0tRERcblx0c2VjdGlvbiBTZWN0aW9uXG5cdEEgdGFzayAgICAgICAgICAgOmExLCAyMDE0LTAxLTAxLCAzMGRcblx0QW5vdGhlciB0YXNrICAgICA6YWZ0ZXIgYTEgICwgMjBkXG5cdHNlY3Rpb24gQW5vdGhlclxuXHRUYXNrIGluIHNlYyAgICAgIDoyMDE0LTAxLTEyICAsIDEyZFxuXHRhbm90aGVyIHRhc2sgICAgICA6IDI0ZFxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('pie chart', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoicGllIHRpdGxlIFBldHMgYWRvcHRlZCBieSB2b2x1bnRlZXJzXG5cdFwiRG9nc1wiIDogMzg2XG5cdFwiQ2F0c1wiIDogODVcblx0XCJSYXRzXCIgOiAxNVxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(21 * KB);
    });

    test('ER diagram', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZXJEaWFncmFtXG4gICAgICAgICAgQ1VTVE9NRVIgfXwuLnx7IERFTElWRVJZLUFERFJFU1MgOiBoYXNcbiAgICAgICAgICBDVVNUT01FUiB8fC0tb3sgT1JERVIgOiBwbGFjZXNcbiAgICAgICAgICBDVVNUT01FUiB8fC0tb3sgSU5WT0lDRSA6IFwibGlhYmxlIGZvclwiXG4gICAgICAgICAgQ1VTVE9NRVIge1xuICAgICAgICAgICAgc3RyaW5nIG5hbWVcbiAgICAgICAgICAgIHN0cmluZyBjdXN0TnVtYmVyXG4gICAgICAgICAgICBzdHJpbmcgc2VjdG9yXG4gICAgICAgICAgfVxuICAgICAgICAgIERFTElWRVJZLUFERFJFU1MgfHwtLW97IE9SREVSIDogcmVjZWl2ZXNcbiAgICAgICAgICBJTlZPSUNFIHx8LS18eyBPUkRFUiA6IGNvdmVyc1xuICAgICAgICAgIE9SREVSIHx8LS18eyBPUkRFUi1JVEVNIDogaW5jbHVkZXNcbiAgICAgICAgICBQUk9EVUNULUNBVEVHT1JZIHx8LS18eyBQUk9EVUNUIDogY29udGFpbnNcbiAgICAgICAgICBQUk9EVUNUIHx8LS1veyBPUkRFUi1JVEVNIDogXCJvcmRlcmVkIGluXCJcbiAgICAgICAgICAgICIsIm1lcm1haWQiOnsidGhlbWUiOiJmb3Jlc3QifSwidXBkYXRlRWRpdG9yIjpmYWxzZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(34 * KB);
    });

    test('returns 400 when encoded code is invalid', async () => {
      const resp = await request.get('/img/eyJjb2RlIjoiZ3JhcGgg');
      expect(resp.status).toEqual(400);
    });

    test('returns 200 when bgColor is used', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCw8YnIgLz5jb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19?bgColor=!slategray'
      );
      expect(resp.status).toEqual(200);
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
      expect(resp.body.length).toBeGreaterThan(9 * KB);
    });

    test('flowchart base64', async () => {
      const resp = await request.get(
        '/svg/base64:eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.length).toBeGreaterThan(9 * KB);
    });

    test('flowchart pako', async () => {
      const resp = await request.get(
        '/svg/pako:eNpFj8GKwkAMhl8l5OSCfYEehLVVL4IL663jIXSiM8hkhnTKIm3ffccV2Vvy_V9CMmEfLWONN6Xk4Nwa-ewap37IgYYLVNVmPnCGEIUfM2xXhwiDiyl5uX0Y2T4FaKbjU2HIzst9MdL8zZ2EZ2i7I6Uc0-VNzz9xhl3nv1xZ-U-dcrH33ZXqK1U9KTSkJcY1BtZA3pYjJyMABrPjwAbrUlrSu0EjS_HGZCnzzvocFeusI6-Rxhy_H9K_-5fTeir_hhdcfgF5pVhE'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.length).toBeGreaterThan(9 * KB);
    });

    test('sequence diagram', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgQWxpY2UgLT4-IEJvYjogSGVsbG8gQm9iLCBob3cgYXJlIHlvdT9cbiAgICBCb2ItLT4-Sm9objogSG93IGFib3V0IHlvdSBKb2huP1xuICAgIEJvYi0teCBBbGljZTogSSBhbSBnb29kIHRoYW5rcyFcbiAgICBCb2IteCBKb2huOiBJIGFtIGdvb2QgdGhhbmtzIVxuICAgIE5vdGUgcmlnaHQgb2YgSm9objogQm9iIHRoaW5rcyBhIGxvbmc8YnIvPmxvbmcgdGltZSwgc28gbG9uZzxici8-dGhhdCB0aGUgdGV4dCBkb2VzPGJyLz5ub3QgZml0IG9uIGEgcm93LlxuXG4gICAgQm9iLS0-QWxpY2U6IENoZWNraW5nIHdpdGggSm9obi4uLlxuICAgIEFsaWNlLT5Kb2huOiBZZXMuLi4gSm9obiwgaG93IGFyZSB5b3U_IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.length).toBeGreaterThan(8 * KB);
    });

    test('class diagram', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiY2xhc3NEaWFncmFtXG5cdEFuaW1hbCA8fC0tIER1Y2tcblx0QW5pbWFsIDx8LS0gRmlzaFxuXHRBbmltYWwgPHwtLSBaZWJyYVxuXHRBbmltYWwgOiAraW50IGFnZVxuXHRBbmltYWwgOiArU3RyaW5nIGdlbmRlclxuXHRBbmltYWw6ICtpc01hbW1hbCgpXG5cdEFuaW1hbDogK21hdGUoKVxuXHRjbGFzcyBEdWNre1xuXHRcdCtTdHJpbmcgYmVha0NvbG9yXG5cdFx0K3N3aW0oKVxuXHRcdCtxdWFjaygpXG5cdH1cblx0Y2xhc3MgRmlzaHtcblx0XHQtaW50IHNpemVJbkZlZXRcblx0XHQtY2FuRWF0KClcblx0fVxuXHRjbGFzcyBaZWJyYXtcblx0XHQrYm9vbCBpc193aWxkXG5cdFx0K3J1bigpXG5cdH1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.length).toBeGreaterThan(6 * KB);
    });

    test('state diagram', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoic3RhdGVEaWFncmFtXG5cdFsqXSAtLT4gU3RpbGxcblx0U3RpbGwgLS0-IFsqXVxuXG5cdFN0aWxsIC0tPiBNb3Zpbmdcblx0TW92aW5nIC0tPiBTdGlsbFxuXHRNb3ZpbmcgLS0-IENyYXNoXG5cdENyYXNoIC0tPiBbKl1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.length).toBeGreaterThan(6 * KB);
    });

    test('gantt chart', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ2FudHRcblx0dGl0bGUgQSBHYW50dCBEaWFncmFtXG5cdGRhdGVGb3JtYXQgIFlZWVktTU0tRERcblx0c2VjdGlvbiBTZWN0aW9uXG5cdEEgdGFzayAgICAgICAgICAgOmExLCAyMDE0LTAxLTAxLCAzMGRcblx0QW5vdGhlciB0YXNrICAgICA6YWZ0ZXIgYTEgICwgMjBkXG5cdHNlY3Rpb24gQW5vdGhlclxuXHRUYXNrIGluIHNlYyAgICAgIDoyMDE0LTAxLTEyICAsIDEyZFxuXHRhbm90aGVyIHRhc2sgICAgICA6IDI0ZFxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.length).toBeGreaterThan(6 * KB);
    });

    test('pie chart', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoicGllIHRpdGxlIFBldHMgYWRvcHRlZCBieSB2b2x1bnRlZXJzXG5cdFwiRG9nc1wiIDogMzg2XG5cdFwiQ2F0c1wiIDogODVcblx0XCJSYXRzXCIgOiAxNVxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.length).toBeGreaterThan(2 * KB);
    });

    test('ER diagram', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZXJEaWFncmFtXG4gICAgICAgICAgQ1VTVE9NRVIgfXwuLnx7IERFTElWRVJZLUFERFJFU1MgOiBoYXNcbiAgICAgICAgICBDVVNUT01FUiB8fC0tb3sgT1JERVIgOiBwbGFjZXNcbiAgICAgICAgICBDVVNUT01FUiB8fC0tb3sgSU5WT0lDRSA6IFwibGlhYmxlIGZvclwiXG4gICAgICAgICAgQ1VTVE9NRVIge1xuICAgICAgICAgICAgc3RyaW5nIG5hbWVcbiAgICAgICAgICAgIHN0cmluZyBjdXN0TnVtYmVyXG4gICAgICAgICAgICBzdHJpbmcgc2VjdG9yXG4gICAgICAgICAgfVxuICAgICAgICAgIERFTElWRVJZLUFERFJFU1MgfHwtLW97IE9SREVSIDogcmVjZWl2ZXNcbiAgICAgICAgICBJTlZPSUNFIHx8LS18eyBPUkRFUiA6IGNvdmVyc1xuICAgICAgICAgIE9SREVSIHx8LS18eyBPUkRFUi1JVEVNIDogaW5jbHVkZXNcbiAgICAgICAgICBQUk9EVUNULUNBVEVHT1JZIHx8LS18eyBQUk9EVUNUIDogY29udGFpbnNcbiAgICAgICAgICBQUk9EVUNUIHx8LS1veyBPUkRFUi1JVEVNIDogXCJvcmRlcmVkIGluXCJcbiAgICAgICAgICAgICIsIm1lcm1haWQiOnsidGhlbWUiOiJmb3Jlc3QifSwidXBkYXRlRWRpdG9yIjpmYWxzZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.length).toBeGreaterThan(13 * KB);
    });

    test('returns 400 when encoded code is invalid', async () => {
      const resp = await request.get('/svg/eyJjb2RlIjoiZ3JhcGgg');
      expect(resp.status).toEqual(400);
    });

    test('should replace <br> by <br/>', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCw8YnIgLz5jb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19'
      );
      const body = resp.body.toString();
      expect(body).not.toContain('<br>');
    });

    test('should add background color', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCw8YnIgLz5jb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19?bgColor=123123'
      );
      const body = resp.body.toString();
      expect(body).toMatch(/<svg [^>]* background-color: rgb\(18, 49, 35\);/);
    });

    test('should add named background color', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCw8YnIgLz5jb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19?bgColor=!slategray'
      );
      const body = resp.body.toString();
      expect(body).toMatch(/<svg [^>]* background-color: slategray;/);
    });

    test('should silently ignore invalid background colors', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCw8YnIgLz5jb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19?bgColor=!non-existant-color'
      );
      expect(resp.status).toEqual(200);
      const body = resp.body.toString();
      expect(body).not.toMatch(/<svg [^>]* background-color:/);
    });

    test('imports fontawesome in svg', async () => {
      const resp = await request.get(
        '/svg/Z3JhcGggVEQKICAgIEFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKQogICAgQiAtLT4gQ3tMZXQgbWUgdGhpbmt9CiAgICBDIC0tPnxPbmV8IERbTGFwdG9wXQogICAgQyAtLT58VHdvfCBFW2lQaG9uZV0KICAgIEMgLS0+fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJd'
      );
      const body = resp.body.toString();
      expect(body).toContain('font-awesome');
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

  describe('Fixed #170, ER diagram, works at mermaid@10', () => {
    const encodedPath =
      'pako:eNp1UsFuwjAM_RUru2wSfEB7q6BIE6OgArusO3itaSPaBDnpJgb8-1JaaSsdvsRynu33bJ9EqjMSviCeSswZq0SBs0kQw_k8HusTRMEinI6n8fNrGIMPWJb6y_yiTq3bmLEsVQ5MuXQuWqlVVFcfxLCaD1AV7mkYdGTK2-jbOxyQbdfz0j6rMF4vozscpemBhhQzlp_E5kWmpAw5epCITUFQdoGHRNzmPHreE-wkGxthRQ6_VOURPA_SAhlT68oBMrXzoWxYAEpscwcfh0Irgu2fGUllAXPqKe5pHEpKkeP_Bj-C2fyO_qv8lHqgrtkiiLazYLLZxq6ZbpQ2FK2Gb2INmt2mnNZm__51k0aMREVcoczcMV3ZJcIW5NQK37kZ8r4ZycXhsLZ6fVSp8C3XNBL1IUNL3fkJf4elocsPBXTMmA';

    test('img', async () => {
      const resp = await request.get(`/img/${encodedPath}`);
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('svg', async () => {
      const resp = await request.get(`/svg/${encodedPath}`);
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      expect(resp.body.length).toBeGreaterThan(13 * KB);
    });
  });

  describe('CORS', () => {
    const crossOrigin = 'http://cross.origin.com';

    test('/img/:code', async () => {
      const resp = await request
        .options(
          '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
        )
        .set('Origin', crossOrigin)
        .set('Access-Control-Request-Method', 'GET');
      expect(resp.status).toEqual(204);
      expect(resp.headers['access-control-allow-origin']).toEqual(crossOrigin);
      expect(resp.headers['access-control-allow-methods']).toEqual('GET');
    });

    test('/svg/:code', async () => {
      const resp = await request
        .options(
          '/svg/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
        )
        .set('Origin', crossOrigin)
        .set('Access-Control-Request-Method', 'GET');
      expect(resp.status).toEqual(204);
      expect(resp.headers['access-control-allow-origin']).toEqual(crossOrigin);
      expect(resp.headers['access-control-allow-methods']).toEqual('GET');
    });
  });
});
