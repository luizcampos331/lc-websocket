function unmask(
  maskKeyBytesLengthNumber: number,
  encodedBuffer: Buffer,
  maskKey: Buffer,
) {
  const finalBuffer = Buffer.from(encodedBuffer);

  for (let index = 0; index < encodedBuffer.length; index++) {
    finalBuffer[index] =
      encodedBuffer[index] ^ maskKey[index % maskKeyBytesLengthNumber];
  }

  return finalBuffer;
}

export default unmask;
