import crypto from 'node:crypto';

function createSocketAccept(id: string): string {
  const sha1 = crypto.createHash('sha1');
  sha1.update(id + process.env.WEBSOCKET_MAGIC_STRING_KEY);

  return sha1.digest('base64');
}

function prepareHeaders(id: string): string {
  const acceptKey = createSocketAccept(id);

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '',
  ]
    .map(line => line.concat('\r\n'))
    .join('');

  return headers;
}

export default prepareHeaders;
