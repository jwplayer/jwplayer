import { STATE_IDLE, STATE_COMPLETE, STATE_STALLED, STATE_LOADING, STATE_PLAYING, STATE_PAUSED,
    PROVIDER_FIRST_FRAME, CLICK, MEDIA_BUFFER_FULL, MEDIA_RATE_CHANGE, MEDIA_ERROR,
    MEDIA_BUFFER, MEDIA_META, MEDIA_TIME, MEDIA_SEEKED, MEDIA_VOLUME, MEDIA_MUTE, MEDIA_COMPLETE
} from 'events/events';
import utils from 'utils/helpers';

// This will trigger the events required by jwplayer model to
//  properly follow the state of the video tag
//
// Assumptions
//  1. All functions are bound to the "this" of the provider
//  2. The provider has an attribute "video" which is the video tag

const VideoListenerMixin = {
    canplay() {
        this.trigger(MEDIA_BUFFER_FULL);
    },

    play() {
        if (!this.video.paused && this.state !== STATE_PLAYING) {
            this.setState(STATE_LOADING);
        }
    },

    loadedmetadata() {
        var metadata = {
            duration: this.getDuration(),
            height: this.video.videoHeight,
            width: this.video.videoWidth
        };
        var drmUsed = this.drmUsed;
        if (drmUsed) {
            metadata.drm = drmUsed;
        }
        this.trigger(MEDIA_META, metadata);
    },

    timeupdate() {
        this.stopStallCheck();
        var height = this.video.videoHeight;
        if (height !== this._helperLastVideoHeight) {
            if (this.adaptation) {
                this.adaptation({
                    size: {
                        width: this.video.videoWidth,
                        height: height
                    }
                });
            }
        }
        this._helperLastVideoHeight = height;

        if (!this.video.paused && (this.state === STATE_STALLED || this.state === STATE_LOADING)) {
            this.startStallCheck();
            this.setState(STATE_PLAYING);
        }

        var position = this.getCurrentTime();
        var timeEventObject = {
            position: position,
            duration: this.getDuration()
        };
        if (this.getPtsOffset) {
            var ptsOffset = this.getPtsOffset();
            if (ptsOffset >= 0) {
                timeEventObject.metadata = {
                    mpegts: ptsOffset + position
                };
            }
        }

        // only emit time events when playing or seeking
        if (this.state === STATE_PLAYING || this.seeking) {
            this.trigger(MEDIA_TIME, timeEventObject);
        }
    },

    click(evt) {
        this.trigger(CLICK, evt);
    },

    volumechange() {
        var video = this.video;

        this.trigger(MEDIA_VOLUME, {
            volume: Math.round(video.volume * 100)
        });

        this.trigger(MEDIA_MUTE, {
            mute: video.muted
        });
    },

    seeked() {
        if (!this.seeking) {
            return;
        }
        this.seeking = false;
        this.trigger(MEDIA_SEEKED);
    },

    playing() {
        this.setState(STATE_PLAYING);
        this.trigger(PROVIDER_FIRST_FRAME);
    },

    pause() {
        // Sometimes the browser will fire "complete" and then a "pause" event
        if (this.state === STATE_COMPLETE) {
            return;
        }
        if (this.video.ended) {
            return;
        }
        if (this.video.error) {
            return;
        }
        // If "pause" fires before "complete", we still don't want to propagate it
        if (this.video.currentTime === this.video.duration) {
            return;
        }
        this.setState(STATE_PAUSED);
    },

    progress() {
        var dur = this.getDuration();
        if (dur <= 0 || dur === Infinity) {
            return;
        }
        var buf = this.video.buffered;
        if (!buf || buf.length === 0) {
            return;
        }

        var buffered = utils.between(buf.end(buf.length - 1) / dur, 0, 1);
        this.trigger(MEDIA_BUFFER, {
            bufferPercent: buffered * 100,
            position: this.getCurrentTime(),
            duration: dur
        });
    },

    ratechange() {
        this.trigger(MEDIA_RATE_CHANGE, { playbackRate: this.video.playbackRate });
    },

    ended() {
        this.stopStallCheck();
        this._helperLastVideoHeight = 0;
        if (this.state !== STATE_IDLE && this.state !== STATE_COMPLETE) {
            this.trigger(MEDIA_COMPLETE);
        }
    },
    loadeddata () {
        // If we're not rendering natively text tracks will be provided from another source - don't duplicate them here
        if (this.renderNatively) {
            this.setTextTracks(this.video.textTracks);
        }
    },
    error() {
        var code = (this.video.error && this.video.error.code) || -1;
        var message = ({
            1: 'Unknown operation aborted',
            2: 'Unknown network error',
            3: 'Unknown decode error',
            4: 'Source not supported'
        }[code] || 'Unknown');
        this.trigger(MEDIA_ERROR, {
            code: code,
            message: 'Error playing file: ' + message
        });
    }
};

export default VideoListenerMixin;
