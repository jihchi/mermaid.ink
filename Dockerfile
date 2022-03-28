# based on: https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
FROM docker.io/library/node:17-buster-slim
LABEL maintainer="Jihchi Lee <achi@987.tw>"

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN apt-get update \
  && apt-get -yq upgrade \
  && apt-get install -y curl gnupg \
  && curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && sed -i -e's/ main/ main contrib non-free/g' /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y \
    google-chrome-stable \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    ttf-mscorefonts-installer \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    fonts-font-awesome \
    libxss1 \
    fontconfig \
    --no-install-recommends \
  && fc-cache -f -v \
  && apt-get autoremove -y \
  && apt-get autoclean \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /src/*.deb

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# node application onbuild
COPY package.json yarn.lock /usr/src/app/
RUN yarn --production=true && yarn cache clean --force
COPY . /usr/src/app

# Add user so we don't need --no-sandbox.
# same layer as npm install to keep re-chowned files from using up several hundred MBs more space
RUN usermod -a -G audio,video node \
	&& mkdir -p /home/node/Downloads \
	&& chown -R node:node /home/node /usr/src/app/

USER node
CMD ["yarn", "start"]

EXPOSE 3000
