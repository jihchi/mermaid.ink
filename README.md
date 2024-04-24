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

## Launch a container

See [here](https://github.com/jihchi/mermaid.ink/pkgs/container/mermaid.ink) for supported tags.

```
docker run --cap-add=SYS_ADMIN ghcr.io/jihchi/mermaid.ink
```

Go to http://localhost:3000

If you don't / can't add `--cap-add=SYS_ADMIN` to the command, please refer to [3 ways to securely use Chrome Headless with this image](https://github.com/Zenika/alpine-chrome?tab=readme-ov-file#3-ways-to-securely-use-chrome-headless-with-this-image) to find the most suitable solution for your case.

### With `seccomp`

For example, you can use [Jessie Frazelle seccomp profile for Chrome](https://github.com/Zenika/alpine-chrome/blob/master/chrome.json):

```
wget https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/docker/seccomp/chrome.json
docker run --security-opt seccomp=$(pwd)/chrome.json ghcr.io/jihchi/mermaid.ink
```

### Environment variables

| variable name | default value | description |
| -- | -- | -- |
| `MAX_WIDTH` | `10000` | Determine the maximum scaled diagram width that can be requested |
| `MAX_HEIGHT` | `10000` | Determine the maximum scaled diagram height that can be requested |
| `FONT_AWESOME_CSS_URL` | `<unset>` | Sets a custom URL for the injected font-awesome CSS in the SVG. <br><br> The string `FA_VERSION` will be replaced with the version of font-awesome in use by the application e.g., `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/FA_VERSION/css/all.min.css`. |

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
