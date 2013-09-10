
var sinks = {}

sinks.forEach = function(inputStream, fn) {
  return function(cb) {
    var sameTick
    loopRead()

    function loopRead() {
      do {
        sameTick = undefined
        read()
        if (sameTick === undefined) sameTick = false
      } while (sameTick)
    }

    function read() {
      inputStream.read(function(err, res) {
        if (res === undefined) return cb(err, undefined)
        fn(res)
        if (sameTick === undefined) sameTick = true
        else loopRead()
      })
    }
  }
}

sinks.forEachAsync = function(inputStream, fn) {
  return continuable
  function continuable(cb) {
    inputStream.read(function(err, res) {
      if (res === undefined) return cb(err, undefined)
      fn(res, function(err) {
        if (err) return cb(err)
        setImmediate(continuable, cb)
      })
    })
  }
}

sinks.toArray = function(inputStream) {
  return function(cb) {
    var array = []
    sinks.forEach(inputStream, function(each) {
      array.push(each)
    })(function(err) {
      if (err) return cb(err)
      cb(null, array)
    })
  }
}

sinks.toWritableStream = function(inputStream, writeStream, encoding) {
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

module.exports = sinks
