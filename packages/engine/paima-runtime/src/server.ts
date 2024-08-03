import cors from 'cors';
import type { Express, Response as ExResponse, Request as ExRequest, NextFunction } from 'express';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { basicControllerJson } from '@paima/rest';
import { merge, isErrorResult } from 'openapi-merge';
import { doLog, ENV, logError } from '@paima/utils';
import path from 'path';
import { ValidateError } from 'tsoa';
import { BuiltinEvents, toAsyncApi } from '@paima/events';
import YAML from 'yaml';

const server: Express = express();
const bodyParser = express.json();

server.use(express.static(path.join(__dirname, 'public')));
server.use(cors());
server.use(bodyParser);

const DocPaths = {
  Root: 'docs',
  Rest: 'rest',
  AsyncApi: {
    Root: 'asyncapi',
    Yml: 'spec.yml',
    Ui: 'ui',
  },
} as const;

function startServer(): void {
  // Assign the port
  let port = process.env.WEBSERVER_PORT;
  if (!port) port = '3333';

  server.listen(port, () => {
    // note: this server is publicly accessible through BACKEND_URI
    doLog(`Game Node Webserver Started At: http://localhost:${port}`);
    doLog(`    See REST docs at: http://localhost:${port}/${DocPaths.Root}/${DocPaths.Rest}`);
    doLog(
      `    See MQTT event docs at http://localhost:${port}/${DocPaths.Root}/${DocPaths.AsyncApi}/${DocPaths.AsyncApi.Ui}`
    );
  });
}

function getOpenApiJson(userStateMachineApi: object | undefined): object {
  if (userStateMachineApi == null) {
    return basicControllerJson;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mergeResult = merge([{ oas: basicControllerJson as any }, { oas: userStateMachineApi }]);
    if (isErrorResult(mergeResult)) {
      logError(`Failed to merge openAPI definitions: ${JSON.stringify(mergeResult)}`);
      return userStateMachineApi;
    }
    return mergeResult.output;
  }
}

function registerValidationErrorHandler(): void {
  server.use(function errorHandler(
    err: unknown,
    req: ExRequest,
    res: ExResponse,
    next: NextFunction
  ): ExResponse | void {
    if (err instanceof ValidateError) {
      console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
      return res.status(422).json({
        message: 'Validation Failed',
        details: err?.fields,
      });
    }
    if (err instanceof Error) {
      // Log rather than swallowing silently, otherwise difficult to debug.
      console.warn(`${req.method} ${req.path}:`, err);

      return res.status(500).json({
        message: 'Internal Server Error',
      });
    }

    next();
  });
}

function registerDocs(userStateMachineApi: object | undefined): void {
  const swaggerUiPath = path.resolve(__dirname) + '/swagger-ui';
  const swaggerServer = [
    swaggerUi.serve[0],
    // the default swaggerUi.serve points to the root of the `pkg` build from standalone
    // there is no way to override the path, so we instead just add a new path
    // that we manually added in the standalone build that contains the swagger-ui
    // this isn't ideal as it bloats the executable by 10MB
    express.static(swaggerUiPath, {}),
  ];
  const openApi = getOpenApiJson(userStateMachineApi);
  server.use(
    `/${DocPaths.Root}/${DocPaths.Rest}`,
    swaggerServer,
    swaggerUi.setup(openApi, { explorer: false })
  );
}

server.get(`/${DocPaths.Root}/${DocPaths.AsyncApi.Root}/${DocPaths.AsyncApi.Yml}`, (_, res) => {
  const asyncApi = toAsyncApi(
    {
      backendUri: ENV.MQTT_ENGINE_BROKER_URL,
      batcherUri: ENV.MQTT_BATCHER_BROKER_URL,
    },
    BuiltinEvents
  );
  res.send(YAML.stringify(asyncApi, null, 2));
});

server.get(`/${DocPaths.Root}/${DocPaths.AsyncApi.Root}/${DocPaths.AsyncApi.Ui}`, (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'asyncapi.html'));
});

export { server, startServer, registerDocs, registerValidationErrorHandler };
