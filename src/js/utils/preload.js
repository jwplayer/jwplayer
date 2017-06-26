const _ = require('utils/underscore');

const preloadValues = ['none', 'metadata', 'auto'];

export function getPreload(preload, fallback) {
    if (_.contains(preloadValues, preload)) {
        return preload;
    }
    return _.contains(preloadValues, fallback) ? fallback : 'metadata';
}
