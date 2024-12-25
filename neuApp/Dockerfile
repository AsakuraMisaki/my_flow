FROM node:18-bullseye

WORKDIR /app

COPY . .

EXPOSE 5173

RUN apt-get update && apt-get install -y unzip \
    && npm install -g @neutralinojs/neu \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

CMD ["neu", "run"]