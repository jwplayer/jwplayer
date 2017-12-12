import { style } from 'utils/css';
import fitToBounds, { fitVideoUsingTransforms } from 'utils/fit-to-bounds';

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
        const _videotag = this.video; 
        if ((!width || !height || !_videotag.videoWidth || !_videotag.videoHeight) && !fitVideoUsingTransforms) {
            return false;
        }
        const styles = {
            objectFit: '',
            width: '',
            height: '',
        };
        if (stretching === 'uniform') {
            // snap video to edges when the difference in aspect ratio is less than 9%
            var playerAspectRatio = width / height;
            var videoAspectRatio = _videotag.videoWidth / _videotag.videoHeight;
            if (Math.abs(playerAspectRatio - videoAspectRatio) < 0.09) {
                styles.objectFit = 'fill';
                stretching = 'exactfit';
            }
        }
        if (fitVideoUsingTransforms && _videotag.videoWidth < width && _videotag.videoHeight < height) {
            fitToBounds(_videotag, width, height, stretching, styles);  
        } 
        style(_videotag, styles);
        return false;
    },

    getContainer: function() {
        return this.container;
    },

    setContainer: function(element) {
        this.container = element;
        if (this.video.parentNode !== element) {
            element.appendChild(this.video);
        }
    },

    remove: function() {
        this.stop();
        this.destroy();
        const container = this.container;
        if (container && container === this.video.parentNode) {
            container.removeChild(this.video);
        }
    }
};

export default VideoActionsMixin;
