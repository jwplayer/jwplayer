import { replaceClass } from 'utils/dom';

export function getBreakpoint(width) {
    let breakpoint = 0;

    if (width >= 1280) {
        breakpoint = 7;
    } else if (width >= 960) {
        breakpoint = 6;
    } else if (width >= 800) {
        breakpoint = 5;
    } else if (width >= 640) {
        breakpoint = 4;
    } else if (width >= 540) {
        breakpoint = 3;
    } else if (width >= 420) {
        breakpoint = 2;
    } else if (width >= 320) {
        breakpoint = 1;
    }

    return breakpoint;
}

export function setBreakpoint(playerElement, breakpointNumber) {
    const breakpointClass = 'jw-breakpoint-' + breakpointNumber;
    replaceClass(playerElement, /jw-breakpoint-\d+/, breakpointClass);
}
