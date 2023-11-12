import 'dotenv/config';
import { readFile } from 'fs';
import { createServer } from 'http';
import getPath from 'utils/get-path';

function configureServer() {
  const server = createServer(async (request, response) => {
    try {
      const indexPath = await getPath('client/public/index.html');
      const stylesPath = await getPath('client/public/styles.css');
      const scriptsPath = await getPath('client/public/scripts.js');

      switch (request.url) {
        case '/':
          readFile(indexPath, 'utf8', (error, data) => {
            if (error) {
              console.error(error);
              throw new Error(error.message);
            }

            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(data);
          });

          break;
        case '/styles.css':
          readFile(stylesPath, 'utf8', (error, data) => {
            if (error) {
              console.error(error);
              throw new Error(error.message);
            }

            response.writeHead(200, { 'Content-Type': 'text/css' });
            response.end(data);
          });

          break;
        case '/scripts.js':
          readFile(scriptsPath, 'utf8', (error, data) => {
            if (error) {
              console.error(error);
              throw new Error(error.message);
            }

            response.writeHead(200, { 'Content-Type': 'text/js' });
            response.end(data.replace('_SERVER_URL_', process.env.SERVER_URL));
          });

          break;
        default:
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

  return server;
}

export const app = configureServer();
