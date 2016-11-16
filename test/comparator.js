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
  })
})
