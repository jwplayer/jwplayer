import { STATE_IDLE, STATE_COMPLETE, STATE_STALLED, STATE_LOADING, STATE_PLAYING, STATE_PAUSED,
    PROVIDER_FIRST_FRAME, CLICK, MEDIA_BUFFER_FULL, MEDIA_RATE_CHANGE,
    MEDIA_BUFFER, MEDIA_META, MEDIA_TIME, MEDIA_SEEKED, MEDIA_VOLUME, MEDIA_MUTE, MEDIA_COMPLETE
} from 'events/events';
import { between } from 'utils/math';

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
        this.stallTime = -1;
        if (!this.video.paused && this.state !== STATE_PLAYING) {
            this.setState(STATE_LOADING);
        }
    },

    loadedmetadata() {
        const metadata = {
            metadataType: 'media',
            duration: this.getDuration(),
            height: this.video.videoHeight,
            width: this.video.videoWidth,
            seekRange: this.getSeekRange()
        };
        const drmUsed = this.drmUsed;
        if (drmUsed) {
            metadata.drm = drmUsed;
        }
        this.trigger(MEDIA_META, metadata);
    },

    timeupdate() {
        const currentTime = this.video.currentTime;
        const position = this.getCurrentTime();
        const duration = this.getDuration();
        if (isNaN(duration)) {
            return;
        }

        if (!this.seeking && !this.video.paused &&
            (this.state === STATE_STALLED || this.state === STATE_LOADING) &&
            this.stallTime !== currentTime) {
            this.stallTime = -1;
            this.setState(STATE_PLAYING);
        }

        const timeEventObject = {
            position,
            duration,
            currentTime: currentTime,
            seekRange: this.getSeekRange(),
            metadata: {
                currentTime: currentTime
            }
        };
        if (this.getPtsOffset) {
            const ptsOffset = this.getPtsOffset();
            if (ptsOffset >= 0) {
                timeEventObject.metadata.mpegts = ptsOffset + position;
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
        const video = this.video;

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
        // When stalling, STATE_PLAYING is only set on timeupdate
        // because Safari and Firefox will fire "playing" before playback recovers from stalling
        if (this.stallTime === -1) {
            // Here setting STATE_PLAYING ensures a quick recovery from STATE_LOADING after seeking
            this.setState(STATE_PLAYING);
        }
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
        const dur = this.getDuration();
        if (dur <= 0 || dur === Infinity) {
            return;
        }
        const buf = this.video.buffered;
        if (!buf || buf.length === 0) {
            return;
        }

        const buffered = between(buf.end(buf.length - 1) / dur, 0, 1);
        this.trigger(MEDIA_BUFFER, {
            bufferPercent: buffered * 100,
            position: this.getCurrentTime(),
            duration: dur,
            currentTime: this.video.currentTime,
            seekRange: this.getSeekRange()
        });
    },

    ratechange() {
        this.trigger(MEDIA_RATE_CHANGE, { playbackRate: this.video.playbackRate });
    },

    ended() {
        this.videoHeight = 0;
        this.streamBitrate = 0;
        if (this.state !== STATE_IDLE && this.state !== STATE_COMPLETE) {
            this.trigger(MEDIA_COMPLETE);
        }
    },

    loadeddata () {
        // If we're not rendering natively text tracks will be provided from another source - don't duplicate them here
        if (this.renderNatively) {
            this.setTextTracks(this.video.textTracks);
        }
    }
};

export default VideoListenerMixin;
