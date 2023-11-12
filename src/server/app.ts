import 'dotenv/config';
import { createServer } from 'http';

import WebSocketHandler from './web-socket-handler';

function configureServer() {
  const webSocketHandler = new WebSocketHandler();

  const server = createServer((request, response) => {
    try {
      if (request.url === '/') {
        response.writeHead(200);
        response.end('API WebSocket - 1.0.0');
      } else {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.end('Not Found');
      }
    } catch (error) {
      console.error(error);

      response.writeHead(500, { 'Content-Type': 'text/plain' });
      response.end('Internal Server Error');
      return;
    }
  });

  server.on('upgrade', webSocketHandler.upgrade);

  return server;
}

export const app = configureServer();
