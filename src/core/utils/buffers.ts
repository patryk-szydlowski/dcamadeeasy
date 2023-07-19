export function concatenateBufferArrays(...arrays: Uint8Array[]) {
  const bufferSize = arrays.reduce((a, b) => a + b.byteLength, 0);
  const combinedBuffer = new Uint8Array(bufferSize);

  let offset = 0;

  for (const bufferArray of arrays) {
    combinedBuffer.set(bufferArray, offset);
    offset += bufferArray.byteLength;
  }

  return combinedBuffer;
}
