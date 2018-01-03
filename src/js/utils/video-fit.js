import { transform } from 'utils/css';
import { Browser, OS } from 'environment/environment'; 

export const fitVideoUsingTransforms = Browser.ie || (OS.iOS && OS.version.major < 9) || Browser.androidNative;

export function fitToBounds(_videotag, width, height, stretching, styles) {
    // Use transforms to center and scale video in container
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
    return styles;
}
