# decision-engine
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)  [![Build Status](https://travis-ci.org/anandrajneesh/decision-engine.svg?branch=master)](https://travis-ci.org/anandrajneesh/decision-engine)  [![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/anandrajneesh/decision-engine/blob/master/LICENSE)

### Install
<code>npm install decision-engine --save</code>

### Description

A decision engine which based on fact and rules provided can deduce what decisions should be made. For example in an Ecommerce system, when users place orders there are multiple decisions to be made, whether the order qualifies for discount, what kind of shipping is applicable and so on. This calls for a business rule engine which decision-engine exactly is.

## Rule
A rule is basically a <code>JSON</code> with 4 properties
* <code>name</code> - name of decision, which is returned by the engine.
* <code>group</code> - group identifier to which the rule belongs, a group can have multiple rules.
* <code>comment</code> - description about rule just for readable purposes
* <code>conditions</code> - actual rules are represented here

#### Where to keep rules ?
Rules can be stored externally in a .json file or in a document db like MongoDB. Storage can be in any format until engine is provided a json format.

#### Conditions
Conditions is a json object which can have either of <code>and</code> or <code>or</code> key, these corresponds to boolean <code>&&</code> and <code>||</code> respectively. This <code>and/or</code> key then could be a json array or json object depending upon the rule complexity.
The <code>unit</code> of the condition is a json object which has three properties :
- <code>key</code> - key in the fact which is to be considered
- <code>value</code> - value to be compared with can be anything string, int, boolean.
- <code>comparator</code> - this is the comparing function to be used.

This unit looks like this :
```json
{
  "key": "order.items.length",
  "value": 2,
  "comparator": "gte"
}
```
Now a condition can have multiple units paired under <code>and</code> or <code>or</code> key as elements of json array. This is shown below:
```json
"and": [
  {
    "key": "order.items.length",
    "value": 5,
    "comparator": "lte"
  },
  {
    "key": "order.price",
    "value": 5000,
    "comparator": "gte"
  }
]
```
Let's call this as a <code>composite unit</code>. The boolean evaluation of individual unit will be reduced to single boolean value by applying either `and` or `or` function as defined by the parent key which is `and` in above shown example. Now this composite unit can be directly referenced under <code>conditions</code> attribute or can be nested under <code>and/or</code> keys as json objects. Lets see an example.

Composite unit directly referenced by <code>conditions</code>
```json
"conditions": {
		"and": [{
			"key": "order.items.length",
			"value": 5,
			"comparator": "lte"
		}, {
			"key": "order.price",
			"value": 5000,
			"comparator": "gte"
		}]
}
```

Composite unit as an nested json object
```json
"conditions": {
  "and": {
    "5ItemsPrice5000": {
      "and": [
        {
          "key": "order.items.length",
          "value": 5,
          "comparator": "lte"
        },
        {
          "key": "order.price",
          "value": 5000,
          "comparator": "gte"
        }
      ]
    }
  }
}
```
Note that `5ItemsPrice5000` is a custom name and does not affect the rule syntax. It could be any string. Perhaps it would be more clear if you will see how two composite units can be combined.
```json
"conditions": {
  "or": {
    "5ItemsPrice5000": {
      "and": [
        {
          "key": "order.items.length",
          "value": 5,
          "comparator": "gte"
        },
        {
          "key": "order.price",
          "value": 5000,
          "comparator": "gte"
        }
      ]
    },
    "priceGreaterThan20000": {
      "and": [
        {
          "key": "order.price",
          "value": 20000,
          "comparator": "gte"
        },
        {
          "key": "order.items.length",
          "value": 1,
          "comparator": "is"
        }
      ]
    }
  }
}
```
In the above example there are two composite units `5ItemsPrice5000` and `priceGreaterThan20000` combined by an `or`. This means either `5ItemsPrice5000` or `priceGreaterThan20000` has to evaluate to true for decision to be applicable. This nesting of composite conditions with `and` and `or` can be  done to a very deep level for supporting complex rules. Now its time to reveal how a `rule` looks like.
```json
{
  "name": "10",
  "group": "discount",
  "comment": "10% discount applicable to order of more than 10 items with minimum total price of 500 or total order amount of 2000",
  "conditions": {
    "or": {
      "5ItemsPrice5000": {
        "and": [
          {
            "key": "order.items.length",
            "value": 5,
            "comparator": "gte"
          },
          {
            "key": "order.price",
            "value": 5000,
            "comparator": "gte"
          }
        ]
      },
      "priceGreaterThan20000": {
        "and": [
          {
            "key": "order.price",
            "value": 20000,
            "comparator": "gte"
          },
          {
            "key": "order.items.length",
            "value": 1,
            "comparator": "is"
          }
        ]
      }
    }
  }
}
```

#### Comparators available

##### is (a, that)
      returns true if a === that

##### gte (a, that)
      returns true if a >= that

##### gt (a, that)
      returns true if a > that

##### lte (a, that)
       returns true if a <= that

##### lt (a, that)
      returns true if a < that

##### not (a, that)
      returns true if a!===that

##### divisible (a, that)
      returns true if a % that === 0

##### regex (a, that)
      returns true if new RegExp(that).test(a) === true

## API Usage
```js
const decisionEngine = require('decision-engine')
```

#### Methods
#####  addRule (rule)
rule is the json object having single rule. This will register the rule with decision engine.

```js
decisionEngine.addRule(require('./orderSystem/discount.json'))
```

#####  importRules (rules)
rules is the json array having multiple rule. This will register the rule with decision engine.

```js
decisionEngine.importRules(require('./orderSystemRules.json'))
```

#####  deleteRule (name, group)
This will delete the rule identified by name and belonging to group from decision engine.

```js
decisionEngine.deleteRule('10', 'discount')
```
#####  run (fact, group, callback)
Runs the rules from a group on the `fact` and generates an array of applicable decisions' names. callback is of standard format i.e. two parameters first being `err` and second being `result`. `result` will be the array of applicable decisions' names.
```js
let fact = {
  "user": {
    "name" :"sikorski",
    "address" : {
      "state":{
        "name":"Earth"
      },
      "express":{
        "duration":1,
        "available":true
      }
    },
    "subs":{
      "prime":true
    }
  },
  "order": {
    "items": [],
    "price": 0,
    "express": false,
    "cashOnDelivery": true
  }
}

fact.order.items.push({name: 'coffee mug', id: 'skuid1'})
fact.order.items.push({name: 'nodejs book', id: 'skuid2'})
fact.order.items.push({name: 'java book', id: 'skuid3'})
fact.order.price = 600

decisionEngine.addRule(require('./orderSystem/discount.json'))

decisionEngine.run(fact, 'discount', function (err, result) {
  if (err) done(err)
  else {
    //result wil be ['10']
    done(null, result)
  }
})
```

### Examples & Issues

Please refer [test](https://github.com/anandrajneesh/decision-engine/blob/master/test) for example usage and feel free to log issues if any.
