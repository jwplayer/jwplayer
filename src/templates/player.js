export default (id, ariaLabel = '') => {
    return (
        `<div id="${id}" class="jwplayer jw-reset jw-state-setup" tabindex="0" aria-label="${ariaLabel}">` +
            `<div class="jw-aspect"></div>` +
            `<div class="jw-media"></div>` +
            `<div class="jw-preview"></div>` +
            `<div class="jw-title">` +
                `<div class="jw-title-primary"></div>` +
                `<div class="jw-title-secondary"></div>` +
            `</div>` +
            `<div class="jw-overlays"></div>` +
        `</div>`
    );
};

