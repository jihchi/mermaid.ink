# [mermaid.ink](https://mermaid.ink)

[![GitHub](https://img.shields.io/github/license/jihchi/mermaid.ink)](./LICENSE)
[![Travis build status](https://travis-ci.org/jihchi/mermaid.ink.svg?branch=master)](https://travis-ci.org/jihchi/mermaid.ink)
[![Docker Automated build](https://img.shields.io/docker/automated/jihchi/mermaid.ink)](https://hub.docker.com/r/jihchi/mermaid.ink/builds)
[![Docker Pulls](https://img.shields.io/docker/pulls/jihchi/mermaid.ink)](https://hub.docker.com/r/jihchi/mermaid.ink)

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

## Test

```
yarn test
```
