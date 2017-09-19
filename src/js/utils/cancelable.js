import { resolved } from 'polyfills/promise';

export default function cancelable(callback) {
    let cancelled = false;

    return {
        async: function() {
            const args = arguments;
            return resolved.then(() => {
                if (cancelled) {
                    return;
                }
                return callback.apply(this, args);
            });
        },
        cancel: () => {
            cancelled = true;
        },
        cancelled: () => cancelled
    };
}
