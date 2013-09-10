
var sources = require('./sources')
var transforms = require('./transforms')
var sinks = require('./sinks')

module.exports = {
  fromArray: sources.fromArray,
  fromReadableStream: sources.fromReadableStream,
  map: transforms.map,
  mapAsync: transforms.mapAsync,
  filter: transforms.filter,
  filterAsync: transforms.filterAsync,
  buffer: transforms.buffer,
  range: transforms.range,
  toArray: sinks.toArray,
  forEach: sinks.forEach,
  forEachAsync: sinks.forEachAsync,
  toWritableStream: sinks.toWritableStream
}
