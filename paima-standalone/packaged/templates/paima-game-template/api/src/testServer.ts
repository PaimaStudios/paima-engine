import type { Express } from 'express';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { RegisterRoutes } from './tsoa/routes';
import { ValidateError } from 'tsoa';

const server: Express = express();
const bodyParser = express.json();
const port = 3333; // default port to listen
server.use(cors());
server.use(bodyParser);
server.use(morgan('dev'));

function startServer() {
  server.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
  });
}

RegisterRoutes(server);

server.use(function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
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

//TODO: hot reloading?
startServer();
