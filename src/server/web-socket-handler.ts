import { IncomingMessage } from 'http';
import crypto from 'node:crypto';
import internal from 'stream';

class WebSocketHandler {
  private createSocketAccept(id: string): string {
    const sha1 = crypto.createHash('sha1');
    sha1.update(id + process.env.WEBSOCKET_MAGIC_STRING_KEY);

    return sha1.digest('base64');
  }

  private prepareHeaders(id: string): string {
    const acceptKey = this.createSocketAccept(id);

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

  public upgrade = (req: IncomingMessage, socket: internal.Duplex) => {
    const { 'sec-websocket-key': webClientSocketKey } = req.headers;

    const headers = this.prepareHeaders.bind(this)(webClientSocketKey);

    socket.write(headers);
  };
}

export default WebSocketHandler;
