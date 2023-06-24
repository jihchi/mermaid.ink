# [mermaid.ink](https://mermaid.ink)

[![GitHub](https://img.shields.io/github/license/jihchi/mermaid.ink)](./LICENSE)
[![CI](https://github.com/jihchi/mermaid.ink/actions/workflows/CI.yaml/badge.svg)](https://github.com/jihchi/mermaid.ink/actions/workflows/CI.yaml)

## Getting Started

```
git clone https://github.com/jihchi/mermaid.ink.git
cd mermaid.ink
pnpm install
DEBUG=app:* pnpm start
```

Go to http://localhost:3000

## Troubleshooting

### I'm getting back `HTTP 431 Request Header Fields Too Large` error

**Note that you may encounter DoS if you increase `--max-http-header-size`!**

> Thanks [@ryepup](https://github.com/ryepup) for the analysis and work-arounds ([#12](https://github.com/jihchi/mermaid.ink/issues/12))

- If running locally, add `--max-http-header-size` to the start script in package.json

  - e.g. `"start": "node --max-http-header-size=102400000 src/index.js"`

- If running via docker, use [`NODE_OPTIONS`](https://nodejs.org/api/cli.html#cli_node_options_options) to increase `--max-http-header-size`
  - e.g. `docker run --rm -it -e 'NODE_OPTIONS="--max-http-header-size=102400000"' -p 3000:3000 jihchi/mermaid.ink`

Or, If running locally, run `NODE_OPTIONS="--max-http-header-size=102400000" npm start` to increase `--max-http-header-size`

## Contributors

Many thanks for your help!

<a href="https://github.com/jihchi/mermaid.ink/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=jihchi/mermaid.ink" />
</a>

The image of contributors is made with [contrib.rocks](https://contrib.rocks).
