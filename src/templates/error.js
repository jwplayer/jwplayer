export default (id, title = '', body = '') => {
    return (
        `<div id="${id}" class="jw-error jw-reset">` +
            `<div class="jw-title jw-reset" style="font-size:16px;color:#fff;">` +
                `<div class="jw-title-primary jw-reset" style="padding:.75em 1.5em;">${title}</div>` +
                `<div class="jw-title-secondary jw-reset">${body}</div>` +
            `</div>` +
            `<div class="jw-display-container jw-reset">` +
                `<div class="jw-display-icon-container jw-reset">` +
                    `<div class="jw-icon jw-icon-display jw-reset" aria-hidden="true"></div>` +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
