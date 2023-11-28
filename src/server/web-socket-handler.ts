import { IncomingMessage } from 'http';
import crypto from 'node:crypto';
import internal from 'stream';

const SEVEN_BITS_INTEGER_MARKER = 125;
const SIXTEEN_BITS_INTEGER_MARKER = 126;
const MASK_KEY_BYTES_LENGTH = 4;
const FIRST_BIT = 128; // parseInt('10000000', 2)
const MAXIMUM_SIXTEEN_BITS_INTEGER = 2 ** 16; // 0 to 65536
const OPCODE_TEXT = 0x01; // 1 bit in binary 1

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

  private readableSocket(socket: internal.Duplex): string {
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
        `Your message is too long! we don't read 64-bit messages`,
      );
    }

    const maskKey = socket.read(MASK_KEY_BYTES_LENGTH);
    const encoded = socket.read(messageLength);
    const decoded = this.unmask(encoded, maskKey);
    const received = decoded.toString('utf8');

    return received;
  }

  public concat(bufferList: Buffer[], totalLength: number) {
    const target = Buffer.allocUnsafe(totalLength);
    let offset = 0;
    for (const buffer of bufferList) {
      target.set(buffer, offset);
      offset += buffer.length;
    }

    return target;
  }

  public sendMessage(message: string, socket: internal.Duplex) {
    const msg = Buffer.from(message);
    const messageSize = msg.length;

    let dataFrameBuffer: Buffer;

    const firstByte = 0x80 | OPCODE_TEXT;
    if (messageSize <= SEVEN_BITS_INTEGER_MARKER) {
      const bytes = [firstByte];
      dataFrameBuffer = Buffer.from(bytes.concat(messageSize));
    } else if (messageSize <= MAXIMUM_SIXTEEN_BITS_INTEGER) {
      const offsetFourBytes = 4;
      const target = Buffer.allocUnsafe(offsetFourBytes);
      target[0] = firstByte;
      target[1] = SIXTEEN_BITS_INTEGER_MARKER | 0x0;

      target.writeUint16BE(messageSize, 2);
      dataFrameBuffer = target;
    } else {
      throw new Error(
        `Your message is too long! we don't write 64-bit messages`,
      );
    }
    const totalLength = dataFrameBuffer.byteLength + messageSize;
    const dataFrameResponse = this.concat([dataFrameBuffer, msg], totalLength);

    socket.write(dataFrameResponse);
  }

  public upgrade = (req: IncomingMessage, socket: internal.Duplex) => {
    const { 'sec-websocket-key': webClientSocketKey } = req.headers;

    const headers = this.prepareHeaders(webClientSocketKey);

    socket.write(headers);

    socket.on('readable', () => {
      const messageString = this.readableSocket(socket);
      this.sendMessage(messageString, socket);
    });
  };
}

export default WebSocketHandler;
