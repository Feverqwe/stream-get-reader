import {Readable} from "stream";
import {getStreamReader} from "../StreamReader";

const debug = require('debug')('StreamReader:test');

const MB = 1024 * 1024;

describe('streamReader', () => {
  test('test', async () => {
    const stream = Readable.from(Buffer.alloc(1024 * 1024));
    const reader = getStreamReader(stream);

    while(true) {
      const {done, value} = await reader.read();
      if (done) break;
      console.log(value);
    }
  });

  test('read', async () => {
    const len = 10 * MB;
    const stream = getStream(len);

    const reader = getStreamReader(stream);
    let readLen = 0;
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      readLen += value!.byteLength;
    }

    expect(readLen).toBe(readLen);
  });

  test('error until read', async () => {
    const len = 10 * MB;
    const stream = getStream(len);

    let readLen = 0;
    let err;
    try {
      const reader = getStreamReader(stream);
      while (true) {
        const readPromise = reader.read();
        if (readLen > 5 * MB) {
          stream.destroy(new Error('Force destroyed'));
        }
        const {done, value} = await readPromise;
        if (done) break;
        readLen += value!.byteLength;
      }
    } catch (_err) {
      err = _err;
    }

    expect(err).toMatchObject({message: 'Force destroyed'});
  });

  test('error after read', async () => {
    const len = 10 * MB;
    const stream = getStream(len);

    let readLen = 0;
    let err;
    try {
      const reader = getStreamReader(stream);
      while (true) {
        const {done, value} = await reader.read();
        if (readLen > 5 * MB) {
          stream.destroy(new Error('Force destroyed'));
        }
        if (done) break;
        readLen += value!.byteLength;
      }
    } catch (_err) {
      err = _err;
    }

    expect(err).toMatchObject({message: 'Force destroyed'});
  });

  test('error before read', async () => {
    const len = 10 * MB;
    const stream = getStream(len);

    let readLen = 0;
    let err;
    try {
      const reader = getStreamReader(stream);
      while (true) {
        if (readLen > 5 * MB) {
          stream.destroy(new Error('Force destroyed'));
        }
        const {done, value} = await reader.read();
        if (done) break;
        readLen += value!.byteLength;
      }
    } catch (_err) {
      err = _err;
    }

    expect(err).toMatchObject({message: 'Force destroyed'});
  });

  test('destroy until read', async () => {
    const len = 10 * MB;
    const stream = getStream(len);

    let readLen = 0;
    let err;
    try {
      const reader = getStreamReader(stream);
      while (true) {
        const readPromise = reader.read();
        if (readLen > 5 * MB) {
          reader.destroy(new Error('Aborted'));
        }
        const {done, value} = await readPromise;
        if (done) break;
        readLen += value!.byteLength;
      }
    } catch (_err) {
      err = _err;
    }

    expect(err).toMatchObject({message: 'Aborted'});
  });

  test('destroy before read', async () => {
    const len = 10 * MB;
    const stream = getStream(len);

    let readLen = 0;
    let err;
    try {
      const reader = getStreamReader(stream);
      while (true) {
        if (readLen > 5 * MB) {
          reader.destroy(new Error('Aborted'));
        }
        const {done, value} = await reader.read();
        if (done) break;
        readLen += value!.byteLength;
      }
    } catch (_err) {
      err = _err;
    }

    expect(err).toMatchObject({message: 'Aborted'});
  });

  test('destroy after read', async () => {
    const len = 10 * MB;
    const stream = getStream(len);

    let readLen = 0;
    let err;
    try {
      const reader = getStreamReader(stream);
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        readLen += value!.byteLength;
        if (readLen > 5 * MB) {
          reader.destroy(new Error('Aborted'));
        }
      }
    } catch (_err) {
      err = _err;
    }

    expect(err).toMatchObject({message: 'Aborted'})
  });
});

function getStream(len: number) {
  return new Readable({
    read() {
      const size = 16 * 1024;
      let targetSize = size;
      if (targetSize > len) {
        targetSize = len;
      }
      len -= targetSize;

      if (!len) {
        this.push(null);
      } else {
        const buffer = Buffer.alloc(size);
        Promise.resolve().then(() => {
          this.push(buffer);
        });
      }
    }
  });
}
