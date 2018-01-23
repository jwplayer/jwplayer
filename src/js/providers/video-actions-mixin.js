import { style, transform } from 'utils/css';
import { Browser, OS } from 'environment/environment'; 

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
        let _videotag = this.video;
        const fitVideoUsingTransforms = Browser.ie || (OS.iOS && OS.version.major < 9) || Browser.androidNative;
        let styles = {
            objectFit: null,
            width: null,
            height: null,
        };
        if (stretching === 'uniform' && !fitVideoUsingTransforms) {
            // snap video to edges when the difference in aspect ratio is less than 9%
            let playerAspectRatio = width / height;
            let videoAspectRatio = _videotag.videoWidth / _videotag.videoHeight;
            if (Math.abs(playerAspectRatio - videoAspectRatio) < 0.09) {
                styles.objectFit = 'fill';
            }
        }
        if (fitVideoUsingTransforms) {
            const x = -Math.floor(_videotag.videoWidth / 2 + 1);
            const y = -Math.floor(_videotag.videoHeight / 2 + 1);
            let scaleX = Math.ceil(width * 100 / _videotag.videoWidth) / 100;
            let scaleY = Math.ceil(height * 100 / _videotag.videoHeight) / 100;
            if (stretching === 'none') {
                scaleX = scaleY = 1;
            } else if (stretching === 'fill') {
                scaleX = scaleY = Math.max(scaleX, scaleY);
            } else if (stretching === 'uniform') {
                scaleX = scaleY = Math.min(scaleX, scaleY);
            }
            styles.width = _videotag.videoWidth;
            styles.height = _videotag.videoHeight;
            styles.top = styles.left = '50%';
            styles.margin = 0;
            transform(_videotag,
                'translate(' + x + 'px, ' + y + 'px) scale(' + scaleX.toFixed(2) + ', ' + scaleY.toFixed(2) + ')');
        } 
        style(_videotag, styles);
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

