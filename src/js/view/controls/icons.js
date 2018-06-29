import BUFFER_ICON from 'assets/SVG/buffer.svg';
import REPLAY_ICON from 'assets/SVG/replay.svg';
import ERROR_ICON from 'assets/SVG/playback-error.svg';
import PLAY_ICON from 'assets/SVG/play.svg';
import PAUSE_ICON from 'assets/SVG/pause.svg';
import REWIND_ICON from 'assets/SVG/rewind-10.svg';
import NEXT_ICON from 'assets/SVG/next.svg';
import STOP_ICON from 'assets/SVG/stop.svg';
import VOLUME_ICON_0 from 'assets/SVG/volume-0.svg';
import VOLUME_ICON_50 from 'assets/SVG/volume-50.svg';
import VOLUME_ICON_100 from 'assets/SVG/volume-100.svg';
import CAPTIONS_ON_ICON from 'assets/SVG/captions-on.svg';
import CAPTIONS_OFF_ICON from 'assets/SVG/captions-off.svg';
import AIRPLAY_ON_ICON from 'assets/SVG/airplay-on.svg';
import AIRPLAY_OFF_ICON from 'assets/SVG/airplay-off.svg';
import PLAYBACK_RATE_ICON from 'assets/SVG/playback-rate.svg';
import SETTINGS_ICON from 'assets/SVG/settings.svg';
import AUDIO_TRACKS_ICON from 'assets/SVG/audio-tracks.svg';
import QUALITY_ICON from 'assets/SVG/quality-100.svg';
import FULLSCREEN_EXIT_ICON from 'assets/SVG/fullscreen-not.svg';
import FULLSCREEN_ENTER_ICON from 'assets/SVG/fullscreen.svg';
import CLOSE_ICON from 'assets/SVG/close.svg';
import JW_LOGO from 'assets/SVG/jw-logo.svg';
import { createElement } from 'utils/dom';

let collection = null;

export function cloneIcon(name) {
    if (name === 'error') {
        return createElement(ERROR_ICON);
    }
    const icon = document.getElementById('jw-svg-icon-' + name);
    if (icon) {
        return createSVGElement(icon.id);
    }
    if (__DEBUG__) {
        throw new Error('Icon not found: ' + name);
    }
    return null;
}

export function cloneIcons(names) {
    const icons = document.querySelectorAll(names.split(',').map(i => '#jw-svg-icon-' + i).join(','));
    if (__DEBUG__ && !icons.length) {
        throw new Error('Icons not found: ' + names);
    }
    return Array.prototype.map.call(icons, icon => createSVGElement(icon.id));
}

function createSVGElement(id) {
    // The spaces around the <use> element fix a bug in Safari 10 https://allyjs.io/tutorials/focusing-in-svg.html#the-use-element
    return createElement(`<svg class="jw-svg-icon ${id}" focusable="false" viewBox="0 0 240 240"> <use href="#${id}" /> </svg>`);
}

export function getCollection() {
    if (!collection) {
        collection = parseCollection();
    }
    return collection;
}

function parseCollection() {
    let spriteSheet = [
        BUFFER_ICON,
        REPLAY_ICON,
        ERROR_ICON,
        PLAY_ICON,
        PAUSE_ICON,
        REWIND_ICON,
        NEXT_ICON,
        STOP_ICON,
        VOLUME_ICON_0,
        VOLUME_ICON_50,
        VOLUME_ICON_100,
        CAPTIONS_ON_ICON,
        CAPTIONS_OFF_ICON,
        AIRPLAY_ON_ICON,
        AIRPLAY_OFF_ICON,
        PLAYBACK_RATE_ICON,
        SETTINGS_ICON,
        AUDIO_TRACKS_ICON,
        QUALITY_ICON,
        FULLSCREEN_EXIT_ICON,
        FULLSCREEN_ENTER_ICON,
        CLOSE_ICON,
        JW_LOGO
    ].map(s => {
        // Remove any IDs that are already on the page
        let id = s.match(/id="([-\w]+)"/);
        if (id.length) {
            const customIcon = document.getElementById(id[1]);
            if (customIcon) {
                return false;
            }
        }

        // Replace svg tag with symbol
        s = s.replace(/(<\/?)svg/g, '$1symbol');
        // remove xmlns and add default viewBox
        s = s.replace(/(xmlns="[\w/.:]*")/g, 'viewBox="0 0 240 240"');
        return s;

    }).filter(Boolean).join('');
    return createElement(`<svg id="jw-icons" style="display:none">${spriteSheet}</svg>`);
}
