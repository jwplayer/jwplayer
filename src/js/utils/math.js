
// Clamp the input number between min max values
export const between = function (num, min, max) {
    return Math.max(Math.min(num, max), min);
};
