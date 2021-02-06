const getByteLength = (
  s: string | NodeJS.ArrayBufferView | ArrayBuffer | SharedArrayBuffer,
  encoding: BufferEncoding = 'utf8',
) => Buffer.byteLength(s, encoding);

export default getByteLength;
