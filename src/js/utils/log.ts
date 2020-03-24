/* eslint-disable no-console */
export const log: (msg: string) => {} = (typeof console.log === 'function') ? console.log.bind(console) : noop;

function noop(): void {
    // noop
}
