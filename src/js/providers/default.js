import { STATE_IDLE, PLAYER_STATE, MEDIA_TYPE } from 'events/events';

const noop = function() {};
const returnFalse = (() => false);

/** Audio Track information for tracks returned by {@link Api#getAudioTracks jwplayer().getAudioTracks()}
 * @typedef {object} AudioTrackOption
 * @property autoselect
 * @property defaulttrack
 * @property groupid
 * @property {string} language
 * @property {string} name
 */

/**
 * @typedef {option} QualityOption
 * @property {string} label
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [bitrate]
 */

const DefaultProvider = {
    // This function is required to determine if a provider can work on a given source
    supports: returnFalse,

    // Basic playback features
    play: noop,
    preload: noop,
    load: noop,
    stop: noop,
    volume: noop,
    mute: noop,
    seek: noop,
    resize: noop,
    remove: noop, // removes from page
    destroy: noop, // frees memory

    setVisibility: noop,
    setFullscreen: returnFalse,
    getFullscreen: noop,

    // If setContainer has been set, this returns the element.
    //  It's value is used to determine if we should remove the <video> element when setting a new provider.
    getContainer: noop,

    // Sets the parent element, causing provider to append <video> into it
    setContainer: returnFalse,

    getName: noop,

    getQualityLevels: noop,
    getCurrentQuality: noop,
    setCurrentQuality: noop,

    getAudioTracks: noop,

    getCurrentAudioTrack: noop,
    setCurrentAudioTrack: noop,

    setPlaybackRate: noop,
    getPlaybackRate: function() {
        return 1;
    },

    // TODO :: The following are targets for removal after refactoring
    checkComplete: noop,
    setControls: noop,
    attachMedia: noop,
    detachMedia: noop,
    init: noop,

    setState: function(state) {
        var oldState = this.state || STATE_IDLE;
        this.state = state;

        if (state === oldState) {
            return;
        }

        this.trigger(PLAYER_STATE, {
            newstate: state
        });
    },

    sendMediaType: function(levels) {
        var type = levels[0].type;
        var isAudioFile = (type === 'oga' || type === 'aac' || type === 'mp3' ||
            type === 'mpeg' || type === 'vorbis');

        this.trigger(MEDIA_TYPE, {
            mediaType: isAudioFile ? 'audio' : 'video'
        });
    }
};

export default DefaultProvider;
