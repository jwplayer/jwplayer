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
        // Find video tag, or create it if it doesn't exist.  View may not be built yet.
        var element = container || document.getElementById(playerId);
        var video = element ? element.querySelector('video, audio') : null;
        if (!video) {
            video = document.createElement('video');
        }
        video.className = 'jw-video jw-reset';
        this.video = video;
        return video;
    }
};

export default VideoActionsMixin;
