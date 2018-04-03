import { Browser, OS } from 'environment/environment';
import { style, transform } from 'utils/css';
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
        const { video } = this;
        const { videoWidth, videoHeight } = video;
        if (!width || !height || !videoWidth || !videoHeight) {
            return;
        }
        const styles = {
            objectFit: '',
            width: '',
            height: ''
        };
        if (stretching === 'uniform') {
            // Snap video to edges when the difference in aspect ratio is less than 9% and perceivable
            const playerAspectRatio = width / height;
            const videoAspectRatio = videoWidth / videoHeight;
            const edgeMatch = Math.abs(playerAspectRatio - videoAspectRatio);
            if (edgeMatch < 0.09 && edgeMatch > 0.0025) {
                styles.objectFit = 'fill';
                stretching = 'exactfit';
            }
        }
        // Prior to iOS 9, object-fit worked poorly
        // object-fit is not implemented in IE or Android Browser in 4.4 and lower
        // http://caniuse.com/#feat=object-fit
        // feature detection may work for IE but not for browsers where object-fit works for images only
        const fitVideoUsingTransforms = Browser.ie || (OS.iOS && OS.version.major < 9) || Browser.androidNative;
        if (fitVideoUsingTransforms) {
            if (stretching !== 'uniform') {
                // Use transforms to center and scale video in container
                const x = -Math.floor(videoWidth / 2 + 0.9);
                const y = -Math.floor(videoHeight / 2 + 0.9);
                let scaleX = Math.ceil(width * 100 / videoWidth) / 100;
                let scaleY = Math.ceil(height * 100 / videoHeight) / 100;
                if (stretching === 'none') {
                    scaleX = scaleY = 1;
                } else if (stretching === 'fill') {
                    scaleX = scaleY = Math.max(scaleX, scaleY);
                } else if (stretching === 'uniform') {
                    scaleX = scaleY = Math.min(scaleX, scaleY);
                }
                styles.width = videoWidth;
                styles.height = videoHeight;
                styles.top = styles.left = '50%';
                styles.margin = 0;
                transform(video,
                    'translate(' + x + 'px, ' + y + 'px) scale(' + scaleX.toFixed(2) + ', ' + scaleY.toFixed(2) + ')');
            } else {
                styles.top = styles.left = styles.margin = '';
                transform(video, '');
            }
        }
        style(video, styles);
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
