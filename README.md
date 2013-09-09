#Simple Streams
[![Build Status](https://travis-ci.org/mirkokiefer/simple-stream.png?branch=master)](https://travis-ci.org/mirkokiefer/simple-stream)

[![NPM](https://nodei.co/npm/simple-stream.png)](https://nodei.co/npm/simple-stream/)

** Note: This is a work in progress of rewriting [async-iterators](https://github.com/mirkokiefer/async-iterators) using the Simple Stream protocol **

Useful stream sources, filters and sinks for [Simple Streams](https://github.com/creationix/js-git/blob/master/specs/simple-stream.md).

##Documentation
###Sources
- [fromArray](#fromArray)
- [fromReadableStream](#fromReadableStream)

###Filters
- [map](#map) / [mapAsync](#mapAsync)
- [filter](#filter) / [filterAsync](#filterAsync)
- [range](#range)
- [buffer](#buffer)

###Sinks
- [toArray](#toArray)
- [toWritableStream](#toWritableStream)
- [forEach](#forEach)

##Sources

<a name="fromArray" />
### fromArray(array) -> stream
Creates an stream from an array.

``` js
var arrayStream = stream.fromArray(numbers)
```

<a name="fromReadableStream" />
### fromReadableStream(readableStream) -> stream
Creates an stream from a [Readable Stream](http://nodejs.org/api/stream.html#stream_class_stream_readable).

``` js
var readStream = fs.createReadStream('input.txt', {encoding: 'utf8'})
var streamStream = stream.fromReadableStream(readStream)
```

##Filters

<a name="map" />
### map(stream, mapFn) -> stream
Create an stream that applies a map function to transform each value of the source stream.

``` js
var mapStream = stream.map(someNumberStream, function(err, each) {
  return each * 2
})

// pipe the stream to an array:
stream.toArray(mapStream, function(err, res) {
  console.log(res)
})
```

<a name="mapAsync" />
### mapAsync(stream, mapFn) -> stream

``` js
var mapStream = stream.map(someNumberStream, function(err, each, cb) {
  cb(null, each * 2)
})
```

<a name="filter" />
Create an stream that filters the values of the source stream using a filter function.

### filter(stream, filterFn) -> stream

``` js
var evenNumbersStream = stream.filter(someNumberStream, function(err, each) {
  return (each % 2) == 0
})
```

<a name="filterAsync" />
### filterAsync(stream, filterFn) -> stream

``` js
var evenNumbersStream = stream.filter(someNumberStream, function(err, each, cb) {
  cb(null, (each % 2) == 0)
})
```

<a name="range" />
### range(stream, range) -> stream
Creates an stream that only streames over the specified range.

`range` is specified as `{from: startIndex, to: endIndex}` where `from` and `to` are both inclusive.

``` js
var rangeStream = stream.range(stream, {from: 10, to: 19})
```

<a name="buffer" />
### buffer(stream, bufferSize) -> stream
Creates an stream with an internal buffer that is always filled until `bufferSize`.
The buffer can abviously only grow if the buffer stream is read slower than the underlying stream source can return data.

The current buffer fill ratio can be inspected at any time using `bufferFillRatio()` which returns a number between 0..1.

The buffer size can be changed using `setBufferSize(bufferSize)`.

``` js
var bufferedStream = stream.buffer(someStream, 10)

// inspect buffer size
console.log(bufferedStream.bufferFillRatio())

// change the buffer size later
bufferedStream.setBufferSize(100)
```

##Sinks

<a name="toArray" />
### toArray(stream) -> continuable
Reads the source stream and writes the results to an array.

``` js
stream.toArray(someStream)(function(err, array) {
  console.log(array)
})
```

<a name="toWritableStream" />
### toWritableStream(stream, writeStream, encoding) -> continuable
Reads the source stream and writes the result to a [Writable Stream](http://nodejs.org/api/stream.html#stream_class_stream_writable).

``` js
var writeStream = fs.createWriteStream('output.txt')
stream.toWritableStream(stream, writeStream, 'utf8')(function() {
  console.log('done')
})
```

<a name="forEach" />
### forEach(stream, fn) -> continuable
Reads the source stream and invokes `fn` for each value of the stream.

``` js
stream.forEach(someStream, function(err, data) {
  console.log(data)
})(function() {
  console.log('end')
})
```

<a name="forEachAsync" />
### forEachAsync(stream, fn) -> continuable
Reads the source stream and invokes `fn` for each value of the stream.
Only once the callback is invoked the next value is read from the source stream.

``` js
stream.forEachAsync(someStream, function(err, data, cb) {
  console.log(data)
  setTimeout(cb, 100)
}(function() {
  console.log('end')
})
```

##Contributors
This project was created by Mirko Kiefer ([@mirkokiefer](https://github.com/mirkokiefer)).
