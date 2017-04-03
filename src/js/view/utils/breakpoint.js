define([
    'utils/helpers',
    'utils/underscore',
], function (utils) {
    return function setBreakpoint(playerElement, playerWidth, playerHeight) {
        var width = playerWidth;
        var height = playerHeight;

        var breakPoint = 0;
        if (width >= 1280) {
            breakPoint = 7;
        } else if (width >= 960) {
            breakPoint = 6;
        } else if (width >= 800) {
            breakPoint = 5;
        } else if (width >= 640) {
            breakPoint = 4;
        } else if (width >= 540) {
            breakPoint = 3;
        } else if (width >= 420) {
            breakPoint = 2;
        } else if (width >= 320) {
            breakPoint = 1;
        }

        var className = 'jw-breakpoint-' + breakPoint;
        utils.replaceClass(playerElement, /jw-breakpoint-\d+/, className);
        utils.toggleClass(playerElement, 'jw-orientation-portrait', (height > width));

        return breakPoint;
    };
});
