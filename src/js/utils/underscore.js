//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

import { now as nowDate } from 'utils/date';

/* eslint-disable no-unused-expressions,new-cap */
/* eslint no-eq-null: 0 */
/* eslint eqeqeq: 0 */
/* eslint no-void: 0 */
/* eslint guard-for-in: 0 */
/* eslint no-constant-condition: 0 */
/* eslint dot-notation: 0 */

/*
 * Source: https://github.com/jashkenas/underscore/blob/1f4bf62/underscore.js
 */

// Establish the object that gets returned to break out of a loop iteration.
const breaker = {};

// Save bytes in the minified (but not gzipped) version:
const ArrayProto = Array.prototype;
const ObjProto = Object.prototype;
const FuncProto = Function.prototype;

// Create quick reference constiables for speed access to core prototypes.
const slice = ArrayProto.slice;
const concat = ArrayProto.concat;
const toString = ObjProto.toString;
const hasOwnProperty = ObjProto.hasOwnProperty;

// All **ECMAScript 5** native function implementations that we hope to use
// are declared here.
const nativeMap = ArrayProto.map;
const nativeReduce = ArrayProto.reduce;
const nativeForEach = ArrayProto.forEach;
const nativeFilter = ArrayProto.filter;
const nativeEvery = ArrayProto.every;
const nativeSome = ArrayProto.some;
const nativeIndexOf = ArrayProto.indexOf;
const nativeIsArray = Array.isArray;
const nativeKeys = Object.keys;
const nativeBind = FuncProto.bind;
const nativeIsFinite = window.isFinite;

// Collection Functions
// --------------------

// The cornerstone, an `each` implementation, aka `forEach`.
// Handles objects with the built-in `forEach`, arrays, and raw objects.
// Delegates to **ECMAScript 5**'s native `forEach` if available.
export const each = function (obj, iterator, context) {
    let i;
    let length;
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
        const objectKeys = keys(obj);
        for (i = 0, length = objectKeys.length; i < length; i++) {
            if (iterator.call(context, obj[objectKeys[i]], objectKeys[i], obj) === breaker) {
                return;
            }
        }
    }
    return obj;
};
const forEach = each;

// Return the results of applying the iterator to each element.
// Delegates to **ECMAScript 5**'s native `map` if available.
export const map = function (obj, iterator, context) {
    const results = [];
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
const collect = map;

const reduceError = 'Reduce of empty array with no initial value';

// **Reduce** builds up a single result from a list of values, aka `inject`,
// or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
export const reduce = function(obj, iterator, memo, context) {
    let initial = arguments.length > 2;
    if (obj == null) {
        obj = [];
    }
    if (nativeReduce && obj.reduce === nativeReduce) {
        if (context) {
            iterator = bind(iterator, context);
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
const foldl = reduce;
const inject = reduce;

// Return the first value which passes a truth test. Aliased as `detect`.
export const find = function (obj, predicate, context) {
    let result;
    any(obj, function (value, index, list) {
        if (predicate.call(context, value, index, list)) {
            result = value;
            return true;
        }
    });
    return result;
};
const detect = find;


// Return all the elements that pass a truth test.
// Delegates to **ECMAScript 5**'s native `filter` if available.
// Aliased as `select`.
export const filter = function (obj, predicate, context) {
    const results = [];
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
const select = filter;

// Return all the elements for which a truth test fails.
const reject = function(obj, predicate, context) {
    return filter(obj, function(value, index, list) {
        return !predicate.call(context, value, index, list);
    }, context);
};

// Trim out all falsy values from an array.
const compact = function(array) {
    return filter(array, identity);
};


// Determine whether all of the elements match a truth test.
// Delegates to **ECMAScript 5**'s native `every` if available.
// Aliased as `all`.
export const all = function (obj, predicate, context) {
    predicate || (predicate = identity);
    let result = true;
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
const every = all;

// Determine if at least one element in the object matches a truth test.
// Delegates to **ECMAScript 5**'s native `some` if available.
// Aliased as `any`.
export const any = function (obj, predicate, context) {
    predicate || (predicate = identity);
    let result = false;
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
export const some = any;

// returns the size of an object
export const size = function (obj) {
    if (obj == null) {
        return 0;
    }
    return obj.length === +obj.length ? obj.length : keys(obj).length;
};


// Array Functions
// ---------------


// Get the last element of an array. Passing **n** will return the last N
// values in the array. The **guard** check allows it to work with `map`.
const last = function(array, n, guard) {
    if (array == null) {
        return void 0;
    }
    if ((n == null) || guard) {
        return array[array.length - 1];
    }
    return slice.call(array, Math.max(array.length - n, 0));
};


// Returns a function that will only be executed after being called N times.
const after = function (times, func) {
    return function () {
        if (--times < 1) {
            return func.apply(this, arguments);
        }
    };
};

// Returns a function that will only be executed up to (but not including) the Nth call.
const before = function(times, func) {
    let memo;
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
const lookupIterator = function (value) {
    if (value == null) {
        return identity;
    }
    if (isFunction(value)) {
        return value;
    }
    return property(value);
};


// An internal function used for aggregate "group by" operations.
const group = function(behavior) {
    return function(obj, iterator, context) {
        const result = {};
        iterator = lookupIterator(iterator);
        each(obj, function(value, index) {
            const key = iterator.call(context, value, index, obj);
            behavior(result, key, value);
        });
        return result;
    };
};

// Groups the object's values by a criterion. Pass either a string attribute
// to group by, or a function that returns the criterion.
export const groupBy = group(function(result, key, value) {
    has(result, key) ? result[key].push(value) : result[key] = [value];
});

// Indexes the object's values by a criterion, similar to `groupBy`, but for
// when you know that your index values will be unique.
const indexBy = group(function(result, key, value) {
    result[key] = value;
});


// Use a comparator function to figure out the smallest index at which
// an object should be inserted so as to maintain order. Uses binary search.
export const sortedIndex = function (array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    const value = iterator.call(context, obj);
    let low = 0;
    let high = array.length;
    while (low < high) {
        const mid = (low + high) >>> 1;
        iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
};

export const contains = function (obj, target) {
    if (obj == null) {
        return false;
    }
    if (obj.length !== +obj.length) {
        obj = values(obj);
    }
    return indexOf(obj, target) >= 0;
};
const include = contains;

// Convenience version of a common use case of `map`: fetching a property.
const pluck = function(obj, key) {
    return map(obj, property(key));
};

// Convenience version of a common use case of `filter`: selecting only objects
// containing specific `key:value` pairs.
export const where = function (obj, attrs) {
    return filter(obj, matches(attrs));
};

// Convenience version of a common use case of `find`: getting the first object
// containing specific `key:value` pairs.
export const findWhere = function(obj, attrs) {
    return find(obj, matches(attrs));
};

// Return the maximum element or (element-based computation).
// Can't optimize arrays of integers longer than 65,535 elements.
// See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
const max = function(obj, iterator, context) {
    if (!iterator && isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
        return Math.max.apply(Math, obj);
    }
    let result = -Infinity;
    let lastComputed = -Infinity;
    each(obj, function(value, index, list) {
        const computed = iterator ? iterator.call(context, value, index, list) : value;
        if (computed > lastComputed) {
            result = value;
            lastComputed = computed;
        }
    });
    return result;
};

// Take the difference between one array and a number of other arrays.
// Only the elements present in just the first array will remain.
export const difference = function (array) {
    const rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return filter(array, function (value) {
        return !contains(rest, value);
    });
};

// Return a version of the array that does not contain the specified value(s).
const without = function (array) {
    return difference(array, slice.call(arguments, 1));
};

// If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
// we need this function. Return the position of the first occurrence of an
// item in an array, or -1 if the item is not included in the array.
// Delegates to **ECMAScript 5**'s native `indexOf` if available.
// If the array is large and already in sort order, pass `true`
// for **isSorted** to use binary search.
export const indexOf = function (array, item, isSorted) {
    if (array == null) {
        return -1;
    }
    let i = 0;
    const length = array.length;
    if (isSorted) {
        if (typeof isSorted == 'number') {
            i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
        } else {
            i = sortedIndex(array, item);
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
const ctor = function() {};

// Create a function bound to a given object (assigning `this`, and arguments,
// optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
// available.
export const bind = function(func, context) {
    let args;
    let bound;
    if (nativeBind && func.bind === nativeBind) {
        return nativeBind.apply(func, slice.call(arguments, 1));
    }
    if (!isFunction(func)) {
        throw new TypeError();
    }
    args = slice.call(arguments, 2);
    bound = function() {
        if (!(this instanceof bound)) {
            return func.apply(context, args.concat(slice.call(arguments)));
        }
        ctor.prototype = func.prototype;
        const self = new ctor();
        ctor.prototype = null;
        const result = func.apply(self, args.concat(slice.call(arguments)));
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
const partial = function (func) {
    const boundArgs = slice.call(arguments, 1);
    return function () {
        let position = 0;
        const args = boundArgs.slice();
        for (let i = 0, length = args.length; i < length; i++) {
            if (has(args[i], 'partial')) {
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
const once = partial(before, 2);

// Returns the first function passed as an argument to the second,
// allowing you to adjust arguments, run code before and after, and
// conditionally execute the original function.
// wrap = function(func, wrapper) {
//    return partial(wrapper, func);
// };


// Memoize an expensive function by storing its results.
export const memoize = function (func, hasher) {
    const memo = {};
    hasher || (hasher = identity);
    return function () {
        const key = hasher.apply(this, arguments);
        return has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
};

// Delays a function for the given number of milliseconds, and then calls
// it with the arguments supplied.
const delay = function (func, wait) {
    const args = slice.call(arguments, 2);
    return setTimeout(function () {
        return func.apply(null, args);
    }, wait);
};

// Defers a function, scheduling it to run after the current call stack has
// cleared.
const defer = partial(delay, { partial }, 1);


// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
export const throttle = function(func, wait, options) {
    let context;
    let args;
    let result;
    let timeout = null;
    let previous = 0;
    options || (options = {});
    const later = function() {
        previous = options.leading === false ? 0 : now();
        timeout = null;
        result = func.apply(context, args);
        context = args = null;
    };
    return function() {
        if (!previous && options.leading === false) {
            previous = now;
        }
        const remaining = wait - (now - previous);
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
const keys = function (obj) {
    if (!isObject(obj)) {
        return [];
    }
    if (nativeKeys) {
        return nativeKeys(obj);
    }
    const objectKeys = [];
    for (const key in obj) {
        if (has(obj, key)) {
            objectKeys.push(key);
        }
    }
    return objectKeys;
};

const values = function(obj) {
    const objectKeys = keys(obj);
    const length = keys.length;
    const result = Array(length);
    for (let i = 0; i < length; i++) {
        result[i] = obj[objectKeys[i]];
    }
    return result;
};

export const invert = function (obj) {
    const result = {};
    const objectKeys = keys(obj);
    for (let i = 0, length = objectKeys.length; i < length; i++) {
        result[obj[objectKeys[i]]] = objectKeys[i];
    }
    return result;
};

// Fill in a given object with default properties.
export const defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
        if (source) {
            for (const prop in source) {
                if (obj[prop] === void 0) {
                    obj[prop] = source[prop];
                }
            }
        }
    });
    return obj;
};

// Extend a given object with all the properties in passed-in object(s).
export const extend = Object.assign || function(obj) {
    each(slice.call(arguments, 1), function(source) {
        if (source) {
            for (const prop in source) {
                if (Object.prototype.hasOwnProperty.call(source, prop)) {
                    obj[prop] = source[prop];
                }
            }
        }
    });
    return obj;
};

// Return a copy of the object only containing the whitelisted properties.
export const pick = function (obj) {
    const copy = {};
    const objectKeys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(objectKeys, function (key) {
        if (key in obj) {
            copy[key] = obj[key];
        }
    });
    return copy;
};

// Return a copy of the object without the blacklisted properties.
const omit = function(obj) {
    const copy = {};
    const objectKeys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (const key in obj) {
        if (!contains(objectKeys, key)) {
            copy[key] = obj[key];
        }
    }
    return copy;
};

// Create a (shallow-cloned) duplicate of an object.
const clone = function(obj) {
    if (!isObject(obj)) {
        return obj;
    }
    return isArray(obj) ? obj.slice() : extend({}, obj);
};

// Is a given value an array?
// Delegates to ECMA5's native Array.isArray
const isArray = nativeIsArray || function (obj) {
    return toString.call(obj) == '[object Array]';
};

// Is a given variable an object?
export const isObject = function (obj) {
    return obj === Object(obj);
};

// Add some isType methods: isFunction, isString, isNumber, isDate, isRegExp.
const is = [];
each(['Function', 'String', 'Number', 'Date', 'RegExp'], function (name) {
    is[name] = function (obj) {
        return toString.call(obj) == '[object ' + name + ']';
    };
});

// Optimize `isFunction` if appropriate.
if (typeof (/./) !== 'function') {
    is['Function'] = function (obj) {
        return typeof obj === 'function';
    };
}

const isDate = is['Date'];
const isRegExp = is['RegExp'];

export const isFunction = is['Function'];
export const isNumber = is['Number'];
export const isString = is['String'];

// Is a given object a finite number?
export const isFinite = function (obj) {
    return nativeIsFinite(obj) && !isNaN(parseFloat(obj));
};

// Is the given value `NaN`? (NaN is the only number which does not equal itself).
export const isNaN = function (obj) {
    return isNumber(obj) && obj != +obj;
};

// Is a given value a boolean?
export const isBoolean = function (obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
};

// Is a given value equal to null?
const isNull = function (obj) {
    return obj === null;
};

// Is a given variable undefined?
export const isUndefined = function (obj) {
    return obj === void 0;
};

// Shortcut function for checking if an object has a given property directly
// on itself (in other words, not on a prototype).
const has = function (obj, key) {
    return hasOwnProperty.call(obj, key);
};

// Keep the identity function around for default iterators.
export const identity = function (value) {
    return value;
};

export const constant = function (value) {
    return function () {
        return value;
    };
};

export const property = function (key) {
    return function (obj) {
        return obj[key];
    };
};

const propertyOf = function(obj) {
    return obj == null ? function() {} : function(key) {
        return obj[key];
    };
};

// Returns a predicate for checking whether an object has a given set of `key:value` pairs.
export const matches = function (attrs) {
    return function (obj) {
        // avoid comparing an object to itself.
        if (obj === attrs) {
            return true;
        }
        for (const key in attrs) {
            if (attrs[key] !== obj[key]) {
                return false;
            }
        }
        return true;
    };
};

// A (possibly faster) way to get the current timestamp as an integer.
const now = nowDate;

// If the value of the named `property` is a function then invoke it with the
// `object` as context; otherwise, return it.
const result = function (object, prop) {
    if (object == null) {
        return void 0;
    }
    const value = object[prop];
    return isFunction(value) ? value.call(object) : value;
};

export const isValidNumber = (val) => isNumber(val) && !isNaN(val);

export const debounce = (func, wait = 100) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
};

export default {
    after,
    all,
    any,
    before,
    bind,
    clone,
    collect,
    compact,
    constant,
    contains,
    debounce,
    defaults,
    defer,
    delay,
    detect,
    difference,
    each,
    every,
    extend,
    filter,
    find,
    findWhere,
    foldl,
    forEach,
    groupBy,
    has,
    identity,
    include,
    indexBy,
    indexOf,
    inject,
    invert,
    isArray,
    isBoolean,
    isDate,
    isFinite,
    isFunction,
    isNaN,
    isNull,
    isNumber,
    isObject,
    isRegExp,
    isString,
    isUndefined,
    isValidNumber,
    keys,
    last,
    map,
    matches,
    max,
    memoize,
    now,
    omit,
    once,
    partial,
    pick,
    pluck,
    property,
    propertyOf,
    reduce,
    reject,
    result,
    select,
    size,
    some,
    sortedIndex,
    throttle,
    where,
    without
};
