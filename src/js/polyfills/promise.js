import PromiseModule from 'promise-polyfill/src/index';

const Promise = window.Promise || (window.Promise = PromiseModule);

export const resolved = Promise.resolve();

export default Promise;
