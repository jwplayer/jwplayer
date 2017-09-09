// States

/**
 * The user pressed play, but sufficient data to start playback has not yet loaded.
   The buffering icon is visible in the display.
*/
export const STATE_BUFFERING = 'buffering';

/**
 * Either playback has not started or playback was stopped due to a stop() call or an error.
   In this state, either the play or the error icon is visible in the display.
*/
export const STATE_IDLE = 'idle';

/**
 * Playback has ended. The replay icon is visible in the display.
*/
export const STATE_COMPLETE = 'complete';

/**
 * The video is currently paused. The play icon is visible in the display.
*/
export const STATE_PAUSED = 'paused';

/**
 * The video is currently playing. No icon is visible in the display.
*/
export const STATE_PLAYING = 'playing';

/**
 * Playback was stopped due to an error.
   In this state the error icon and a message are visible in the display.
*/
export const STATE_ERROR = 'error';

/**
 * The user pressed play, but media has not yet loaded.
*/
export const STATE_LOADING = 'loading';

/**
 * The user pressed play, but data is not being loaded.
*/
export const STATE_STALLED = 'stalled';

// Touch Events

/**
 * Event triggered while dragging the observed element.
*/
export const DRAG = 'drag';

/**
 * Event triggered when dragging the observed element begins.
*/
export const DRAG_START = 'dragStart';

/**
 * Event triggered when dragging the observed element ends.
*/
export const DRAG_END = 'dragEnd';

/**
 * Event triggered when a user clicks the observed element once.
*/
export const CLICK = 'click';

/**
 * Event triggered when a user clicks the observed element twice consecutively.
*/
export const DOUBLE_CLICK = 'doubleClick';

/**
 * Event triggered when a user taps the observed element once.
*/
export const TAP = 'tap';

/**
 * Event triggered when a user taps the observed element twice consecutively.
*/
export const DOUBLE_TAP = 'doubleTap';

/**
 * Event triggered when the mouse is over the observed element.
*/
export const OVER = 'over';

/**
 * Event triggered while the mouse moves over the observed element.
*/
export const MOVE = 'move';

/**
 * Event triggered when the mouse is no longer over the observed element.
*/
export const OUT = 'out';

// Script Loaders

/**
 * Event stream reproduction is stopped because of an error.
*/
export const ERROR = STATE_ERROR;

// Ad events

/**
 * Event triggered when an ad is clicked.
*/
export const AD_CLICK = 'adClick';

/**
 * Event triggered once an ad tag is loaded containing companion creatives.
*/
export const AD_COMPANIONS = 'adCompanions';

/**
 * Event triggered when an ad has completed playback.
*/
export const AD_COMPLETE = 'adComplete';

/**
 * Event triggered when an error prevents the ad from playing.
*/
export const AD_ERROR = 'adError';

/**
 * Event triggered based on the IAB definition of an ad impression. This occurs the instant a video ad begins to play.
*/
export const AD_IMPRESSION = 'adImpression';

/**
 * Event triggered when metadata is obtained during ad playback.
*/
export const AD_META = 'adMeta';

/**
 * Event triggered when an ad is paused.
*/
export const AD_PAUSE = 'adPause';

/**
 * Event triggered when an ad starts or is resumed.
*/
export const AD_PLAY = 'adPlay';

/**
 * Event triggered when an ad is skipped.
*/
export const AD_SKIPPED = 'adSkipped';

/**
 * Event triggered while ad playback is in progress.
*/
export const AD_TIME = 'adTime';

// Events

/**
 * Event triggered when media playback ends because the last segment has been played.
*/
export const MEDIA_COMPLETE = STATE_COMPLETE;

/**
 * Event triggered when the player's setup is complete and is ready to be used.
    This is the earliest point at which any API calls should be made.
*/
export const READY = 'ready';

/**
 * Event triggered when the playback position is either altered via API call, or due to user interaction.
*/
export const MEDIA_SEEK = 'seek';

/**
 * Fired just before the player begins playing. At this point the player will not have begun playing or buffering.
    This is the ideal moment to insert preroll ads using the playAd() API
*/
export const MEDIA_BEFOREPLAY = 'beforePlay';

/**
 * Fired just before the player completes playing. At this point the player will not have moved on to
    either showing the replay screen or advancing to the next playlistItem.
    This is the ideal moment to insert postroll ads using the playAd() API
*/
export const MEDIA_BEFORECOMPLETE = 'beforeComplete';

/**
 * Fired when buffer has reached the maximum capacity.
*/
export const MEDIA_BUFFER_FULL = 'bufferFull';

/**
 * Fired when a click on the video display is detected.
*/
export const DISPLAY_CLICK = 'displayClick';

/**
 * Fired when the final item in a playlist has played its final segment and has ended.
*/
export const PLAYLIST_COMPLETE = 'playlistComplete';

/**
 * Fired when changes to the casting status are detected, i.e. when connected or disconnected from a device.
*/
export const CAST_SESSION = 'cast';

/**
 * Fired when an attempt to reproduce media results in a failure, causing the player to stop playback and go into idle mode.
*/
export const MEDIA_ERROR = 'mediaError';

/**
 * Triggered by a video's first frame event, or the instant an audio file begins playback.
*/
export const MEDIA_FIRST_FRAME = 'firstFrame';

/**
 * Triggered the moment a request to play content is made.
*/
export const MEDIA_PLAY_ATTEMPT = 'playAttempt';

/**
 * Fired when playback is aborted or blocked. Pausing the video or changing the media results
 * in play attempts being aborted. In mobile browsers play attempts are blocked when not started by
 * a user gesture.
 */
export const MEDIA_PLAY_ATTEMPT_FAILED = 'playAttemptFailed';

/**
 * Fired when media has been loaded into the player.
*/
export const MEDIA_LOADED = 'loaded';

/**
 * Triggered when the video position changes after seeking, as opposed to MEDIA_SEEK which is triggered as a seek occurs.
*/
export const MEDIA_SEEKED = 'seeked';

// Setup Events

/**
 * Triggered when the player's setup results in a failure.
*/
export const SETUP_ERROR = 'setupError';

// Utility

/**
 * Triggered when the player's playback state changes.
*/
export const PLAYER_STATE = 'state';

/**
 * Fired when devices are available for casting.
*/
export const CAST_AVAILABLE = 'castAvailable';

// Model Changes

/**
 * Fired when the currently playing item loads additional data into its buffer.
    This only applies to VOD media; live streaming media (HLS/DASH) does not expose this behavior.
*/
export const MEDIA_BUFFER = 'bufferChange';

/**
 * Fired as the playback position gets updated, while the player is playing.
*/
export const MEDIA_TIME = 'time';

/**
 * Fired when the playbackRate of the video tag changes.
 */
export const MEDIA_RATE_CHANGE = 'ratechange';

/**
 * Fired when a loaded item's media type is detected.
*/
export const MEDIA_TYPE = 'mediaType';

/**
 * Fired when the playback volume is altered.
*/
export const MEDIA_VOLUME = 'volume';

/**
 * Fired when media is muted;
*/
export const MEDIA_MUTE = 'mute';

/**
 * Fired when metadata embedded in the media file is obtained.
*/
export const MEDIA_META = 'meta';

/**
 * Fired when the list of available quality levels is updated.
*/
export const MEDIA_LEVELS = 'levels';

/**
 * Fired when the active quality level is changed.
*/
export const MEDIA_LEVEL_CHANGED = 'levelsChanged';

/**
 * Fired when controls are enabled or disabled by a script.
*/
export const CONTROLS = 'controls';

/**
 * Fired when the player toggles to/from fullscreen.
*/
export const FULLSCREEN = 'fullscreen';

/**
 * Fired when the player's on-page dimensions have changed. Is not fired in response to a fullscreen change.
*/
export const RESIZE = 'resize';

/**
 * Fired when a new playlist item has been loaded into the player.
*/
export const PLAYLIST_ITEM = 'playlistItem';

/**
 * Fired when an entirely new playlist has been loaded into the player.
*/
export const PLAYLIST_LOADED = 'playlist';

/**
 * Fired when the list of available audio tracks is updated. Happens shortly after a playlist item starts playing.
*/
export const AUDIO_TRACKS = 'audioTracks';

/**
 * Fired when the active audio track is changed.
    Happens in response to e.g. a user clicking the audio tracks menu or a script calling setCurrentAudioTrack().
*/
export const AUDIO_TRACK_CHANGED = 'audioTrackChanged';

/**
 * Fired when the playback rate has been changed.
*/
export const PLAYBACK_RATE_CHANGED = 'playbackRateChanged';

// View Component Actions

/**
 * Fired when a click has been detected on the logo element.
*/
export const LOGO_CLICK = 'logoClick';

// Model - Captions

/**
 * Fired when the list of available captions tracks changes.
    This event is the ideal time to set default captions with the API.
*/
export const CAPTIONS_LIST = 'captionsList';

/**
 * Triggered whenever the active captions track is changed manually or via API.
*/
export const CAPTIONS_CHANGED = 'captionsChanged';

// Provider Communication

/**
 * Fired the provider being utilized by JW Player for a particular media file is replaced by a new provider.
*/
export const PROVIDER_CHANGED = 'providerChanged';

/**
 * Triggered when a provider begins playback to signal availability of first frame.
*/
export const PROVIDER_FIRST_FRAME = 'providerFirstFrame';

// UI Events

/**
 * Fired when user activity is detected on the targeted element.
*/
export const USER_ACTION = 'userAction';

/**
 * Fired when the instream adapter detects a click.
*/
export const INSTREAM_CLICK = 'instreamClick';

/**
 * Triggered when the player is resized to a width in a different breakpoint category.
*/
export const BREAKPOINT = 'breakpoint';
