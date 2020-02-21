/* eslint-disable no-console */

const noop = () => {
    // noop
};

export const log: () => {} = (typeof console.log === 'function') ? console.log.bind(console) : noop;
