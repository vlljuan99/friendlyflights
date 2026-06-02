# Debian slim — required for Playwright's Chromium apt dependencies
FROM node:20-slim

WORKDIR /app

# System libraries needed by Playwright Chromium + Python for the fli provider
RUN apt-get update && apt-get install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libasound2 libpango-1.0-0 libpangocairo-1.0-0 \
  libgtk-3-0 libx11-xcb1 ca-certificates fonts-liberation \
  python3 python3-pip \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Primary flight provider: fli (free Google Flights reader). PYTHON_BIN tells
# the Node server which interpreter to spawn.
ENV PYTHON_BIN=python3
RUN pip3 install --no-cache-dir --break-system-packages flights

# Node dependencies (cached layer — rebuild only when package.json changes)
COPY package*.json ./
RUN npm install --omit=dev

# Install Playwright Chromium browser inside the image
RUN npx playwright install chromium

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
