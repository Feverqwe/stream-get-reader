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
        this.streamErr = null;
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
            // debug('finished: %O', err || 'ok');
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
        // debug('read');
        if (this.chunksBufferLen === 0) {
            await this.readUntil();
        }
        const chunk = this.chunksBuffer.shift();
        if (chunk === undefined) {
            return { done: true, data: null };
        }
        const chunkLen = chunk.byteLength;
        this.chunksBufferLen -= chunkLen;
        if (!this.streamFinished && this.chunksBufferLen < this.bufferSize) {
            if (this.stream.isPaused()) {
                // debug('background resume');
                this.stream.resume();
            }
        }
        return { done: false, data: chunk };
    }
    async readUntil() {
        // debug('readUntil');
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
    destroy() {
        // debug('destroy');
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
        this.stream.destroy(this.streamErr = new Error('StreamReader destroyed'));
        this.waitFn && this.waitFn();
    }
}
function getStreamReader(stream) {
    return new StreamReader(stream);
}
exports.getStreamReader = getStreamReader;
exports.default = StreamReader;
