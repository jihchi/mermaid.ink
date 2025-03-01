const supertest = require('supertest');
const sharp = require('sharp');
const { PDFDocument, PageSizes } = require('pdf-lib');
const FA_VERSION =
  require('@fortawesome/fontawesome-free/package.json').version;
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
    test('returns 404 when there is no code provided', async () => {
      const resp = await request.get('/img');
      expect(resp.status).toEqual(404);
    });

    test('flowchart', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('flowchart base64', async () => {
      const resp = await request.get(
        '/img/base64:eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('flowchart pako', async () => {
      const resp = await request.get(
        '/img/pako:eNpVkM1qw0AMhF9F6NRC_AI-BBo7zSWQQHLz5iC8SnZJ9gd5TQm2373r_ECrk9B8MwwasA2ascSLUDRwrJWHPF9NZcR2yVF3gqJYjhtO4ILn-wirj02AzoQYrb98PvnVDEE1bGeMIRnrr9NTqh7-necR6mZLMYV4-qscf8II68buTY7_rxjh7PpuzlSeqWhJoCJ5IbhAx-LI6lx-mG8Kk2HHCsu8apKrQuWnzPVRU-K1tikI5qRbxwukPoXD3bdYJun5DdWW8iPci5p-AUT3W9o'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('flowchart png', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?type=png'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/png');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('png');
      expect(resp.body.length).toBeGreaterThan(18 * KB);
    });

    test('flowchart webp', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?type=webp'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/webp');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('webp');
      expect(resp.body.length).toBeGreaterThan(10 * KB);
    });

    test('flowchart uppercase type', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?type=PNG'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/png');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('png');
      expect(resp.body.length).toBeGreaterThan(19 * KB);
    });

    test('flowchart unknown type', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?type=abcd'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('sequence diagram', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgQWxpY2UgLT4-IEJvYjogSGVsbG8gQm9iLCBob3cgYXJlIHlvdT9cbiAgICBCb2ItLT4-Sm9objogSG93IGFib3V0IHlvdSBKb2huP1xuICAgIEJvYi0teCBBbGljZTogSSBhbSBnb29kIHRoYW5rcyFcbiAgICBCb2IteCBKb2huOiBJIGFtIGdvb2QgdGhhbmtzIVxuICAgIE5vdGUgcmlnaHQgb2YgSm9objogQm9iIHRoaW5rcyBhIGxvbmc8YnIvPmxvbmcgdGltZSwgc28gbG9uZzxici8-dGhhdCB0aGUgdGV4dCBkb2VzPGJyLz5ub3QgZml0IG9uIGEgcm93LlxuXG4gICAgQm9iLS0-QWxpY2U6IENoZWNraW5nIHdpdGggSm9obi4uLlxuICAgIEFsaWNlLT5Kb2huOiBZZXMuLi4gSm9obiwgaG93IGFyZSB5b3U_IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(31 * KB);
    });

    test('class diagram', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiY2xhc3NEaWFncmFtXG5cdEFuaW1hbCA8fC0tIER1Y2tcblx0QW5pbWFsIDx8LS0gRmlzaFxuXHRBbmltYWwgPHwtLSBaZWJyYVxuXHRBbmltYWwgOiAraW50IGFnZVxuXHRBbmltYWwgOiArU3RyaW5nIGdlbmRlclxuXHRBbmltYWw6ICtpc01hbW1hbCgpXG5cdEFuaW1hbDogK21hdGUoKVxuXHRjbGFzcyBEdWNre1xuXHRcdCtTdHJpbmcgYmVha0NvbG9yXG5cdFx0K3N3aW0oKVxuXHRcdCtxdWFjaygpXG5cdH1cblx0Y2xhc3MgRmlzaHtcblx0XHQtaW50IHNpemVJbkZlZXRcblx0XHQtY2FuRWF0KClcblx0fVxuXHRjbGFzcyBaZWJyYXtcblx0XHQrYm9vbCBpc193aWxkXG5cdFx0K3J1bigpXG5cdH1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(11 * KB);
    });

    test('state diagram', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoic3RhdGVEaWFncmFtXG5cdFsqXSAtLT4gU3RpbGxcblx0U3RpbGwgLS0-IFsqXVxuXG5cdFN0aWxsIC0tPiBNb3Zpbmdcblx0TW92aW5nIC0tPiBTdGlsbFxuXHRNb3ZpbmcgLS0-IENyYXNoXG5cdENyYXNoIC0tPiBbKl1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(5 * KB);
    });

    test('gantt chart', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ2FudHRcblx0dGl0bGUgQSBHYW50dCBEaWFncmFtXG5cdGRhdGVGb3JtYXQgIFlZWVktTU0tRERcblx0c2VjdGlvbiBTZWN0aW9uXG5cdEEgdGFzayAgICAgICAgICAgOmExLCAyMDE0LTAxLTAxLCAzMGRcblx0QW5vdGhlciB0YXNrICAgICA6YWZ0ZXIgYTEgICwgMjBkXG5cdHNlY3Rpb24gQW5vdGhlclxuXHRUYXNrIGluIHNlYyAgICAgIDoyMDE0LTAxLTEyICAsIDEyZFxuXHRhbm90aGVyIHRhc2sgICAgICA6IDI0ZFxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('pie chart', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoicGllIHRpdGxlIFBldHMgYWRvcHRlZCBieSB2b2x1bnRlZXJzXG5cdFwiRG9nc1wiIDogMzg2XG5cdFwiQ2F0c1wiIDogODVcblx0XCJSYXRzXCIgOiAxNVxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(21 * KB);
    });

    test('ER diagram', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZXJEaWFncmFtXG4gICAgICAgICAgQ1VTVE9NRVIgfXwuLnx7IERFTElWRVJZLUFERFJFU1MgOiBoYXNcbiAgICAgICAgICBDVVNUT01FUiB8fC0tb3sgT1JERVIgOiBwbGFjZXNcbiAgICAgICAgICBDVVNUT01FUiB8fC0tb3sgSU5WT0lDRSA6IFwibGlhYmxlIGZvclwiXG4gICAgICAgICAgQ1VTVE9NRVIge1xuICAgICAgICAgICAgc3RyaW5nIG5hbWVcbiAgICAgICAgICAgIHN0cmluZyBjdXN0TnVtYmVyXG4gICAgICAgICAgICBzdHJpbmcgc2VjdG9yXG4gICAgICAgICAgfVxuICAgICAgICAgIERFTElWRVJZLUFERFJFU1MgfHwtLW97IE9SREVSIDogcmVjZWl2ZXNcbiAgICAgICAgICBJTlZPSUNFIHx8LS18eyBPUkRFUiA6IGNvdmVyc1xuICAgICAgICAgIE9SREVSIHx8LS18eyBPUkRFUi1JVEVNIDogaW5jbHVkZXNcbiAgICAgICAgICBQUk9EVUNULUNBVEVHT1JZIHx8LS18eyBQUk9EVUNUIDogY29udGFpbnNcbiAgICAgICAgICBQUk9EVUNUIHx8LS1veyBPUkRFUi1JVEVNIDogXCJvcmRlcmVkIGluXCJcbiAgICAgICAgICAgICIsIm1lcm1haWQiOnsidGhlbWUiOiJmb3Jlc3QifSwidXBkYXRlRWRpdG9yIjpmYWxzZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(33 * KB);
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

    test('returns 200 when theme is used', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCw8YnIgLz5jb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19?theme=dark'
      );
      expect(resp.status).toEqual(200);
    });

    test('flowchart default size', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);

      // Changes to the mermaid.js library, fonts and browser renderer could affect these values
      expect(metadata.width).toBeGreaterThan(300);
      expect(metadata.height).toBeGreaterThan(430);
    });

    test('flowchart set width', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?width=1000'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);

      // Changes to the mermaid.js library, fonts and browser renderer could affect these values
      expect(metadata.width).toEqual(1000);
      expect(metadata.height).toBeGreaterThan(1000);
    });

    test('flowchart set height', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?height=1000'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);

      // Changes to the mermaid.js library, fonts and browser renderer could affect these values
      expect(metadata.width).toBeGreaterThan(679);
      expect(metadata.height).toEqual(1000);
    });

    // This doesn't change the aspect ratio of the actual diagram, it just adds more margins - not very useful
    test('flowchart set width and height', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?width=1000&height=1000'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);

      expect(metadata.width).toEqual(1000);
      expect(metadata.height).toEqual(1000);
    });

    test('flowchart set width with 2x scale', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?width=1000&scale=2'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);

      // Changes to the mermaid.js library, fonts and browser renderer could affect these values
      expect(metadata.width).toEqual(2000);
      expect(metadata.height).toBeGreaterThan(2000);
    });

    test('setting scale with no explicit width or height', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?scale=2'
      );
      expect(resp.status).toEqual(400);
    });

    test('scale < 0', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?width=1000&scale=-1'
      );
      expect(resp.status).toEqual(400);
    });

    test('scale > 3', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?width=1000&scale=4'
      );
      expect(resp.status).toEqual(400);
    });

    test('width < 0', async () => {
      const resp = await request.get(
        '/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?width=-1'
      );
      expect(resp.status).toEqual(400);
    });

    test('width > max width ENV var', async () => {
      const width = process.env.MAX_WIDTH + 1;
      const resp = await request.get(
        `/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?width=${width}`
      );
      expect(resp.status).toEqual(400);
    });

    test('height > max height ENV var', async () => {
      const height = process.env.MAX_HEIGHT + 1;
      const resp = await request.get(
        `/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?height=${height}`
      );
      expect(resp.status).toEqual(400);
    });
  });

  describe('/pdf', () => {
    test('returns 404 when there is no code provided', async () => {
      const resp = await request.get('/pdf');
      expect(resp.status).toEqual(404);
    });

    test('flowchart', async () => {
      const resp = await request.get(
        '/pdf/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('application/pdf');
      expect(resp.body.length).toBeGreaterThan(17 * KB);

      await PDFDocument.load(resp.body.toString('base64'));
    });

    test('should default to a4', async () => {
      const resp = await request.get(
        '/pdf/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('application/pdf');
      expect(resp.body.length).toBeGreaterThan(17 * KB);

      const pdfDoc = await PDFDocument.load(resp.body.toString('base64'));
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      const expectedSize = PageSizes.A4;

      // There can be a slight difference in size
      expect(width).toBeGreaterThan(expectedSize[0] - 1);
      expect(width).toBeLessThan(expectedSize[0] + 1);
      expect(height).toBeGreaterThan(expectedSize[1] - 1);
      expect(height).toBeLessThan(expectedSize[1] + 1);
    });

    test('should set page size standard (a3)', async () => {
      const resp = await request.get(
        '/pdf/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?paper=a3'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('application/pdf');

      const pdfDoc = await PDFDocument.load(resp.body.toString('base64'));
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      const expectedSize = PageSizes.A3;

      // There can be a slight difference in size
      expect(width).toBeGreaterThan(expectedSize[0] - 1);
      expect(width).toBeLessThan(expectedSize[0] + 1);
      expect(height).toBeGreaterThan(expectedSize[1] - 1);
      expect(height).toBeLessThan(expectedSize[1] + 1);
    });

    test('should set page size standard with uppercase input (A3)', async () => {
      const resp = await request.get(
        '/pdf/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?paper=A3'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('application/pdf');

      const pdfDoc = await PDFDocument.load(resp.body.toString('base64'));
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      const expectedSize = PageSizes.A3;

      // There can be a slight difference in size
      expect(width).toBeGreaterThan(expectedSize[0] - 1);
      expect(width).toBeLessThan(expectedSize[0] + 1);
      expect(height).toBeGreaterThan(expectedSize[1] - 1);
      expect(height).toBeLessThan(expectedSize[1] + 1);
    });

    test('should silently default to a3 paper size given unexpected input', async () => {
      const resp = await request.get(
        '/pdf/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?paper=not-a-size'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('application/pdf');

      const pdfDoc = await PDFDocument.load(resp.body.toString('base64'));
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      const expectedSize = PageSizes.A4;

      // There can be a slight difference in size
      expect(width).toBeGreaterThan(expectedSize[0] - 1);
      expect(width).toBeLessThan(expectedSize[0] + 1);
      expect(height).toBeGreaterThan(expectedSize[1] - 1);
      expect(height).toBeLessThan(expectedSize[1] + 1);
    });

    test('should set landscape', async () => {
      const resp = await request.get(
        '/pdf/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?landscape'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('application/pdf');

      const pdfDoc = await PDFDocument.load(resp.body.toString('base64'));
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      const expectedSize = PageSizes.A4;

      // There can be a slight difference in size
      expect(width).toBeGreaterThan(expectedSize[1] - 1);
      expect(width).toBeLessThan(expectedSize[1] + 1);
      expect(height).toBeGreaterThan(expectedSize[0] - 1);
      expect(height).toBeLessThan(expectedSize[0] + 1);
    });

    test('should fit page size to diagram', async () => {
      const diagramSize = [1000, 800];
      const resp = await request.get(
        `/pdf/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ?width=${diagramSize[0]}&height=${diagramSize[1]}&fit`
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('application/pdf');

      const pdfDoc = await PDFDocument.load(resp.body.toString('base64'));
      const pages = pdfDoc.getPages();
      expect(pages.length).toBe(1);
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      // Note that the resulting PDF page size according to pdf-lib may not equal the requested diagram size but the aspect ratios will be the same
      expect(width / height).toBeCloseTo(diagramSize[0] / diagramSize[1]);
    });
  });

  describe('/svg', () => {
    test('returns 404 when there is no code provided', async () => {
      const resp = await request.get('/svg');
      expect(resp.status).toEqual(404);
    });

    test('flowchart', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('svg');
      expect(resp.body.length).toBeGreaterThan(9 * KB);
    });

    test('flowchart base64', async () => {
      const resp = await request.get(
        '/svg/base64:eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('svg');
      expect(resp.body.length).toBeGreaterThan(9 * KB);
    });

    test('flowchart pako', async () => {
      const resp = await request.get(
        '/svg/pako:eNpFj8GKwkAMhl8l5OSCfYEehLVVL4IL663jIXSiM8hkhnTKIm3ffccV2Vvy_V9CMmEfLWONN6Xk4Nwa-ewap37IgYYLVNVmPnCGEIUfM2xXhwiDiyl5uX0Y2T4FaKbjU2HIzst9MdL8zZ2EZ2i7I6Uc0-VNzz9xhl3nv1xZ-U-dcrH33ZXqK1U9KTSkJcY1BtZA3pYjJyMABrPjwAbrUlrSu0EjS_HGZCnzzvocFeusI6-Rxhy_H9K_-5fTeir_hhdcfgF5pVhE'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('svg');
      expect(resp.body.length).toBeGreaterThan(9 * KB);
    });

    test('sequence diagram', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgQWxpY2UgLT4-IEJvYjogSGVsbG8gQm9iLCBob3cgYXJlIHlvdT9cbiAgICBCb2ItLT4-Sm9objogSG93IGFib3V0IHlvdSBKb2huP1xuICAgIEJvYi0teCBBbGljZTogSSBhbSBnb29kIHRoYW5rcyFcbiAgICBCb2IteCBKb2huOiBJIGFtIGdvb2QgdGhhbmtzIVxuICAgIE5vdGUgcmlnaHQgb2YgSm9objogQm9iIHRoaW5rcyBhIGxvbmc8YnIvPmxvbmcgdGltZSwgc28gbG9uZzxici8-dGhhdCB0aGUgdGV4dCBkb2VzPGJyLz5ub3QgZml0IG9uIGEgcm93LlxuXG4gICAgQm9iLS0-QWxpY2U6IENoZWNraW5nIHdpdGggSm9obi4uLlxuICAgIEFsaWNlLT5Kb2huOiBZZXMuLi4gSm9obiwgaG93IGFyZSB5b3U_IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('svg');
      expect(resp.body.length).toBeGreaterThan(8 * KB);
    });

    test('class diagram', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiY2xhc3NEaWFncmFtXG5cdEFuaW1hbCA8fC0tIER1Y2tcblx0QW5pbWFsIDx8LS0gRmlzaFxuXHRBbmltYWwgPHwtLSBaZWJyYVxuXHRBbmltYWwgOiAraW50IGFnZVxuXHRBbmltYWwgOiArU3RyaW5nIGdlbmRlclxuXHRBbmltYWw6ICtpc01hbW1hbCgpXG5cdEFuaW1hbDogK21hdGUoKVxuXHRjbGFzcyBEdWNre1xuXHRcdCtTdHJpbmcgYmVha0NvbG9yXG5cdFx0K3N3aW0oKVxuXHRcdCtxdWFjaygpXG5cdH1cblx0Y2xhc3MgRmlzaHtcblx0XHQtaW50IHNpemVJbkZlZXRcblx0XHQtY2FuRWF0KClcblx0fVxuXHRjbGFzcyBaZWJyYXtcblx0XHQrYm9vbCBpc193aWxkXG5cdFx0K3J1bigpXG5cdH1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('svg');
      expect(resp.body.length).toBeGreaterThan(6 * KB);
    });

    test('state diagram', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoic3RhdGVEaWFncmFtXG5cdFsqXSAtLT4gU3RpbGxcblx0U3RpbGwgLS0-IFsqXVxuXG5cdFN0aWxsIC0tPiBNb3Zpbmdcblx0TW92aW5nIC0tPiBTdGlsbFxuXHRNb3ZpbmcgLS0-IENyYXNoXG5cdENyYXNoIC0tPiBbKl1cblx0XHRcdFx0XHQiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOnRydWV9'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('svg');
      expect(resp.body.length).toBeGreaterThan(6 * KB);
    });

    test('gantt chart', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ2FudHRcblx0dGl0bGUgQSBHYW50dCBEaWFncmFtXG5cdGRhdGVGb3JtYXQgIFlZWVktTU0tRERcblx0c2VjdGlvbiBTZWN0aW9uXG5cdEEgdGFzayAgICAgICAgICAgOmExLCAyMDE0LTAxLTAxLCAzMGRcblx0QW5vdGhlciB0YXNrICAgICA6YWZ0ZXIgYTEgICwgMjBkXG5cdHNlY3Rpb24gQW5vdGhlclxuXHRUYXNrIGluIHNlYyAgICAgIDoyMDE0LTAxLTEyICAsIDEyZFxuXHRhbm90aGVyIHRhc2sgICAgICA6IDI0ZFxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('svg');
      expect(resp.body.length).toBeGreaterThan(6 * KB);
    });

    test('pie chart', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoicGllIHRpdGxlIFBldHMgYWRvcHRlZCBieSB2b2x1bnRlZXJzXG5cdFwiRG9nc1wiIDogMzg2XG5cdFwiQ2F0c1wiIDogODVcblx0XCJSYXRzXCIgOiAxNVxuXHRcdFx0XHRcdCIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In0sInVwZGF0ZUVkaXRvciI6dHJ1ZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('svg');
      expect(resp.body.length).toBeGreaterThan(2 * KB);
    });

    test('ER diagram', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZXJEaWFncmFtXG4gICAgICAgICAgQ1VTVE9NRVIgfXwuLnx7IERFTElWRVJZLUFERFJFU1MgOiBoYXNcbiAgICAgICAgICBDVVNUT01FUiB8fC0tb3sgT1JERVIgOiBwbGFjZXNcbiAgICAgICAgICBDVVNUT01FUiB8fC0tb3sgSU5WT0lDRSA6IFwibGlhYmxlIGZvclwiXG4gICAgICAgICAgQ1VTVE9NRVIge1xuICAgICAgICAgICAgc3RyaW5nIG5hbWVcbiAgICAgICAgICAgIHN0cmluZyBjdXN0TnVtYmVyXG4gICAgICAgICAgICBzdHJpbmcgc2VjdG9yXG4gICAgICAgICAgfVxuICAgICAgICAgIERFTElWRVJZLUFERFJFU1MgfHwtLW97IE9SREVSIDogcmVjZWl2ZXNcbiAgICAgICAgICBJTlZPSUNFIHx8LS18eyBPUkRFUiA6IGNvdmVyc1xuICAgICAgICAgIE9SREVSIHx8LS18eyBPUkRFUi1JVEVNIDogaW5jbHVkZXNcbiAgICAgICAgICBQUk9EVUNULUNBVEVHT1JZIHx8LS18eyBQUk9EVUNUIDogY29udGFpbnNcbiAgICAgICAgICBQUk9EVUNUIHx8LS1veyBPUkRFUi1JVEVNIDogXCJvcmRlcmVkIGluXCJcbiAgICAgICAgICAgICIsIm1lcm1haWQiOnsidGhlbWUiOiJmb3Jlc3QifSwidXBkYXRlRWRpdG9yIjpmYWxzZX0'
      );
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('svg');
      expect(resp.body.length).toBeGreaterThan(12 * KB);
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

    // Theme style contains
    // default: #mermaid-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}
    // neutral: #mermaid-svg .node path{fill:#eee;stroke:#999;stroke-width:1px;}
    // dark: #mermaid-svg .node path{fill:#1f2020;stroke:#ccc;stroke-width:1px;}
    // forest: #mermaid-svg .node path{fill:#cde498;stroke:#13540c;stroke-width:1px;}

    test('site-wide diagram theme should be "default" if unset', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCw8YnIgLz5jb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19'
      );
      expect(resp.status).toEqual(200);
      const body = resp.body.toString();
      expect(body).toContain(
        '#mermaid-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}'
      );
    });

    test('should set site-wide theme (dark)', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCw8YnIgLz5jb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19?theme=dark'
      );
      expect(resp.status).toEqual(200);
      const body = resp.body.toString();
      expect(body).toContain(
        '#mermaid-svg .node path{fill:#1f2020;stroke:#ccc;stroke-width:1px;}'
      );
    });

    test('should silently ignore invalid site-wide themes', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCw8YnIgLz5jb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19?theme=non-existant-theme'
      );
      expect(resp.status).toEqual(200);
      const body = resp.body.toString();
      expect(body).toContain(
        '#mermaid-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}'
      );
    });

    test('should add diagram-specific theme from serialized state (dark)', async () => {
      const resp = await request.get(
        '/svg/eyJjb2RlIjoiZ3JhcGggVERcbiAgQVtMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCw8YnIgLz5jb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuXSIsIm1lcm1haWQiOnsidGhlbWUiOiJkYXJrIn19'
      );
      expect(resp.status).toEqual(200);
      const body = resp.body.toString();
      expect(body).toContain(
        '#mermaid-svg .node path{fill:#1f2020;stroke:#ccc;stroke-width:1px;}'
      );
    });

    test('imports fontawesome in svg', async () => {
      const resp = await request.get(
        '/svg/Z3JhcGggVEQKICAgIEFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKQogICAgQiAtLT4gQ3tMZXQgbWUgdGhpbmt9CiAgICBDIC0tPnxPbmV8IERbTGFwdG9wXQogICAgQyAtLT58VHdvfCBFW2lQaG9uZV0KICAgIEMgLS0+fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJd'
      );
      const body = resp.body.toString();
      expect(body).toContain(
        `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/${FA_VERSION}/css/all.min.css`
      );
    });

    test('imports custom fontawesome URL in svg', async () => {
      const originalEnvValue = process.env.FONT_AWESOME_CSS_URL;
      process.env.FONT_AWESOME_CSS_URL =
        'https://example.com/ajax/libs/font-awesome/FA_VERSION/css/all.min.css';
      const resp = await request.get(
        '/svg/Z3JhcGggVEQKICAgIEFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKQogICAgQiAtLT4gQ3tMZXQgbWUgdGhpbmt9CiAgICBDIC0tPnxPbmV8IERbTGFwdG9wXQogICAgQyAtLT58VHdvfCBFW2lQaG9uZV0KICAgIEMgLS0+fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJd'
      );
      const body = resp.body.toString();
      process.env.FONT_AWESOME_CSS_URL = originalEnvValue;
      expect(body).toContain(
        `https://example.com/ajax/libs/font-awesome/${FA_VERSION}/css/all.min.css`
      );
    });

    test('should render svg correctly when there is clickable node in the diagram', async () => {
      const resp = await request.get(
        '/svg/pako:eNpVU-9r2zAQ_VcOwUIGTTL2MawtzY-1HSUbbcYYdRmKdY61yJLRSUtD0v99JzlZV3-ST_fuvXvP3ovSKRRjURm3LWvpAyxnhQV-rh7vnFTaruH7_R1UUhtUQ_iBUEoLwe8gOKj0OnoEFwNs693wCQaDi8MM00z48vB1cYBJ_5tBSYyqsdxAqPnkLDmDCU-IuZR6QVoF6L3zoDAwHQ3fd0omaSxM97f02lw677EMly9dyzQz_0Q6wOzEODWaGWv0mepeaq6xdE0UEbSFtQ51XA0_rfzo4taWJuZlE8PKuw1aMNpuUmMqdajcC1ttDFCLqCC2-bbSzyexnZKFO8B8P9MKyDXo7BFKyDvuXGSQpjz_tMD8dYHPj1eUnWo6ixiSwR0u-de0BgNm_NP_8MR6nVlTb-na3VHxGxjHeWK9zs4efXtTKsTCwbhfiAPc9JecdqSTO0vdIFOzq3KV7LnRFJw_UlXeNUCyySZuCX2WEom94mVKjzJ0kSst1142J9vKHNYMao8VFKIOoaXxaHTMiLWPGvSN1Grwm_4djf6DA1Sa6Uc5IBpZ3F5KIr22iHTeM3KFhs5Xcd0LyPsze3r55bF1Pgwb1Qs6GDyf5MTfffyQPC0EK-i-lzy1EOJMHDn5V9knxYVIAfHVmI8KKxlNKERhX7hVxuAedrYU4-AjnonYKuaddQu_Lc6z-K728hd0LzGz'
      );
      expect(resp.body.toString()).toContain(
        '<svg id="mermaid-svg" width="100%" xmlns="http://www.w3.org/2000/svg" '
      );
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
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(15 * KB);
    });

    test('svg', async () => {
      const resp = await request.get(`/svg/${encodedPath}`);
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('svg');
      expect(resp.body.length).toBeGreaterThan(13 * KB);
    });
  });

  describe('Fixed #272, ER diagram', () => {
    const encodedPath =
      'pako:eNpFjrEKwzAMRH_F3FjyBd4CXTt1a9VBxEpqiO3gyEMJ_ve4SaE36R6H7jYMyQksJF89T5kDRdPUPwn9hfAy2wm-WjX7OJn-JJUiOgTJgb1rH44gQd8ShGDb6WTkMiuBYm1RLprunzjAai7SoSyOVX61sCPPa6MLx0dKfy_Oa8q3c-Uxtu7OaTo4';

    test('img', async () => {
      const resp = await request.get(`/img/${encodedPath}`);
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/jpeg');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('jpeg');
      expect(resp.body.length).toBeGreaterThan(2 * KB);
    });

    test('svg', async () => {
      const resp = await request.get(`/svg/${encodedPath}`);
      expect(resp.status).toEqual(200);
      expect(resp.type).toEqual('image/svg+xml');
      const metadata = await sharp(resp.body).metadata();
      expect(metadata.format).toEqual('svg');
      expect(resp.body.length).toBeGreaterThan(4 * KB);
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
