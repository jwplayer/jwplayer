export default (id, ariaLabel = '') => {
    return (
        `<div id="${id}" class="jwplayer jw-reset jw-state-setup" tabindex="0" aria-label="${ariaLabel}" role="application">` +
            `<div class="jw-wrapper jw-reset">` +
                `<div class="jw-aspect jw-reset"></div>` +
                `<div class="jw-media jw-reset"></div>` +
                `<div class="jw-preview jw-reset"></div>` +
                `<div class="jw-title jw-reset">` +
                    `<div class="jw-title-primary jw-reset"></div>` +
                    `<div class="jw-title-secondary jw-reset"></div>` +
                `</div>` +
                `<div class="jw-overlays jw-reset"></div>` +
            `</div>` +
        `</div>`
    );
};
