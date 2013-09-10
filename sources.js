
sources = {}

sources.fromArray = function(array, cb) {
  var i = 0
  return {read: read}
  function read(cb) {
    if (i == array.length) return cb(null, undefined)
    var value = array[i]
    i++
    cb(null, value)
  }
}

sources.fromReadableStream = function(readable) {
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

module.exports = sources
