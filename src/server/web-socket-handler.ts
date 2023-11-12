import { IncomingMessage } from 'http';
import crypto from 'node:crypto';
import internal from 'stream';

const SEVEN_BITS_INTEGER_MARKER = 125;
const SIXTEEN_BITS_INTEGER_MARKER = 126;
const MASK_KEY_BYTES_LENGTH = 4;
const FIRST_BIT = 128; // parseInt('10000000', 2)

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

  private unmask(encodedBuffer: Buffer, maskKey: Buffer) {
    const finalBuffer = Buffer.from(encodedBuffer);

    for (let index = 0; index < encodedBuffer.length; index++) {
      finalBuffer[index] =
        encodedBuffer[index] ^ maskKey[index % MASK_KEY_BYTES_LENGTH];
    }

    return finalBuffer;
  }

  private readableSocket(socket: internal.Duplex) {
    socket.read(1);

    const [markerAndPayloadLength] = socket.read(1);
    const lengthIndicatorInBits = markerAndPayloadLength - FIRST_BIT;

    let messageLength = 0;

    if (lengthIndicatorInBits <= SEVEN_BITS_INTEGER_MARKER) {
      messageLength = lengthIndicatorInBits;
    } else if (lengthIndicatorInBits === SIXTEEN_BITS_INTEGER_MARKER) {
      messageLength = socket.read(2).readUint16BE(0);
    } else {
      throw new Error(
        `your message is too long! we don't handle 64-bit messages`,
      );
    }

    const maskKey = socket.read(MASK_KEY_BYTES_LENGTH);
    const encoded = socket.read(messageLength);
    const decoded = this.unmask(encoded, maskKey);
    const received = decoded.toString('utf8');

    const data = JSON.parse(received);
    console.log('Message:', data);
  }

  public upgrade = (req: IncomingMessage, socket: internal.Duplex) => {
    const { 'sec-websocket-key': webClientSocketKey } = req.headers;

    const headers = this.prepareHeaders.bind(this)(webClientSocketKey);

    socket.write(headers);
    socket.on('readable', () => this.readableSocket(socket));
  };
}

export default WebSocketHandler;
