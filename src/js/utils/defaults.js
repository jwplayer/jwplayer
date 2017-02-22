define([
    'utils/underscore'
], function (_) {
    // Adds properties to the first object from the rest
    // Does not add properties which exist anywhere in the object or it's prototype chain (no shadowing, no overriding)
    return function Defaults(obj) {
        _.each(Array.prototype.slice.call(arguments, 1), function(source) {
            if (source) {
                for (var prop in source) {
                    if (!(prop in obj)) {
                        obj[prop] = source[prop];
                    }
                }
            }
        });
        return obj;
    };
});
