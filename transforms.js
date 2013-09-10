
var EventEmitter = require('events').EventEmitter

var transforms = {}

transforms.map = function(inputStream, fn) {
  return {read: read, abort: inputStream.abort}
  function read(cb) {
    inputStream.read(function(err, res) {
      if (res === undefined) return cb(err, undefined)
      cb(null, fn(res))
    })
  }
}

transforms.mapAsync = function(inputStream, fn) {
  return {read: read, abort: inputStream.abort}
  function read(cb) {
    inputStream.read(function(err, res) {
      if (res === undefined) return cb(err, undefined)
      fn(res, cb)
    })
  }
}

transforms.filter = function(inputStream, fn) {
  return {read: read, abort: inputStream.abort}
  function read(cb) {
    inputStream.read(function(err, res) {
      if (res === undefined) return cb(err, undefined)
      if (fn(res)) {
        cb(null, res)
      } else {
        read(cb)
      }
    })
  }
}

transforms.filterAsync = function(inputStream, fn) {
  return {read: read, abort: inputStream.abort}
  function read(cb) {
    inputStream.read(function(err, res) {
      if (res === undefined) return cb(err, undefined)
      fn(res, function(err, passedFilter) {
        if (err) return cb(err)
        if (passedFilter) {
          cb(null, res)
        } else {
          read(cb)
        }
      })
    })
  }
}

transforms.buffer = function(inputStream, size) {
  var buffer = []
  var bufferingInProgress = false
  var hasEnded = false
  var bufferEvents = new EventEmitter()

  return {read: read, bufferFillRatio: bufferFillRatio, abort: inputStream.abort}

  function bufferFillRatio() {
    return buffer.length / size
  }
  function read(cb) {
    if (buffer.length) {
      cb(null, buffer.shift())
    } else {
      bufferEvents.once('data', function() {
        read(cb)
      })
    }
    if (!bufferingInProgress && !hasEnded && buffer.length < size) {
      fillBuffer()
    }
  }
  function fillBuffer(cb) {
    bufferingInProgress = true
    if ((buffer.length >= size) || hasEnded) {
      bufferingInProgress = false
      return
    }
    inputStream.read(function(err, res) {
      if (res === undefined) hasEnded = true
      buffer.push(res)
      bufferEvents.emit('data')
      fillBuffer(cb)
    })
  }
}

transforms.range = function(inputStream, opts) {
  var from = opts.from
  var to = opts.to
  var pos = -1
  return {read: read, abort: inputStream.abort}
  function read(cb) {
    inputStream.read(function(err, value) {
      if (value === undefined || pos >= to) return cb(err, undefined)
      pos++
      if (pos < from) return read(cb)
      cb(null, value)
    })
  }
}

module.exports = transforms
