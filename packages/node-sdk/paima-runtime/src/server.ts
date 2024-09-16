import cors from 'cors';
import type { Express, Response as ExResponse, Request as ExRequest, NextFunction } from 'express';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { basicControllerJson } from '@paima/rest';
import { merge, isErrorResult } from 'openapi-merge';
import { doLog, ENV, logError } from '@paima/utils';
import path from 'path';
import { ValidateError } from 'tsoa';
import type { EventPathAndDef } from '@paima/events';
import { BuiltinEvents, toAsyncApi } from '@paima/events';
import YAML from 'yaml';
import { evmRpcEngine } from './evm-rpc/eip1193.js';
import { StatusCodes } from 'http-status-codes';
import type { ValidateErrorResult, InternalServerErrorResult } from '@paima/utils';
import fs from 'fs';

const server: Express = express();
const bodyParser = express.json();

server.use(express.static(path.join(__dirname, 'public')));
server.use(cors());
server.use(bodyParser);

const RpcPaths = {
  Root: 'rpc',
  EVM: 'evm',
} as const;
const DocPaths = {
  Root: 'docs',
  Rest: {
    Root: 'rest',
    Ui: 'ui',
    Spec: 'spec.json',
  },
  AsyncApi: {
    Root: 'asyncapi',
    Spec: 'spec.yml',
    Ui: 'ui',
  },
  Precompiles: {
    Root: 'precompiles',
  },
} as const;

function startServer(): void {
  // Assign the port
  let port = process.env.WEBSERVER_PORT;
  if (!port) port = '3333';

  server.listen(port, () => {
    // note: this server is publicly accessible through BACKEND_URI
    doLog(`Game Node Webserver Started At: http://localhost:${port}`);
    doLog(
      `    See EVM JSON-RPC wrapper at http://localhost:${port}/${RpcPaths.Root}/${RpcPaths.EVM}`
    );
    doLog(
      `    See REST docs at http://localhost:${port}/${DocPaths.Root}/${DocPaths.Rest.Root}/${DocPaths.Rest.Ui}`
    );
    doLog(
      `    See MQTT event docs at http://localhost:${port}/${DocPaths.Root}/${DocPaths.AsyncApi.Root}/${DocPaths.AsyncApi.Ui}`
    );
    doLog(
      `    See Precompiles docs at http://localhost:${port}/${DocPaths.Root}/${DocPaths.Precompiles.Root}`
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
      return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        message: 'Validation Failed',
        details: err?.fields,
      } satisfies ValidateErrorResult);
    }
    if (err instanceof Error) {
      // Log rather than swallowing silently, otherwise difficult to debug.
      console.warn(`${req.method} ${req.path}:`, err);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        errorMessage: 'Internal Server Error',
      } satisfies InternalServerErrorResult);
    }

    next();
  });
}

function registerDocsPrecompiles(precompiles: { [name: string]: `0x${string}` }): void {
  // It's possible in the future we add more information to this endpoint
  // so I future proof it by making it a JSON object instead of a raw string
  const futureproofJson: { [name: string]: { name: `0x${string}` } } = {};
  for (const k of Object.keys(precompiles)) {
    futureproofJson[k] = { name: precompiles[k] };
  }

  server.get(`/${DocPaths.Root}/${DocPaths.Precompiles.Root}`, (_, res) => {
    res.send(JSON.stringify(futureproofJson, null, 2));
  });
}

function registerDocsOpenAPI(userStateMachineApi: object | undefined): void {
  const swaggerUiPath = path.resolve(__dirname) + '/swagger-ui';

  const swaggerServer = ((): any[] => {
    // if the gamecode is bundled with this code, __dirname will point to the
    // bundle's path.  Bundling is not really a requirement, since it's possible
    // to just use the dependencies from node_modules (or when using esbuild,
    // marking swagger-ui-dist as external), but we can provide this anyway to
    // make it easier to make a packaged bundle.
    if (fs.existsSync(swaggerUiPath)) {
      return [swaggerUi.serve[0], express.static(swaggerUiPath, {})];
    } else {
      return swaggerUi.serve;
    }
  })();

  const openApi = getOpenApiJson(userStateMachineApi);

  server.get(`/${DocPaths.Root}/${DocPaths.Rest.Root}/${DocPaths.Rest.Spec}`, (_, res) => {
    res.send(JSON.stringify(openApi, null, 2));
  });
  server.use(
    `/${DocPaths.Root}/${DocPaths.Rest.Root}/${DocPaths.Rest.Ui}`,
    swaggerServer,
    swaggerUi.setup(openApi, { explorer: false })
  );
}

function registerDocsAppEvents(events: Record<string, EventPathAndDef[]>): void {
  const appEvents: [string, EventPathAndDef][] = Object.entries(events).flatMap(
    ([name, definitions]) =>
      definitions.map((definition: EventPathAndDef, index: number): [string, EventPathAndDef] => [
        name + index,
        definition,
      ])
  );

  server.get(`/${DocPaths.Root}/${DocPaths.AsyncApi.Root}/${DocPaths.AsyncApi.Spec}`, (_, res) => {
    const asyncApi = toAsyncApi(
      {
        backendUri: ENV.MQTT_ENGINE_BROKER_URL,
        // TODO: batcher docs theoretically should be hosted separately in some batcher-managed server
        batcherUri: ENV.MQTT_BATCHER_BROKER_URL,
      },
      (Object.entries(BuiltinEvents) as [string, EventPathAndDef][]).concat(appEvents)
    );
    res.send(YAML.stringify(asyncApi, null, 2));
  });
}

server.get(`/${DocPaths.Root}/${DocPaths.AsyncApi.Root}/${DocPaths.AsyncApi.Ui}`, (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'asyncapi.html'));
});

server.post(`/${RpcPaths.Root}/${RpcPaths.EVM}`, (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  evmRpcEngine.handle(req.body, (err, result) => {
    if (err) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: (err as any).message });
    } else {
      res.json(result);
    }
  });
});

export {
  server,
  startServer,
  registerDocsPrecompiles,
  registerDocsOpenAPI,
  registerValidationErrorHandler,
  registerDocsAppEvents,
};
