# [mermaid.ink](https://mermaid.ink)

[![GitHub](https://img.shields.io/github/license/jihchi/mermaid.ink)](./LICENSE)
[![CI](https://github.com/jihchi/mermaid.ink/actions/workflows/CI.yaml/badge.svg)](https://github.com/jihchi/mermaid.ink/actions/workflows/CI.yaml)

## Getting Started

```
git clone https://github.com/jihchi/mermaid.ink.git
cd mermaid.ink
yarn
DEBUG=app:* yarn start
```

Open `demo.html` in your browser.

## Demo

Given a mermaid code:

```
graph TD
  A[Christmas] -->|Get money| B(Go shopping)
  B --> C{Let me think}
  C -->|One| D[Laptop]
  C -->|Two| E[iPhone]
  C -->|Three| F[fa:fa-car Car]
```

Paste it onto [mermaid-live-editor](https://mermaid-js.github.io/mermaid-live-editor), you will get encoded string from the editor, for example:

```
eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ
```

Append the encoded string to the service URL, for example: `https://mermaid.ink/img/<encoded_string>`, you will get an image from the URL:

![Flowchart](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbkFbQ2hyaXN0bWFzXSAtLT58R2V0IG1vbmV5fCBCKEdvIHNob3BwaW5nKVxuQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG5DIC0tPnxPbmV8IERbTGFwdG9wXVxuQyAtLT58VHdvfCBFW2lQaG9uZV1cbkMgLS0-fFRocmVlfCBGW2ZhOmZhLWNhciBDYXJdXG4iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ)

You could treat it as normal image and embed everywhere you want.

The images are generated with transparent background by default. To force a background color, append the query parameter `?bgColor=<color>` to the URL. 
`<color>` is interpreted as hexadecimal by default. It is possible to use [named colors](https://htmlcolorcodes.com/color-names/) by prefixing the color name with `!`:
* `https://mermaid.ink/img/<encoded_string>?bgColor=FF0000` will generate a PNG with a red background;
* `https://mermaid.ink/img/<encoded_string>?bgColor=!lightgray` will generate an SVG with a light gray background.


## Test

```
yarn test
```

## Troubleshooting

### I'm getting back `HTTP 431 Request Header Fields Too Large` error

**Note that you may encounter DoS if you increase `--max-http-header-size`!**

> Thanks [@ryepup](https://github.com/ryepup) for the analysis and work-arounds ([#12](https://github.com/jihchi/mermaid.ink/issues/12))

* If running locally, add `--max-http-header-size` to the start script in package.json
  * e.g. `"start": "node --max-http-header-size=102400000 src/index.js"`

* If running via docker, use [`NODE_OPTIONS`](https://nodejs.org/api/cli.html#cli_node_options_options) to increase `--max-http-header-size`
  * e.g. `docker run --rm -it -e 'NODE_OPTIONS="--max-http-header-size=102400000"' -p 3000:3000 jihchi/mermaid.ink`

Or, If running locally, run `NODE_OPTIONS="--max-http-header-size=102400000" npm start` to increase `--max-http-header-size`
