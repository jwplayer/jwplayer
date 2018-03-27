//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

import { now } from 'utils/date';

/* eslint-disable no-unused-expressions,new-cap */
/* eslint no-eq-null: 0 */
/* eslint eqeqeq: 0 */
/* eslint no-void: 0 */
/* eslint guard-for-in: 0 */
/* eslint no-constant-condition: 0 */

/*
 * Source: https://github.com/jashkenas/underscore/blob/1f4bf62/underscore.js
 */

// Establish the object that gets returned to break out of a loop iteration.
var breaker = {};

// Save bytes in the minified (but not gzipped) version:
var ArrayProto = Array.prototype;
var ObjProto = Object.prototype;
var FuncProto = Function.prototype;

// Create quick reference variables for speed access to core prototypes.
var slice = ArrayProto.slice;
var concat = ArrayProto.concat;
var toString = ObjProto.toString;
var hasOwnProperty = ObjProto.hasOwnProperty;

// All **ECMAScript 5** native function implementations that we hope to use
// are declared here.
var nativeMap = ArrayProto.map;
var nativeReduce = ArrayProto.reduce;
var nativeForEach = ArrayProto.forEach;
var nativeFilter = ArrayProto.filter;
var nativeEvery = ArrayProto.every;
var nativeSome = ArrayProto.some;
var nativeIndexOf = ArrayProto.indexOf;
var nativeIsArray = Array.isArray;
var nativeKeys = Object.keys;
var nativeBind = FuncProto.bind;


// Create a safe reference to the Underscore object for use below.
var _ = function (obj) {
    if (obj instanceof _) {
        return obj;
    }
    if (!(this instanceof _)) {
        return new _(obj);
    }
};

// Collection Functions
// --------------------

// The cornerstone, an `each` implementation, aka `forEach`.
// Handles objects with the built-in `forEach`, arrays, and raw objects.
// Delegates to **ECMAScript 5**'s native `forEach` if available.
var each = _.each = _.forEach = function (obj, iterator, context) {
    var i;
    var length;
    if (obj == null) {
        return obj;
    }
    if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
        for (i = 0, length = obj.length; i < length; i++) {
            if (iterator.call(context, obj[i], i, obj) === breaker) {
                return;
            }
        }
    } else {
        var keys = _.keys(obj);
        for (i = 0, length = keys.length; i < length; i++) {
            if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) {
                return;
            }
        }
    }
    return obj;
};

// Return the results of applying the iterator to each element.
// Delegates to **ECMAScript 5**'s native `map` if available.
_.map = _.collect = function (obj, iterator, context) {
    var results = [];
    if (obj == null) {
        return results;
    }
    if (nativeMap && obj.map === nativeMap) {
        return obj.map(iterator, context);
    }
    each(obj, function (value, index, list) {
        results.push(iterator.call(context, value, index, list));
    });
    return results;
};

var reduceError = 'Reduce of empty array with no initial value';

// **Reduce** builds up a single result from a list of values, aka `inject`,
// or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
_.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) {
        obj = [];
    }
    if (nativeReduce && obj.reduce === nativeReduce) {
        if (context) {
            iterator = _.bind(iterator, context);
        }
        return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
        if (!initial) {
            memo = value;
            initial = true;
        } else {
            memo = iterator.call(context, memo, value, index, list);
        }
    });
    if (!initial) {
        throw new TypeError(reduceError);
    }
    return memo;
};

// Return the first value which passes a truth test. Aliased as `detect`.
_.find = _.detect = function (obj, predicate, context) {
    var result;
    any(obj, function (value, index, list) {
        if (predicate.call(context, value, index, list)) {
            result = value;
            return true;
        }
    });
    return result;
};


// Return all the elements that pass a truth test.
// Delegates to **ECMAScript 5**'s native `filter` if available.
// Aliased as `select`.
_.filter = _.select = function (obj, predicate, context) {
    var results = [];
    if (obj == null) {
        return results;
    }
    if (nativeFilter && obj.filter === nativeFilter) {
        return obj.filter(predicate, context);
    }
    each(obj, function (value, index, list) {
        if (predicate.call(context, value, index, list)) {
            results.push(value);
        }
    });
    return results;
};

// Return all the elements for which a truth test fails.
_.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
        return !predicate.call(context, value, index, list);
    }, context);
};

// Trim out all falsy values from an array.
_.compact = function(array) {
    return _.filter(array, _.identity);
};


// Determine whether all of the elements match a truth test.
// Delegates to **ECMAScript 5**'s native `every` if available.
// Aliased as `all`.
_.every = _.all = function (obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) {
        return result;
    }
    if (nativeEvery && obj.every === nativeEvery) {
        return obj.every(predicate, context);
    }
    each(obj, function (value, index, list) {
        if (!(result = result && predicate.call(context, value, index, list))) {
            return breaker;
        }
    });
    return !!result;
};

// Determine if at least one element in the object matches a truth test.
// Delegates to **ECMAScript 5**'s native `some` if available.
// Aliased as `any`.
var any = _.some = _.any = function (obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) {
        return result;
    }
    if (nativeSome && obj.some === nativeSome) {
        return obj.some(predicate, context);
    }
    each(obj, function (value, index, list) {
        if (result || (result = predicate.call(context, value, index, list))) {
            return breaker;
        }
    });
    return !!result;
};

// returns the size of an object
_.size = function (obj) {
    if (obj == null) {
        return 0;
    }
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
};


// Array Functions
// ---------------


// Get the last element of an array. Passing **n** will return the last N
// values in the array. The **guard** check allows it to work with `_.map`.
_.last = function(array, n, guard) {
    if (array == null) {
        return void 0;
    }
    if ((n == null) || guard) {
        return array[array.length - 1];
    }
    return slice.call(array, Math.max(array.length - n, 0));
};


// Returns a function that will only be executed after being called N times.
_.after = function (times, func) {
    return function () {
        if (--times < 1) {
            return func.apply(this, arguments);
        }
    };
};

// Returns a function that will only be executed up to (but not including) the Nth call.
_.before = function(times, func) {
    var memo;
    return function() {
        if (--times > 0) {
            memo = func.apply(this, arguments);
        }
        if (times <= 1) {
            func = null;
        }
        return memo;
    };
};

// An internal function to generate lookup iterators.
var lookupIterator = function (value) {
    if (value == null) {
        return _.identity;
    }
    if (_.isFunction(value)) {
        return value;
    }
    return _.property(value);
};


// An internal function used for aggregate "group by" operations.
var group = function(behavior) {
    return function(obj, iterator, context) {
        var result = {};
        iterator = lookupIterator(iterator);
        each(obj, function(value, index) {
            var key = iterator.call(context, value, index, obj);
            behavior(result, key, value);
        });
        return result;
    };
};

// Groups the object's values by a criterion. Pass either a string attribute
// to group by, or a function that returns the criterion.
_.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
});


// Indexes the object's values by a criterion, similar to `groupBy`, but for
// when you know that your index values will be unique.
_.indexBy = group(function(result, key, value) {
    result[key] = value;
});


// Use a comparator function to figure out the smallest index at which
// an object should be inserted so as to maintain order. Uses binary search.
_.sortedIndex = function (array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0;
    var high = array.length;
    while (low < high) {
        var mid = (low + high) >>> 1;
        iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
};

_.contains = _.include = function (obj, target) {
    if (obj == null) {
        return false;
    }
    if (obj.length !== +obj.length) {
        obj = _.values(obj);
    }
    return _.indexOf(obj, target) >= 0;
};

// Convenience version of a common use case of `map`: fetching a property.
_.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
};

// Convenience version of a common use case of `filter`: selecting only objects
// containing specific `key:value` pairs.
_.where = function (obj, attrs) {
    return _.filter(obj, _.matches(attrs));
};

// Convenience version of a common use case of `find`: getting the first object
// containing specific `key:value` pairs.
_.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
};

// Return the maximum element or (element-based computation).
// Can't optimize arrays of integers longer than 65,535 elements.
// See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
_.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
        return Math.max.apply(Math, obj);
    }
    var result = -Infinity;
    var lastComputed = -Infinity;
    each(obj, function(value, index, list) {
        var computed = iterator ? iterator.call(context, value, index, list) : value;
        if (computed > lastComputed) {
            result = value;
            lastComputed = computed;
        }
    });
    return result;
};

// Take the difference between one array and a number of other arrays.
// Only the elements present in just the first array will remain.
_.difference = function (array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function (value) {
        return !_.contains(rest, value);
    });
};

// Return a version of the array that does not contain the specified value(s).
_.without = function (array) {
    return _.difference(array, slice.call(arguments, 1));
};

// If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
// we need this function. Return the position of the first occurrence of an
// item in an array, or -1 if the item is not included in the array.
// Delegates to **ECMAScript 5**'s native `indexOf` if available.
// If the array is large and already in sort order, pass `true`
// for **isSorted** to use binary search.
_.indexOf = function (array, item, isSorted) {
    if (array == null) {
        return -1;
    }
    var i = 0;
    var length = array.length;
    if (isSorted) {
        if (typeof isSorted == 'number') {
            i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
        } else {
            i = _.sortedIndex(array, item);
            return array[i] === item ? i : -1;
        }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) {
        return array.indexOf(item, isSorted);
    }
    for (; i < length; i++) {
        if (array[i] === item) {
            return i;
        }
    }
    return -1;
};


// Function (ahem) Functions
// ------------------


// Reusable constructor function for prototype setting.
var ctor = function() {};

// Create a function bound to a given object (assigning `this`, and arguments,
// optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
// available.
_.bind = function(func, context) {
    var args;
    var bound;
    if (nativeBind && func.bind === nativeBind) {
        return nativeBind.apply(func, slice.call(arguments, 1));
    }
    if (!_.isFunction(func)) {
        throw new TypeError();
    }
    args = slice.call(arguments, 2);
    bound = function() {
        if (!(this instanceof bound)) {
            return func.apply(context, args.concat(slice.call(arguments)));
        }
        ctor.prototype = func.prototype;
        var self = new ctor();
        ctor.prototype = null;
        var result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) {
            return result;
        }
        return self;
    };
    return bound;
};

// Partially apply a function by creating a version that has had some of its
// arguments pre-filled, without changing its dynamic `this` context. _ acts
// as a placeholder, allowing any combination of arguments to be pre-filled.
_.partial = function (func) {
    var boundArgs = slice.call(arguments, 1);
    return function () {
        var position = 0;
        var args = boundArgs.slice();
        for (var i = 0, length = args.length; i < length; i++) {
            if (args[i] === _) {
                args[i] = arguments[position++];
            }
        }
        while (position < arguments.length) {
            args.push(arguments[position++]);
        }
        return func.apply(this, args);
    };
};

// Returns a function that will be executed at most one time, no matter how
// often you call it. Useful for lazy initialization.
_.once = _.partial(_.before, 2);

// Returns the first function passed as an argument to the second,
// allowing you to adjust arguments, run code before and after, and
// conditionally execute the original function.
// _.wrap = function(func, wrapper) {
//    return _.partial(wrapper, func);
// };


// Memoize an expensive function by storing its results.
_.memoize = function (func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function () {
        var key = hasher.apply(this, arguments);
        return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
};

// Delays a function for the given number of milliseconds, and then calls
// it with the arguments supplied.
_.delay = function (func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function () {
        return func.apply(null, args);
    }, wait);
};

// Defers a function, scheduling it to run after the current call stack has
// cleared.
_.defer = function (func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
};


// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
_.throttle = function(func, wait, options) {
    var context;
    var args;
    var result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
        previous = options.leading === false ? 0 : now();
        timeout = null;
        result = func.apply(context, args);
        context = args = null;
    };
    return function() {
        if (!previous && options.leading === false) {
            previous = now;
        }
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
            clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = func.apply(context, args);
            context = args = null;
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
};


// Retrieve the names of an object's properties.
// Delegates to **ECMAScript 5**'s native `Object.keys`
_.keys = function (obj) {
    if (!_.isObject(obj)) {
        return [];
    }
    if (nativeKeys) {
        return nativeKeys(obj);
    }
    var keys = [];
    for (var key in obj) {
        if (_.has(obj, key)) {
            keys.push(key);
        }
    }
    return keys;
};

_.invert = function (obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
        result[obj[keys[i]]] = keys[i];
    }
    return result;
};

// Fill in a given object with default properties.
_.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
        if (source) {
            for (var prop in source) {
                if (obj[prop] === void 0) {
                    obj[prop] = source[prop];
                }
            }
        }
    });
    return obj;
};

// Extend a given object with all the properties in passed-in object(s).
_.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
        if (source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
};

// Return a copy of the object only containing the whitelisted properties.
_.pick = function (obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function (key) {
        if (key in obj) {
            copy[key] = obj[key];
        }
    });
    return copy;
};

// Return a copy of the object without the blacklisted properties.
_.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
        if (!_.contains(keys, key)) {
            copy[key] = obj[key];
        }
    }
    return copy;
};

// Create a (shallow-cloned) duplicate of an object.
_.clone = function(obj) {
    if (!_.isObject(obj)) {
        return obj;
    }
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
};

// Is a given value an array?
// Delegates to ECMA5's native Array.isArray
_.isArray = nativeIsArray || function (obj) {
    return toString.call(obj) == '[object Array]';
};

// Is a given variable an object?
_.isObject = function (obj) {
    return obj === Object(obj);
};

// Add some isType methods: isFunction, isString, isNumber, isDate, isRegExp.
each(['Function', 'String', 'Number', 'Date', 'RegExp'], function (name) {
    _['is' + name] = function (obj) {
        return toString.call(obj) == '[object ' + name + ']';
    };
});

// Optimize `isFunction` if appropriate.
if (typeof (/./) !== 'function') {
    _.isFunction = function (obj) {
        return typeof obj === 'function';
    };
}

// Is a given object a finite number?
_.isFinite = function (obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
};

// Is the given value `NaN`? (NaN is the only number which does not equal itself).
const _isNaN = _.isNaN = function (obj) {
    return _.isNumber(obj) && obj != +obj;
};

// Is a given value a boolean?
_.isBoolean = function (obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
};

// Is a given value equal to null?
_.isNull = function (obj) {
    return obj === null;
};

// Is a given variable undefined?
_.isUndefined = function (obj) {
    return obj === void 0;
};

// Shortcut function for checking if an object has a given property directly
// on itself (in other words, not on a prototype).
_.has = function (obj, key) {
    return hasOwnProperty.call(obj, key);
};

// Keep the identity function around for default iterators.
_.identity = function (value) {
    return value;
};

_.constant = function (value) {
    return function () {
        return value;
    };
};

_.property = function (key) {
    return function (obj) {
        return obj[key];
    };
};

_.propertyOf = function(obj) {
    return obj == null ? function() {} : function(key) {
        return obj[key];
    };
};

// Returns a predicate for checking whether an object has a given set of `key:value` pairs.
_.matches = function (attrs) {
    return function (obj) {
        // avoid comparing an object to itself.
        if (obj === attrs) {
            return true;
        }
        for (var key in attrs) {
            if (attrs[key] !== obj[key]) {
                return false;
            }
        }
        return true;
    };
};

// A (possibly faster) way to get the current timestamp as an integer.
_.now = now;

// If the value of the named `property` is a function then invoke it with the
// `object` as context; otherwise, return it.
_.result = function (object, property) {
    if (object == null) {
        return void 0;
    }
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
};

const _isNumber = _.isNumber;
const _isValidNumber = (val) => _isNumber(val) && !_isNaN(val);

export { _isNaN, _isNumber, _isValidNumber };
export default _;
