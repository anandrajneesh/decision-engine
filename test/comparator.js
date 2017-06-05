/**
 * Created by anandrajneesh
 */
var comparator = require('../src/comparators')()
var assert = require('assert')

describe('comparator', function () {
  describe('#is', function () {
    it('should return true for same objects', function () {
      assert.ok(comparator.is(3, 3))
    })

    it('should return false for different objects', function () {
      assert.ok(!comparator.is(false, true))
    })

    it('should return false for one undefined and other values object', function () {
      assert.ok(!comparator.is(undefined, 'value'))
    })
  })

  describe('#regex', function () {
    it('should be defined', function () {
      assert.ok(typeof comparator.regex === 'function')
    })

    it('should match regexs for numbers given in string', function () {
      assert.ok(comparator.regex('2373248423783248732', '(\\d+)'))
    })

    it('should support regex matching', function () {
      const pattern = 'abc'
      const test = arg => comparator.regex(arg, pattern)
      assert.ok(test('abc'))
      assert.ok(test('abc123123'))
      assert.ok(test('1231abc'))
      assert.ok(test('asdjaab21c') === false)
    })

    it('should return false for undefined values', function () {
      assert.ok(comparator.regex(undefined, '(abc+)') === false)
    })

    // TODO : add behavior defining test cases for other data types than string
    it('should not work for datatypes other than strings', function () {
      const pattern = '(\\d+)'
      const test = arg => comparator.regex(arg, pattern)
      assert.ok(test(12423264))
      assert.ok(test(new Date()))
      assert.ok(test('somestring with no numbers') === false)
      assert.ok(test('4239823498423'))
    })
  })
})
