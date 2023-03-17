import cors from 'cors';
import type { Express } from 'express';
import express from 'express';

import { doLog } from '@paima/utils';

const server: Express = express();
const bodyParser = express.json();
const port = process.env.WEBSERVER_PORT || 3333; // default port to listen

server.use(cors());
server.use(bodyParser);

function startServer(): void {
  server.listen(port, () => {
    doLog(`Game Node Webserver Started At: http://localhost:${port}`);
  });
}
export { server, startServer };
