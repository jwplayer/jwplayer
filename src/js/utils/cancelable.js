import { resolved } from 'polyfills/promise';

export default function cancelable(callback) {
    let cancelled = false;

    return {
        async: () => resolved.then(() => {
            if (cancelled) {
                return;
            }
            return callback();
        }),
        cancel: () => {
            cancelled = true;
        },
        cancelled: () => cancelled
    };
}
