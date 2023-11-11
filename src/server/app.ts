import 'dotenv/config';
import { createServer } from 'http';

function configureServer() {
  const server = createServer((request, response) => {
    if (request.url === '/') {
      response.writeHead(200);
      response.end('API WebSocket - 1.0.0');
    } else {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Not Found');
    }
  });

  return server;
}

export const app = configureServer();
