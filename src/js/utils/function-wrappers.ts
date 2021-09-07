// Helper function to wrap a function so that it can only be executed
// a limited number of times before being "silenced"
// Can be reset to allow the target function to be invoked again
export const limit = (fn: Function, maxTimes: number) => {
    let times = 0;
    const wrapper = function(this: any, ...args: any[]): any {
        times++;
        if (times < maxTimes) {
            return fn.apply(this, args);
        }
    };

    return Object.assign(wrapper, {
        reset: (): void => {
            times = 0;
        },
        shush: (): void => {
            times = Infinity;
        }
    });
};
