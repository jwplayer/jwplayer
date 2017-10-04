export default (iconName = '', ariaLabel = '') => {
    return (
        `<div class="jw-display-icon-container jw-display-icon-${iconName}">` +
            `<div class="jw-icon jw-icon-${iconName} jw-button-color" role="button" tabindex="0" aria-label="${ariaLabel}"></div>` +
        `</div>`
    );
};
