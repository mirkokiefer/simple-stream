
var EventEmitter = require('events').EventEmitter

var transforms = {}

transforms.map = function(inputStream, fn) {
  return {read: read}
  function read(cb) {
    inputStream.read(function(err, res) {
      if (res === undefined) return cb(err, undefined)
      cb(null, fn(res))
    })
  }
}

transforms.mapAsync = function(inputStream, fn) {
  return {read: read}
  function read(cb) {
    inputStream.read(function(err, res) {
      if (res === undefined) return cb(err, undefined)
      fn(res, cb)
    })
  }
}

transforms.filter = function(inputStream, fn) {
  return {read: read}
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
  return {read: read}
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

  var readBuffer = function(cb) {
    if (buffer.length) {
      cb(null, buffer.shift())
    } else {
      bufferEvents.once('data', function() {
        readBuffer(cb)
      })
    }
    if (!bufferingInProgress && !hasEnded && buffer.length < size) {
      fillBuffer()
    }
  }

  var fillBuffer = function(cb) {
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

  var publicObj = {
    bufferFillRatio: function() { return buffer.length / size },
    read: function(cb) {
      readBuffer(function(err, res) {
        cb(err, res)
      })
    }
  }
  return publicObj
}

transforms.range = function(inputStream, opts) {
  var from = opts.from
  var to = opts.to
  var pos = -1
  return {read: read}
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
