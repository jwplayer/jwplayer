import { style } from 'utils/css';
import endOfRange from 'utils/time-ranges';

const VideoActionsMixin = {
    container: null,

    volume(vol) {
        vol = Math.max(Math.min(vol / 100, 1), 0);
        this.video.volume = vol;
    },

    mute(state) {
        this.video.muted = !!state;
        if (!this.video.muted) {
            // Remove muted attribute once user unmutes so the video element doesn't get
            // muted by the browser when the src changes or on replay
            this.video.removeAttribute('muted');
        }
    },

    resize(width, height, stretching) {
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
                objectFit,
                width: null,
                height: null
            });
        }
        return false;
    },

    getContainer() {
        return this.container;
    },

    setContainer(element) {
        this.container = element;
        if (this.video.parentNode !== element) {
            element.appendChild(this.video);
        }
    },

    remove() {
        this.stop();
        this.destroy();
        const container = this.container;
        if (container && container === this.video.parentNode) {
            container.removeChild(this.video);
        }
    },

    atEdgeOfLiveStream() {
        if (!this.isLive()) {
            return false;
        }

        // currentTime doesn't always get to the end of the buffered range
        const timeFudge = 2;
        return (endOfRange(this.video.buffered) - this.video.currentTime) <= timeFudge;
    }
};

export default VideoActionsMixin;
