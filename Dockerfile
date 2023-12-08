# based on: https://github.com/puppeteer/puppeteer/blob/main/docker/Dockerfile
FROM docker.io/library/node:20-bookworm-slim
LABEL maintainer="Jihchi Lee <achi@987.tw>"

RUN apt-get update \
  && apt-get install -y \
  # Using chromium allows this image to be built for non-x86 targets and reduces the image size.
  chromium \
  fonts-ipafont-gothic \
  fonts-wqy-zenhei \
  fonts-thai-tlwg \
  fonts-khmeros \
  fonts-kacst \
  fonts-freefont-ttf \
  libxss1 \
  dbus \
  dbus-x11 \
  --no-install-recommends \
  && service dbus start \
  && fc-cache -f -v \
  && apt-get autoremove -y \
  && apt-get autoclean \
  && rm -rf /var/lib/apt/lists/*

# node application onbuild
RUN corepack enable

RUN groupadd -r pptruser && useradd -rm -g pptruser -G audio,video pptruser

USER pptruser

WORKDIR /usr/src/app

ENV PUPPETEER_SKIP_DOWNLOAD true
ENV MERMAID_INK_USE_CHROMIUM true

# pnpm fetch does require only lockfile
COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod

COPY . ./
RUN pnpm install -r --offline --prod

CMD ["pnpm", "start"]

EXPOSE 3000
