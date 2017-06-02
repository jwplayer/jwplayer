export default (defaultIconElement) => {
    return (
        `<div class="jw-selection-menu-icon-container">` +
            `<div class="jw-menu-selection-icon jw-reset">${defaultIconElement}</div>` +
            `<div class="jw-menu-selection-text jw-reset"></div>` +
        `</div>`
    );
};
