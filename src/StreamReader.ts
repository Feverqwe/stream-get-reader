import {finished, Readable} from "stream";

class StreamReader {
  private readonly bufferSize: number;
  private readonly finishedDisposer: () => void;
  private readonly chunksBuffer: Buffer[] = [];
  private chunksBufferLen = 0;
  private streamEnded = false;
  private streamErr: Error | undefined;
  private streamFinished = false;
  private destroyed = false;
  private waitFn: ((isFinish?: boolean) => void) | null = null;

  constructor(private stream: Readable) {
    this.bufferSize = stream.readableHighWaterMark;

    this.finishedDisposer = finished(stream, (err) => {
      this.cleanup();
      this.streamFinished = true;
      if (err) {
        this.streamErr = err;
      } else {
        this.streamEnded = true;
      }
      this.waitFn && this.waitFn();
    });
    stream.on('data', this.onData);
  }

  public async read(): Promise<{done: true, value: undefined} | {done: false, value: Buffer}> {
    if (this.chunksBufferLen === 0) {
      await this.readUntil();
    }

    const chunk = this.chunksBuffer.shift();
    if (chunk === undefined) {
      return {done: true, value: undefined};
    }

    const chunkLen = chunk.byteLength;
    this.chunksBufferLen -= chunkLen;

    if (!this.streamFinished && this.chunksBufferLen < this.bufferSize) {
      if (this.stream.isPaused()) {
        this.stream.resume();
      }
    }

    return {done: false, value: chunk};
  }

  private onData = (chunk: Buffer) => {
    this.chunksBuffer.push(chunk);
    this.chunksBufferLen += chunk.byteLength;

    this.waitFn && this.waitFn(true);

    if (this.chunksBufferLen >= this.bufferSize) {
      this.stream.pause();
    }
  }

  private async readUntil() {
    if (this.streamErr) throw this.streamErr;
    if (this.destroyed || this.streamEnded) return;

    const resultPromise = new Promise<void>((resolve, reject) => {
      this.waitFn = (isRead) => {
        this.waitFn = null;
        !isRead && this.streamErr ? reject(this.streamErr) : resolve();
      };
    });

    if (this.stream.isPaused()) {
      this.stream.resume();
    }

    return resultPromise;
  }

  private cleanup() {
    this.finishedDisposer();
    this.stream.off('data', this.onData);
  }

  public destroy<T extends Error>(err?: T) {
    this.destroyed = true;

    this.cleanup();
    this.chunksBuffer.splice(0);
    this.chunksBufferLen = 0;

    if (this.stream.isPaused()) {
      this.stream.resume();
    }

    this.stream.once('error', (err) => {
      // pass
    });
    this.stream.destroy(this.streamErr = err);

    this.waitFn && this.waitFn();
  }
}

export function getStreamReader(stream: Readable) {
  return new StreamReader(stream);
}

export default StreamReader;
