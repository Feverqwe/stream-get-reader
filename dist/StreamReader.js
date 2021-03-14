"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStreamReader = void 0;
const stream_1 = require("stream");
class StreamReader {
    constructor(stream) {
        this.stream = stream;
        this.chunksBuffer = [];
        this.chunksBufferLen = 0;
        this.streamEnded = false;
        this.streamFinished = false;
        this.destroyed = false;
        this.waitFn = null;
        this.onData = (chunk) => {
            this.chunksBuffer.push(chunk);
            this.chunksBufferLen += chunk.byteLength;
            this.waitFn && this.waitFn(true);
            if (this.chunksBufferLen >= this.bufferSize) {
                this.stream.pause();
            }
        };
        this.bufferSize = stream.readableHighWaterMark;
        this.finishedDisposer = stream_1.finished(stream, (err) => {
            this.cleanup();
            this.streamFinished = true;
            if (err) {
                this.streamErr = err;
            }
            else {
                this.streamEnded = true;
            }
            this.waitFn && this.waitFn();
        });
        stream.on('data', this.onData);
    }
    async read() {
        if (this.chunksBufferLen === 0) {
            await this.readUntil();
        }
        const chunk = this.chunksBuffer.shift();
        if (chunk === undefined) {
            return { done: true, value: undefined };
        }
        const chunkLen = chunk.byteLength;
        this.chunksBufferLen -= chunkLen;
        if (!this.streamFinished && this.chunksBufferLen < this.bufferSize) {
            if (this.stream.isPaused()) {
                this.stream.resume();
            }
        }
        return { done: false, value: chunk };
    }
    async readUntil() {
        if (this.streamErr)
            throw this.streamErr;
        if (this.destroyed || this.streamEnded)
            return;
        const resultPromise = new Promise((resolve, reject) => {
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
    cleanup() {
        this.finishedDisposer();
        this.stream.off('data', this.onData);
    }
    destroy(err) {
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
function getStreamReader(stream) {
    return new StreamReader(stream);
}
exports.getStreamReader = getStreamReader;
exports.default = StreamReader;
