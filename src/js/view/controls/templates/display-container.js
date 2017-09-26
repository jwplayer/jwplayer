import displayIconTemplate from 'view/controls/templates/display-icon';

export default (localization) => {
    return (
        `<div class="jw-display jw-reset">` +
            `<div class="jw-display-container jw-reset">` +
                `<div class="jw-display-controls jw-reset">` +
                    displayIconTemplate('rewind', localization.rewind) +
                    displayIconTemplate('display', localization.playback) +
                    displayIconTemplate('next', localization.next) +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
