// Clamp the input number between min max values
export const between = function (num: number, min: number, max: number): number {
    return Math.max(Math.min(num, max), min);
};
