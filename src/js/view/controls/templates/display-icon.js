export default (iconName = '', ariaLabel = '') => {
    return (
        `<div class="jw-display-icon-container jw-display-icon-${iconName} jw-reset">` +
            `<div class="jw-icon jw-icon-${iconName} jw-button-color jw-reset" role="button" tabindex="0" aria-label="${ariaLabel}"></div>` +
        `</div>`
    );
};
