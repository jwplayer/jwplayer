type Cancelable = {
    async: (...args: [any]) => Promise<any>;
    cancel: () => void;
    cancelled: () => boolean;
}

export default function cancelable(callback: (result?: any) => any): Cancelable {
    let cancelled = false;

    return {
        async: function(...args: [any]): Promise<any> {
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
