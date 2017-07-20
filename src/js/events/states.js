<<<<<<< HEAD
/**
 * The user pressed play, but sufficient data to start playback has not yet loaded.
   The buffering icon is visible in the display.
*/
export const BUFFERING = 'buffering';

/**
 * Either playback has not started or playback was stopped due to a stop() call or an error.
   In this state, either the play or the error icon is visible in the display.
*/
export const IDLE = 'idle';

/**
 * Playback has ended. The replay icon is visible in the display.
*/
export const COMPLETE = 'complete';

/**
 * The video is currently paused. The play icon is visible in the display.
*/
export const PAUSED = 'paused';

/**
 * The video is currently playing. No icon is visible in the display.
*/
export const PLAYING = 'playing';

/**
 * Playback was stopped due to an error.
   In this state the error icon and a message are visible in the display.
*/
export const ERROR = 'error';

/**
 * The user pressed play, but media has not yet loaded.
*/
export const LOADING = 'loading';

// TODO: What is stalled ?
/**
 * The user pressed play, but data is not being loaded.
*/
export const STALLED = 'stalled';
=======
define([], function() {
    return {

    };
});
>>>>>>> e7d6c04a... moved events to compatibility script JW8-120
