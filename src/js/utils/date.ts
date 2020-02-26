export const now: () => number = Date.now || function(): number {
    return new Date().getTime();
};
