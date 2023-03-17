import cors from 'cors';
import type { Express } from 'express';
import express from 'express';

import { doLog } from '@paima/utils';

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
export { server, startServer };
