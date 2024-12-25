FROM node:18-bullseye

WORKDIR /neuApp

COPY /neuApp .

RUN apt-get update && apt-get install -y unzip \
    && npm install -g @neutralinojs/neu \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# RUN cd neuApp
RUN neu run

# CMD ["neu", "run"]