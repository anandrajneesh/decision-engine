/**
 * Created by anandrajneesh
 */
'use strict'
module.exports = function RuleEngine () {
  var async = require('async')
  var conditions = require('./conditions')()

  var _rules = {}

  RuleEngine.addRule = function (rule) {
    _rules[rule.group] = _rules[rule.group] || []
    conditions.parse(rule.conditions, function (err, result) {
      if (result) {
        rule.parsedCondition = result
        _rules[rule.group].push(rule)
      } else {
        console.log(err + ' Rule not added: ' + rule.name + ' ' + rule.group)
      }
    })
  }

  RuleEngine.deleteRule = function (rule) {
    if (_rules[rule.group]) {
      _rules[rule.group] = _rules[rule.group].filter(function (arg) {
        return rule.group !== arg.group && rule.name !== arg.name
      })
    }
  }

  RuleEngine.deleteRule = function (name, group) {
    if (_rules[group]) {
      _rules[group] = _rules[group].filter(function (arg) {
        return group !== arg.group && name !== arg.name
      })
    }
  }

  RuleEngine.importRules = function (rules) {
    rules.forEach(function (rule) {
      RuleEngine.addRule(rule)
    })
  }

  RuleEngine.run = function (fact, group, cb) {
    async.concat(
            _rules[group],
            function (rule, cb) {
              rule.parsedCondition.evaluate(fact, function (err, result) {
                if (err) console.log(err)
                if (result) cb(undefined, rule.name)
                else cb()
              })
            },
            cb)
  }

  return RuleEngine
}
