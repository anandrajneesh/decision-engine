/**
 * Created by anandrajneesh
 */
 'use strict'
 const ruleEngine = require('../src/index.js')()
 const assert = require('assert')

 describe('order system rule engine', function () {
   // fact : order from some user
   let fact

   describe('should work for simple rules like discount.json', function () {
     before(function () {
       ruleEngine.addRule(require('./orderSystem/discount.json'))
     })

     beforeEach(function () {
       delete require.cache[require.resolve('./orderSystem/order.json')]
       fact = require('./orderSystem/order.json')
     })

     after(function () {
       ruleEngine.deleteRule('10', 'discount')
     })

     it('should return 10% discount for order of length more than 2 and price gte 500', function (done) {
       fact.order.items.push({name: 'coffee mug', id: 'skuid1'})
       fact.order.items.push({name: 'nodejs book', id: 'skuid2'})
       fact.order.items.push({name: 'java book', id: 'skuid3'})
       fact.order.price = 600

       ruleEngine.run(fact, 'discount', function (err, result) {
         if (err) done(err)
         else {
           assert.ok(result.indexOf('10') > -1)
           done()
         }
       })
     })

     it('should return 10% discount for order of price gte 2000', function (done) {
       fact.order.price = 2000
       fact.order.items.push({name: 'coffee mug', id: 'skuid5'})
       ruleEngine.run(fact, 'discount', function (err, result) {
         if (err) done(err)
         else {
           assert.ok(result.indexOf('10') > -1)
           done()
         }
       })
     })

     it('should not return any discount values for order of price lower than 500', function (done) {
       fact.order.price = 400
       fact.order.items.push({name: 'coffee mug', id: 'skuid6'})
       ruleEngine.run(fact, 'discount', function (err, result) {
         if (err) done(err)
         else {
           assert.ok(result.length === 0)
           done()
         }
       })
     })
   })

   describe('should work for complex rules like expressShipping.json', function () {
     before(function () {
       ruleEngine.addRule(require('./orderSystem/expressShipping.json'))
     })

     beforeEach(function () {
       delete require.cache[require.resolve('./orderSystem/order.json')]
       fact = require('./orderSystem/order.json')
       fact.order.items.push({name: 'coffee mug', id: 'skuid1'})
       fact.order.items.push({name: 'nodejs book', id: 'skuid2'})
       fact.order.items.push({name: 'java book', id: 'skuid3'})
       fact.order.price = 5000
     })

     after(function () {
       ruleEngine.deleteRule('express', 'shipping')
     })

     it('should allow express shipping for prime users with express cities', function (done) {
       fact.user.subs.prime = true
       fact.user.address.express.available = true
       ruleEngine.run(fact, 'shipping', function (err, result) {
         if (err) done(err)
         else {
           assert.ok(result.indexOf('express') > -1)
           done()
         }
       })
     })

     it('should allow express shipping for users who opted for express and is not cash on delivery', function (done) {
       fact.user.subs.prime = false
       fact.user.address.express.available = false
       fact.order.cashOnDelivery = false
       fact.order.express = true
       ruleEngine.run(fact, 'shipping', function (err, result) {
         if (err) done(err)
         else {
           assert.ok(result.indexOf('express') > -1)
           done()
         }
       })
     })

     it('should not allow shipping for non prime and non express orders', function (done) {
       fact.user.subs.prime = false
       fact.user.address.express.available = false
       fact.order.cashOnDelivery = false
       fact.order.express = false
       ruleEngine.run(fact, 'shipping', function (err, result) {
         if (err) done(err)
         else {
           assert.ok(result.length === 0)
           done()
         }
       })
     })
   })
 })
