# stream-get-reader

Stream reader, something like ReadableStream.getReader

```
npm install stream-get-reader
```

## Usage

``` js
import {getStreamReader} from "stream-get-reader";
import {Readable} from "stream";

const stream = Readable.from(Buffer.alloc(1024 * 1024));
const reader = getStreamReader(stream);

while(true) {
    const {done, value} = await reader.read();
    if (done) break;
    console.log(value);
}

```

## API

### new StreamReader(Readable)

``` js
import StreamReader from "stream-get-reader";
import {Readable} from "stream";

const stream = Readable.from(Buffer.alloc(1024 * 1024));
const reader = new StreamReader(stream);

const {done, value} = await reader.read();

reader.destroy();

```

#### reader.read()

- Returns: `Promise<{done: true, value: undefined} | {done: false, value: Buffer}>`

The `reader.read()` method pulls some value out of the buffer and returns it.
If stream emit error, it throws error when buffer will be empty.
If reader was destroyed it throw error if it was provided or will be done.

#### reader.destroy([error])

- error `<Error>` Optional an error

Destroy the reader and optionally provide an error.
When you call `reader.destroy()`, it calls `Readable.destroy(error)` too.
