/* eslint-disable no-console */

export const log = (typeof console.log === 'function') ? console.log.bind(console) : function() {};
