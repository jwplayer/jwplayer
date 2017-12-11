import { style } from 'utils/css';
import { Browser, OS } from 'environment/environment';
import fitToBounds from '../utils/fit-to-bounds';

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
        const fitVideoUsingTransforms = Browser.ie || (OS.iOS && OS.version.major < 9) || Browser.androidNative;        
        if ((!width || !height || !this.video.videoWidth || !this.video.videoHeight) && !fitVideoUsingTransforms) {
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
            var videoAspectRatio = this.video.videoWidth / this.video.videoHeight;
            if (Math.abs(playerAspectRatio - videoAspectRatio) < 0.09) {
                styles.objectFit = 'fill';
                stretching = 'exactfit';
            }
        }
        if (fitVideoUsingTransforms && !this.video.videoWidth < width && !this.video.videoHeight < height) {
            fitToBounds(this.video, width, height, stretching, styles);  
        } 
        style(this.video, styles);
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
