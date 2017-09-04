import displayIconTemplate from 'view/controls/templates/display-icon';
import REWIND_ICON from 'assets/SVG/rewind-10.svg';
import PLAY_ICON from 'assets/SVG/play.svg';
import PAUSE_ICON from 'assets/SVG/pause.svg';
import BUFFER_ICON from 'assets/SVG/buffer.svg';
import REPLAY_ICON from 'assets/SVG/replay.svg';
import ERROR_ICON from 'assets/SVG/playback-error.svg';
import NEXT_ICON from 'assets/SVG/next.svg';

export default (localization) => {
    return (
        `<div class="jw-display jw-reset">` +
            `<div class="jw-display-container jw-reset">` +
                `<div class="jw-display-controls jw-reset">` +
                    displayIconTemplate('rewind', localization.rewind, REWIND_ICON) +
                    displayIconTemplate('display', localization.playback,
                        `${PLAY_ICON}${PAUSE_ICON}${BUFFER_ICON}${REPLAY_ICON}${ERROR_ICON}`) +
                    displayIconTemplate('next', localization.next, NEXT_ICON) +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
