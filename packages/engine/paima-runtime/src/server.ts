import cors from 'cors';
import type { Express, Response as ExResponse, Request as ExRequest, NextFunction } from 'express';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { basicControllerJson } from '@paima/rest';
import { merge, isErrorResult } from 'openapi-merge';
import { doLog, logError } from '@paima/utils';
import path from 'path';
import { ValidateError } from 'tsoa';

const server: Express = express();
const bodyParser = express.json();

server.use(cors());
server.use(bodyParser);

function startServer(): void {
  // Assign the port
  let port = process.env.WEBSERVER_PORT;
  if (!port) port = '3333';

  server.listen(port, () => {
    doLog(`Game Node Webserver Started At: http://localhost:${port}`);
  });
}

function getOpenApiJson(userStateMachineApi: object | undefined): object {
  if (userStateMachineApi == null) {
    return basicControllerJson;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mergeResult = merge([{ oas: basicControllerJson as any }, { oas: userStateMachineApi }]);
    if (isErrorResult(mergeResult)) {
      logError('Failed to merge openAPI definitions');
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
  server.use('/docs', swaggerServer, swaggerUi.setup(openApi, { explorer: false }));
}
export { server, startServer, registerDocs, registerValidationErrorHandler };
