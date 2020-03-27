/* eslint-disable no-console */
export const log: (message?: any, ...optionalParams: any[]) => void = (typeof console.log === 'function') ? console.log.bind(console) : noop;

function noop(): void {
    // noop
}
