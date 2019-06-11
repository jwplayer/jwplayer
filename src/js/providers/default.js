import { PLAYER_STATE, MEDIA_TYPE } from 'events/events';

const noop = function() {};
const returnFalse = (() => false);
const getNameResult = { name: 'default' };
const returnName = (() => getNameResult);

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
    pause: noop,
    preload: noop,
    load: noop,
    stop: noop,
    volume: noop,
    mute: noop,
    seek: noop,
    resize: noop,
    remove: noop, // removes from page
    destroy: noop, // frees memory
    eventsOn_: noop,
    eventsOff_: noop,

    setVisibility: noop,
    setFullscreen: noop,
    getFullscreen: returnFalse,
    supportsFullscreen: returnFalse,

    // If setContainer has been set, this returns the element.
    //  It's value is used to determine if we should remove the <video> element when setting a new provider.
    getContainer: noop,

    // Sets the parent element, causing provider to append <video> into it
    setContainer: noop,

    getName: returnName,

    getQualityLevels: noop,
    getCurrentQuality: noop,
    setCurrentQuality: noop,

    getAudioTracks: noop,

    getCurrentAudioTrack: noop,
    setCurrentAudioTrack: noop,

    getSeekRange: function() {
        return {
            start: 0,
            end: this.getDuration()
        };
    },

    setPlaybackRate: noop,
    getPlaybackRate: function() {
        return 1;
    },
    getBandwidthEstimate() {
        return null;
    },
    getLiveLatency() {
        return null;
    },

    // TODO: Deprecate provider.setControls(bool) with Flash. It's used to toggle the cursor when the swf is in focus.
    setControls: noop,

    attachMedia: noop,
    detachMedia: noop,
    init: noop,

    setState: function(newstate) {
        this.state = newstate;

        this.trigger(PLAYER_STATE, {
            newstate
        });
    },

    sendMediaType: function(sources) {
        const { type, mimeType } = sources[0];

        const isAudioFile = (type === 'aac' || type === 'mp3' || type === 'mpeg' ||
            (mimeType && mimeType.indexOf('audio/') === 0));

        this.trigger(MEDIA_TYPE, {
            mediaType: isAudioFile ? 'audio' : 'video'
        });
    }
};

export default DefaultProvider;
