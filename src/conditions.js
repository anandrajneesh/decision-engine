/**
 * Created by anandrajneesh
 */
 'use strict'
 module.exports = function () {
   const async = require('async')
   const comparators = require('./comparators')()

   function evaluateExpr (obj, operation) {
     var keys = operation.key.split('.')
     var a = keys.length > 1 ? keys.reduce(function (prev, curr) {
       return typeof prev !== 'undefined' ? prev[curr] : undefined
     }, obj) : obj[keys[0]]
     return comparators[operation.comparator](a, operation.value)
   }

   function CondArray (condition) {
     this.operations = []
     this.type = 'nop'
     this.initialBool = false
     var self = this
     // TODO change to lambda
     condition.forEach(function (elem) {
       self.operations.push(elem)
     })
   }

   CondArray.prototype.or = function (expr1, expr2) {
     if (typeof expr2 === 'function') {
       return expr1 || expr2()
     } else {
       return expr1 || expr2
     }
   }

   CondArray.prototype.and = function (expr1, expr2) {
     if (typeof expr2 === 'function') {
       return expr1 && expr2()
     } else {
       return expr1 && expr2
     }
   }

   CondArray.prototype.evaluate = function (fact, cb) {
     var self = this
     if (self.type === 'nop') {
       cb(undefined, false)
     }
     async.reduce(self.operations, self.initialBool, function (prevBool, currentCondition, cb) {
       // TODO check if we can bind values to evaluateExpr and remove extra function on top
       cb(undefined, self[self.type](prevBool, function () {
         return evaluateExpr(fact, currentCondition)
       }))
     }, cb)
   }

   function OrArray (condition) {
     CondArray.call(this, condition)
     this.initialBool = false
     this.type = 'or'
   }

   OrArray.prototype = Object.create(CondArray.prototype)
   OrArray.prototype.constructor = OrArray

   function AndArray (condition) {
     CondArray.call(this, condition)
     this.initialBool = true
     this.type = 'and'
   }

   AndArray.prototype = Object.create(CondArray.prototype)
   AndArray.prototype.constructor = AndArray

   function CondObject (compositeCondition) {
     this.type = 'nop'
     this.initialBool = false
     this.conditions = []
     var self = this
     for (var name in compositeCondition) {
       if (compositeCondition.hasOwnProperty(name)) {
         var c = compositeCondition[name]
         if (Array.isArray(c.and)) {
           self.conditions.push(new AndArray(c.and))
         } else if (typeof c.and === 'object') {
           self.conditions.push(new AndObject(c.and))
         } else if (Array.isArray(c.or)) {
           self.conditions.push(new OrArray(c.or))
         } else if (typeof c.or === 'object') {
           self.conditions.push(new OrObject(c.or))
         }
       }
     }
   }

   CondObject.prototype.evaluate = function (fact, cb) {
     var self = this
     if (self.type === 'nop') {
       cb(undefined, false)
     }
     // FIXME simplify this block
     async.reduce(self.conditions, self.initialBool, function (prevBool, currentCondition, cb) {
       self[self.type](prevBool, (function () {
         return function (cb) {
           currentCondition.evaluate(fact, cb)
         }
       }()), cb)
     }, cb)
   }

   CondObject.prototype.and = function (expr1, expr2, cb) {
     if (typeof expr2 === 'function') {
       if (expr1) {
         expr2(cb)
       } else {
         cb(undefined, expr1)
       }
     } else {
       return expr1 && expr2
     }
   }

   CondObject.prototype.or = function (expr1, expr2, cb) {
     if (typeof expr2 === 'function') {
       if (!expr1) {
         expr2(cb)
       } else {
         cb(undefined, expr1)
       }
     } else {
       return expr1 || expr2
     }
   }

   function AndObject (condition) {
     CondObject.call(this, condition)
     this.type = 'and'
     this.initialBool = true
   }
   AndObject.prototype = Object.create(CondObject.prototype)
   AndObject.prototype.constructor = AndObject

   function OrObject (condition) {
     CondObject.call(this, condition)
     this.type = 'or'
     this.initialBool = false
   }

   OrObject.prototype = Object.create(CondObject.prototype)
   OrObject.prototype.constructor = OrObject

   return {

     parse: function (condition, cb) {
       let parsedCondition
       if (Array.isArray(condition.and)) {
         parsedCondition = new AndArray(condition.and)
       } else if (typeof condition.and === 'object') {
         parsedCondition = new AndObject(condition.and)
       } else if (Array.isArray(condition.or)) {
         parsedCondition = new OrArray(condition.or)
       } else if (typeof condition.or === 'object') {
         parsedCondition = new OrObject(condition.or)
       } else {
         cb({code: 'INVALID_CONDITION'})
       }
       cb(undefined, parsedCondition)
     }
   }
 }
