/**
 * Created by anandrajneesh
 */
 'use strict'
module.exports = function(){


    var async = require('async'),
        comparators = require('./comparators')();

    function evaluateExpr(obj, operation) {
        var keys = operation.key.split(".");
        var a = keys.length > 1 ? keys.reduce(function (prev, curr) {
            return prev[curr];
        }, obj) : obj[keys[0]];
        return comparators[operation.comparator](a, operation.value);
    }

    function CondArray(condition) {
        this.operations = [];
        this.type = "nop";
        this.memo = false;
        var self = this;
        condition.forEach(function (elem) {
            self.operations.push(elem);
        })
    }

    CondArray.prototype.or = function (expr1, expr2) {
        if (typeof expr2 === 'function') {
            return expr1 || expr2();
        } else {
            return expr1 || expr2;
        }

    };

    CondArray.prototype.and = function (expr1, expr2) {
        if (typeof expr2 === 'function') {
            return expr1 && expr2();
        } else {
            return expr1 && expr2;
        }

    };


    CondArray.prototype.evaluate = function (obj, cb) {
        var self = this;
        if (self.type === "nop") {
            cb(undefined, false);
        }
        async.reduce(self.operations, self.memo, function (memo, item, cb) {
            cb(undefined, self[self.type](memo, function () {
                return function () {
                    return evaluateExpr(obj, item)
                }
            }()));
        }, cb);
    };

    function OrArray(condition) {
        CondArray.call(this, condition);
        this.memo = false;
        this.type = "or";
    }

    OrArray.prototype = Object.create(CondArray.prototype);
    OrArray.prototype.constructor = OrArray;


    function AndArray(condition) {
        CondArray.call(this, condition);
        this.memo = true;
        this.type = "and";
    }

    AndArray.prototype = Object.create(CondArray.prototype);
    AndArray.prototype.constructor = AndArray;


    function CondObject(compositeCondition) {
        this.type = "nop";
        this.memo = false;
        this.conditions = [];
        var self = this;
        for (var name in compositeCondition) {
            if (compositeCondition.hasOwnProperty(name)) {
                var c = compositeCondition[name];
                if (Array.isArray(c.and)) {
                    self.conditions.push(new AndArray(c.and));
                } else if (typeof c.and === 'object') {
                    self.conditions.push(new AndObject(c.and));
                } else if (Array.isArray(c.or)) {
                    self.conditions.push(new OrArray(c.or));
                } else if (typeof c.or === 'object') {
                    self.conditions.push(new OrObject(c.or))
                }
            }
        }

    }

    CondObject.prototype.evaluate = function (obj, cb) {
        var self = this;
        if (self.type === "nop") {
            cb(undefined, false);
        }

        async.reduce(self.conditions, self.memo, function (memo, item, cb) {
            self[self.type](memo, function () {
                return function (cb) {
                    item.evaluate(obj, cb);
                }
            }(), cb);
        }, cb);
    };

    CondObject.prototype.and = function (expr1, expr2, cb) {
        if (typeof expr2 === 'function') {
            if (expr1) {
                expr2(cb)
            } else {
                cb(undefined, expr1);
            }

        } else {
            return expr1 && expr2;
        }
    };

    CondObject.prototype.or = function (expr1, expr2, cb) {
        if (typeof expr2 === 'function') {
            if (!expr1) {
                expr2(cb)
            } else {
                cb(undefined, expr1);
            }

        } else {
            return expr1 && expr2;
        }
    };

    function AndObject(condition) {
        CondObject.call(this, condition);
        this.type = "and";
        this.memo = true;

    }
    AndObject.prototype = Object.create(CondObject.prototype);
    AndObject.prototype.constructor = AndObject;

    function OrObject(condition) {
        CondObject.call(this, condition);
        this.type = "or";
        this.memo = false;
    }

    OrObject.prototype = Object.create(CondObject.prototype);
    OrObject.prototype.constructor = OrObject;


    return {

        parse: function (condition, cb) {
            var parsedCondition;
            if (Array.isArray(condition.and)) {
                parsedCondition = new AndArray(condition.and);
            } else if (typeof condition.and === 'object') {
                parsedCondition = new AndObject(condition.and);
            } else if (Array.isArray(condition.or)) {
                parsedCondition = new OrArray(condition.or);
            } else if (typeof condition.or === 'object') {
                parsedCondition = new OrObject(condition.or);
            } else {
                cb({code: 'INVALID_CONDITION'})
            }
            cb(undefined, parsedCondition);
        }
    }
};
