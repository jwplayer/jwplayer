export default (description = '', closeAriaLabel = '') => {
    return (
        `<div class="jw-interface jw-background-color jw-reset">` +
            `<div class="jw-interface-tooltip jw-reset">` +
                 `<div class="jw-interface-thumbnail jw-reset"></div>` +
                `<div class="jw-interface-body jw-reset">` +
                    `<div class="jw-interface-description jw-reset">${description}</div>` +
                `</div>` +
            `</div>` +
            `<button type="button" class="jw-icon jw-interface-close jw-reset" aria-label="${closeAriaLabel}"></button>` +
        `</div>`
    );
};
