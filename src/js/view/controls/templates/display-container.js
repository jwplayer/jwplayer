import displayIconTemplate from 'view/controls/templates/display-icon';

export default (localization) => {
    return (
        `<div class="jw-display">` +
            `<div class="jw-display-container">` +
                `<div class="jw-display-controls">` +
                    displayIconTemplate('rewind', localization.rewind) +
                    displayIconTemplate('display', localization.playback) +
                    displayIconTemplate('next', localization.next) +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
