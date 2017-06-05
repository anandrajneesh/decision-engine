/**
 * Created by anandrajneesh
 */
'use strict'
module.exports = function () {
  return {

    is: function (a, that) {
      return a === that
    },
    gte: function (a, that) {
      return a >= that
    },
    not: function (a, that) {
      return a !== that
    },
    lte: function (a, that) {
      return a <= that
    },
    gt: function (a, that) {
      return a > that
    },
    lt: function (a, that) {
      return a < that
    },
    divisible: function (a, that) {
      return a % that === 0
    },
    regex: function (a, that) {
      return new RegExp(that).test(a)
    }

  }
}
