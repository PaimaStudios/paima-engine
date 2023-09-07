# Common build stage
FROM node:16.17.0 as common-build-stage

COPY . ./app

WORKDIR /app

ARG BATCHER_PORT
ENV EXPOSED_BATCHER_PORT=$BATCHER_PORT
EXPOSE ${EXPOSED_BATCHER_PORT}

# Production build stage
FROM common-build-stage as production-build-stage

ENV NODE_ENV production

CMD ["./paima-batcher-linux"]
