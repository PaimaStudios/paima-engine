# Common build stage
FROM node:16.17.0 as common-build-stage

#RUN apk add --no-cache python3 make g++

COPY . ./app

WORKDIR /app

RUN sh wipe.sh

RUN npm install

RUN npm run build

ARG BATCHER_PORT
ENV EXPOSED_BATCHER_PORT=$BATCHER_PORT
EXPOSE ${EXPOSED_BATCHER_PORT}

# Production build stage
FROM common-build-stage as production-build-stage

ENV NODE_ENV production

CMD ["npm", "run", "prod"]
