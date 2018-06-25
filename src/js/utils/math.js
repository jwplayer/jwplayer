
// Clamp the input number between min max values
export const between = function (num, min, max) {
    return Math.max(Math.min(num, max), min);
};

// Round a given number to the hundredths-place
// Used for playbackRates
export const roundToHundredths = function (num) {
    return parseFloat(num.toPrecision(2));
};
