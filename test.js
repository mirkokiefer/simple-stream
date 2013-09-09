
var assert = require('assert')
var sstream = require('./index')
var fs = require('fs')
var Readable = require('stream').Readable

var numbers = []
for (var i = 1; i < 100; i++) {
  numbers.push(i)
}
var doubleFn = function(each) { return each * 2 }
var numbersDoubled = numbers.map(doubleFn)
var evenFn = function(each) { return (each % 2) == 0 }
var evenNumbers = numbers.filter(evenFn)

var createMockAsyncIterator = function() {
  var index = -1
  var next = function(cb) {
    setTimeout(function() {
      index++
      if (!numbers[index]) return cb(null, undefined)
      cb(null, numbers[index])
    }, 1)
  }
  return {next: next}
}

var runForEachIteratorTest = function(iterator, cb) {
  var index = 0
  sstream.forEach(iterator, function(err, each) {
    assert.equal(each, numbers[index])
    index++
  }, function() {
    assert.equal(index, numbers.length)
    cb()
  })
}

describe('async-iterators', function() {
  it('should run forEach on an iterator', function(done) {
    var iterator = createMockAsyncIterator()
    runForEachIteratorTest(iterator, done)
  })
  it('should run forEachAsync on an iterator', function(done) {
    var iterator = createMockAsyncIterator()
    var index = 0
    sstream.forEachAsync(iterator, function(err, each, cb) {
      assert.equal(each, numbers[index])
      index++
      cb()
    }, function() {
      assert.equal(index, numbers.length)
      done()
    })
  })
  it('should pipe an iterator to an array', function(done) {
    var iterator = createMockAsyncIterator()
    sstream.toArray(iterator, function(err, res) {
      assert.deepEqual(res, numbers)
      done()
    })
  })
  it('should create a map iterator and pipe to array', function(done) {
    var iterator = createMockAsyncIterator()
    var doublingIterator = sstream.map(iterator, function(err, each) {
      return doubleFn(each)
    })
    sstream.toArray(doublingIterator, function(err, res) {
      assert.deepEqual(res, numbersDoubled)
      done()
    })
  })
  it('should create an asyncMap iterator', function(done) {
    var iterator = createMockAsyncIterator()
    var doublingIterator = sstream.mapAsync(iterator, function(err, each, cb) {
      cb(null, doubleFn(each))
    })
    sstream.toArray(doublingIterator, function(err, res) {
      assert.deepEqual(res, numbersDoubled)
      done()
    })
  })
  it('should create a filter iterator', function(done) {
    var iterator = createMockAsyncIterator()
    var filterIterator = sstream.filter(iterator, function(err, each) {
      return evenFn(each)
    })
    sstream.toArray(filterIterator, function(err, res) {
      assert.deepEqual(res, evenNumbers)
      done()
    })
  })
  it('should create an async filter iterator', function(done) {
    var iterator = createMockAsyncIterator()
    var filterIterator = sstream.filterAsync(iterator, function(err, each, cb) {
      cb(null, evenFn(each))
    })
    sstream.toArray(filterIterator, function(err, res) {
      assert.deepEqual(res, evenNumbers)
      done()
    })
  })
  it('should create a buffering iterator', function(done) {
    var iterator = createMockAsyncIterator()
    var bufferIterator = sstream.buffer(iterator, 10)
    var bufferFillRatio = 0
    var slowMapIterator = sstream.mapAsync(bufferIterator, function(err, res, cb) {
      setTimeout(function() {
        bufferFillRatio += bufferIterator.bufferFillRatio() / numbers.length
        cb(null, res)
      }, 2)
    })
    sstream.toArray(slowMapIterator, function(err, res) {
      assert.deepEqual(res, numbers)
      console.log(bufferFillRatio)
      assert.ok(bufferFillRatio > 0.5)
      done()
    })
  })
  it('should create an array iterator', function(done) {
    var arrayIterator = sstream.fromArray(numbers)
    sstream.toArray(arrayIterator, function(err, res) {
      assert.deepEqual(res, numbers)
      done()
    })
  })
  it('should create a readable stream iterator', function(done) {
    function MockStream(opt) {
      Readable.call(this, opt)
      this.index = 0
    }
    require('util').inherits(MockStream, Readable)

    MockStream.prototype._read = function() {
      mockStream.push(numbers[this.index])
      this.index++
      if (this.index == numbers.length) mockStream.push(null)
    }
    
    var mockStream = new MockStream(({objectMode: true, highWaterMark: 2}))
    
    var streamIterator = sstream.fromReadableStream(mockStream)
    sstream.toArray(streamIterator, function(err, res) {
      assert.deepEqual(res, numbers)
      done()
    })
  })
  it('should create a range iterator', function(done) {
    var iterator = createMockAsyncIterator()
    var rangeIterator = sstream.range(iterator, {from: 10, to: 19})
    sstream.toArray(rangeIterator, function(err, res) {
      assert.deepEqual(res, numbers.slice(10, 20))
      done()
    })
  })
  it('should create a range iterator with no end', function(done) {
    var iterator = createMockAsyncIterator()
    var rangeIterator = sstream.range(iterator, {from: 90})
    sstream.toArray(rangeIterator, function(err, res) {
      assert.deepEqual(res, numbers.slice(90))
      done()
    })
  })
  it('should create a range iterator with no start', function(done) {
    var iterator = createMockAsyncIterator()
    var rangeIterator = sstream.range(iterator, {to: 19})
    sstream.toArray(rangeIterator, function(err, res) {
      assert.deepEqual(res, numbers.slice(0, 20))
      done()
    })
  })
  it('should write an iterator to a writable stream', function(done) {
    var path = __dirname + '/output.txt'
    var writeStream = fs.createWriteStream(path)
    var iterator = createMockAsyncIterator()
    var stringIterator = sstream.map(iterator, function(err, res) {
      return res.toString()
    })
    sstream.toWritableStream(stringIterator, writeStream, 'utf8', function() {
      var output = fs.readFileSync(path, {encoding: 'utf8'})
      fs.unlinkSync(path)
      assert.deepEqual(output, numbers.join(''))
      done()
    })
  })
})
