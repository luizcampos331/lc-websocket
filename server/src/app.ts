import 'dotenv/config';
import { createServer } from 'http';

function configureServer() {
  const server = createServer((_, response) => {
    response.writeHead(200)
    response.end('API WebSocket - 1.0.0')
  })

  return server
}

export const app = configureServer();
