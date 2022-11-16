import cors from 'cors';
import type { Express } from 'express';
import express from 'express';

const server: Express = express();
const bodyParser = express.json();
const port = process.env.CATAPULT_WEBSERVER_PORT || 3333; // default port to listen

server.use(cors());
server.use(bodyParser);

function startServer(): void {
  server.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
  });
}
export { server, startServer };
