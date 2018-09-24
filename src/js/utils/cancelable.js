export default function cancelable(callback) {
    let cancelled = false;

    return {
        async: function() {
            const args = arguments;
            return Promise.resolve().then(() => {
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
