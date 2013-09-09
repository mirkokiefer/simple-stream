
var EventEmitter = require('events').EventEmitter

var stream = {}

stream.forEach = function(inputStream, fn) {
  return continuable
  function continuable(cb) {
    inputStream.read(function(err, res) {
      if (res === undefined) return cb(err, undefined)
      fn(res)
      continuable(cb)
    })
  }
}

stream.forEachAsync = function(inputStream, fn) {
  return continuable
  function continuable(cb) {
    inputStream.read(function(err, res) {
      if (res === undefined) return cb(err, undefined)
      fn(res, function(err) {
        if (err) return cb(err)
        continuable(cb)      
      })
    })
  }
}

stream.map = function(inputStream, fn) {
  return {read: read}
  function read(cb) {
    inputStream.read(function(err, res) {
      if (res === undefined) return cb(err, undefined)
      cb(null, fn(res))
    })
  }
}

stream.mapAsync = function(inputStream, fn) {
  return {read: read}
  function read(cb) {
    inputStream.read(function(err, res) {
      if (res === undefined) return cb(err, undefined)
      fn(res, cb)
    })
  }
}

stream.filter = function(inputStream, fn) {
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

stream.filterAsync = function(inputStream, fn) {
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

stream.buffer = function(inputStream, size) {
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

stream.fromArray = function(array, cb) {
  var i = 0
  return {read: read}
  function read(cb) {
    if (i == array.length) return cb(null, undefined)
    var value = array[i]
    i++
    cb(null, value)
  }
}

stream.fromReadableStream = function(readable) {
  var isReadable = true
  var hasEnded = false

  readable.on('readable', function() {
    isReadable = true
  })
  readable.on('end', function() {
    hasEnded = true
  })

  function read(cb) {
    if (hasEnded) {
      return cb(null, undefined)
    }
    if (isReadable) {
      var res = readable.read()
      if (res === null) {
        isReadable = false
        return read(cb)
      }
      cb(null, res)
    } else {
      var onEnd = function() { read(cb) }
      readable.once('readable', function() {
        readable.removeListener('end', onEnd)
        read(cb)
      })
      readable.once('end', onEnd)
    }
  }

  return {read: read}
}

stream.toArray = function(inputStream) {
  return function(cb) {
    var array = []
    stream.forEach(inputStream, function(each) {
      array.push(each)
    })(function(err) {
      if (err) return cb(err)
      cb(null, array)
    })
  }
}

stream.range = function(inputStream, opts) {
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

stream.toWritableStream = function(inputStream, writeStream, encoding) {
  return function(cb) {
    write(cb)
    function write(cb) {
      inputStream.read(function(err, res) {
        if (res === undefined) return writeStream.write('', encoding, cb)
        if (writeStream.write(res, encoding)) {
          write(cb)
        } else {
          writeStream.once('drain', function() { write(cb) })
        }
      })
    }
  }
}

module.exports = stream
