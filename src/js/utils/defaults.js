// Adds properties to the first object from the rest
// Does not add properties which exist anywhere in the object or it's prototype chain (no shadowing, no overriding)

export default function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
        if (source) {
            for (const prop in source) {
                if (!(prop in obj)) {
                    obj[prop] = source[prop];
                }
            }
        }
    });
    return obj;
}
