export default (id, ariaLabel = '', floatingPlayer) => {

    const inner = getInnerTemplate(id, ariaLabel, floatingPlayer);
    const wrapperOpen = floatingPlayer ? `<div id="${id}" class="jw-container jw-reset">` : '';
    const wrapperClose = floatingPlayer ? '</div>' : '';
    return (
        wrapperOpen + inner + wrapperClose
    );
};

function getInnerTemplate(id, ariaLabel, floatingPlayer) {
        return `<div id="${floatingPlayer ? '' : id}" class="jwplayer jw-reset jw-state-setup" tabindex="0" aria-label="${ariaLabel}" role="application">` +
        `<div class="jw-aspect jw-reset"></div>` +
        `<div class="jw-media jw-reset"></div>` +
        `<div class="jw-preview jw-reset"></div>` +
        `<div class="jw-title jw-reset">` +
        `<div class="jw-title-primary jw-reset"></div>` +
        `<div class="jw-title-secondary jw-reset"></div>` +
        `</div>` +
        `<div class="jw-overlays jw-reset"></div>` +
        `</div>`;
}
