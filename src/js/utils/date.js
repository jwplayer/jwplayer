export const now = Date.now || function() {
    return new Date().getTime();
};
