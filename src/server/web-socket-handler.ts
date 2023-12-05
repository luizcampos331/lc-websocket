import { IncomingMessage } from 'http';
import internal from 'stream';
import concatBuffer from 'utils/concat-buffer';
import prepareHeaders from 'utils/prepare-headers';
import unmask from 'utils/unmask';

const SEVEN_BITS_INTEGER_MARKER = 125;
const SIXTEEN_BITS_INTEGER_MARKER = 126;
const SIXTY_FOUR_BITS_INTEGER_MARKER = 127;

const MASK_KEY_BYTES_LENGTH = 4;
const FIRST_BIT = 128; // parseInt('10000000', 2)
const MAXIMUM_SIXTEEN_BITS_INTEGER = 2 ** 16; // 0 to 65536 -> start 64-bits
const OPCODE_TEXT = 0x01; // 1 bit in binary 1

class WebSocketHandler {
  private buffer: Buffer = Buffer.alloc(0);

  private readableSocket(socket: internal.Duplex): string {
    let received = '';

    const chunk = socket.read();

    this.buffer = Buffer.concat([this.buffer, chunk]);

    if (this.buffer.length < 2) {
      throw new Error('Insufficient data to read message');
    }

    const lengthIndicatorInBits = this.buffer.readUInt8(1) - FIRST_BIT;

    let messageLength = 0;
    let dataOffset = 0;

    if (lengthIndicatorInBits <= SEVEN_BITS_INTEGER_MARKER) {
      messageLength = lengthIndicatorInBits;
      dataOffset = 2;
    } else if (lengthIndicatorInBits === SIXTEEN_BITS_INTEGER_MARKER) {
      messageLength = this.buffer.readUInt16BE(2);
      dataOffset = 4;
    } else {
      messageLength = Number(this.buffer.readBigUint64BE(2));
      dataOffset = 10;
    }

    const maskingKey = this.buffer.subarray(
      dataOffset,
      dataOffset + MASK_KEY_BYTES_LENGTH,
    );

    const messageOffset = dataOffset + MASK_KEY_BYTES_LENGTH;

    if (this.buffer.length >= messageOffset + messageLength) {
      const encoded: Buffer = this.buffer.subarray(
        messageOffset,
        messageOffset + messageLength,
      );

      const decoded = unmask(MASK_KEY_BYTES_LENGTH, encoded, maskingKey);

      received = decoded.toString('utf8');

      this.buffer = this.buffer.subarray(messageOffset + messageLength);
    }

    return received;
  }

  private sendMessage(message: string, socket: internal.Duplex) {
    const msg = Buffer.from(message);
    const messageSize = msg.length;

    let dataFrameBuffer: Buffer;

    const firstByte = 0x80 | OPCODE_TEXT;

    if (messageSize <= SEVEN_BITS_INTEGER_MARKER) {
      const bytes = [firstByte];
      dataFrameBuffer = Buffer.from(bytes.concat(messageSize));
    } else if (messageSize < MAXIMUM_SIXTEEN_BITS_INTEGER) {
      const offsetFourBytes = 4;
      const target = Buffer.allocUnsafe(offsetFourBytes);
      target[0] = firstByte;
      target[1] = SIXTEEN_BITS_INTEGER_MARKER | 0x0;

      target.writeUint16BE(messageSize, 2);
      dataFrameBuffer = target;
    } else {
      const offsetTenBytes = 10;
      const target = Buffer.allocUnsafe(offsetTenBytes);
      target[0] = firstByte;
      target[1] = SIXTY_FOUR_BITS_INTEGER_MARKER | 0x0;

      target.writeBigUInt64BE(BigInt(messageSize), 2);
      dataFrameBuffer = target;
    }
    const totalLength = dataFrameBuffer.byteLength + messageSize;
    const dataFrameResponse = concatBuffer([dataFrameBuffer, msg], totalLength);

    socket.write(dataFrameResponse);
  }

  public upgrade = (req: IncomingMessage, socket: internal.Duplex) => {
    const { 'sec-websocket-key': webClientSocketKey } = req.headers;

    const headers = prepareHeaders(webClientSocketKey);

    socket.write(headers);

    socket.on('readable', () => {
      const received = this.readableSocket(socket);

      if (received) {
        this.sendMessage(received, socket);
      }
    });
  };
}

export default WebSocketHandler;
