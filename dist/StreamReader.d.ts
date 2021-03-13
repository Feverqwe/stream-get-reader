/// <reference types="node" />
import { Readable } from "stream";
declare class StreamReader {
    private stream;
    private readonly bufferSize;
    private readonly finishedDisposer;
    private readonly chunksBuffer;
    private chunksBufferLen;
    private streamEnded;
    private streamErr;
    private streamFinished;
    private destroyed;
    private waitFn;
    constructor(stream: Readable);
    read(): Promise<{
        done: true;
        data: null;
    } | {
        done: false;
        data: Buffer;
    }>;
    private onData;
    private readUntil;
    private cleanup;
    destroy(): void;
}
export declare function getStreamReader(stream: Readable): StreamReader;
export default StreamReader;
