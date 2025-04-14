FROM ghcr.io/puppeteer/puppeteer:24.6.1
LABEL maintainer="Jihchi Lee <achi@987.tw>"

# Install system dependencies
USER root

RUN apt-get update \
  && apt-get -yq upgrade \
  && apt-get install -y --no-install-recommends \
    fonts-kacst \
    fonts-freefont-ttf \
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    fonts-noto-color-emoji \
    fonts-font-awesome \
  && fc-cache -f -v \
  && apt-get autoremove -y \
  && apt-get autoclean \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /src/*.deb

USER pptruser

# Set global npm dependencies in the non-root (pptruser) directory
# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#global-npm-dependencies
ENV NPM_CONFIG_PREFIX=/home/pptruser/.npm-global
ENV PATH=$PATH:/home/pptruser/.npm-global/bin
RUN mkdir -p /home/pptruser/.npm-global/bin

# Install package manager
RUN corepack enable --install-directory /home/pptruser/.npm-global/bin

# pnpm fetch does require only lockfile
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch --prod
COPY . ./
RUN pnpm install -r --offline --prod

CMD ["pnpm", "start"]
EXPOSE 3000
