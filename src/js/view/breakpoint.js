define([
    'utils/helpers',
    'utils/underscore',
], function (utils) {
    return function setBreakpoint(playerElement, playerWidth, playerHeight) {
        var className = 'jw-breakpoint-';
        var width = playerWidth;
        var height = playerHeight;

        if (width >= 1280) {
            className += '7';
        } else if (width >= 960) {
            className += '6';
        } else if (width >= 800) {
            className += '5';
        } else if (width >= 640) {
            className += '4';
        } else if (width >= 540) {
            className += '3';
        } else if (width >= 420) {
            className += '2';
        } else if (width >= 320) {
            className += '1';
        } else {
            className += '0';
        }

        utils.replaceClass(playerElement, /jw-breakpoint-\d+/, className);
        utils.toggleClass(playerElement, 'jw-orientation-portrait', (height > width));
    };
});
