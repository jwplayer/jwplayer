import getMediaElement from 'api/get-media-element';
import { style } from 'utils/css';

const VideoActionsMixin = {
    container: null,

    volume: function(vol) {
        vol = Math.max(Math.min(vol / 100, 1), 0);
        this.video.volume = vol;
    },

    mute: function(state) {
        this.video.muted = !!state;
        if (!this.video.muted) {
            // Remove muted attribute once user unmutes so the video element doesn't get
            // muted by the browser when the src changes or on replay
            this.video.removeAttribute('muted');
        }
    },

    resize: function(width, height, stretching) {
        if (!width || !height || !this.video.videoWidth || !this.video.videoHeight) {
            return false;
        }
        if (stretching === 'uniform') {
            // snap video to edges when the difference in aspect ratio is less than 9%
            var playerAspectRatio = width / height;
            var videoAspectRatio = this.video.videoWidth / this.video.videoHeight;
            var objectFit = null;
            if (Math.abs(playerAspectRatio - videoAspectRatio) < 0.09) {
                objectFit = 'fill';
            }
            style(this.video, {
                objectFit: objectFit
            });
        }
        return false;
    },

    getContainer: function() {
        return this.container;
    },

    setContainer: function(element) {
        this.container = element;
        element.insertBefore(this.video, element.firstChild);
    },

    remove: function() {
        this.stop();
        this.destroy();
        if (this.container === this.video.parentNode) {
            this.container.removeChild(this.video);
        }
    },

    getVideo: function(playerId, container) {
        const media = getMediaElement(playerId, container);
        this.video = media;
        return media;
    }
};

export default VideoActionsMixin;
