export default (id, skin = '', title = '', body = '') => {
    return (
        `<div id="${id}" class="jw-skin-${skin} jw-error jw-reset">` +
            `<div class="jw-title jw-reset">` +
                `<div class="jw-title-primary jw-reset">${title}</div>` +
                `<div class="jw-title-secondary jw-reset">${body}</div>` +
            `</div>` +
            `<div class="jw-display-container jw-reset">` +
                `<div class="jw-display-icon-container jw-background-color jw-reset">` +
                    `<div class="jw-icon jw-icon-display jw-reset" aria-hidden="true"></div>` +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
