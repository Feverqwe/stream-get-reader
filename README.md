# stream-get-reader

Stream reader, something like ReadableStream.getReader

```
npm install stream-get-reader
```

## Usage

``` js
const {getStreamReader} = require('stream-get-reader');

const stream = Readable.from(Buffer.alloc(1024 * 1024));
const reader = getStreamReader(stream);

while(true) {
    const {done, data} = await reader.read();
    if (done) break;
    console.log(data);
}

```
