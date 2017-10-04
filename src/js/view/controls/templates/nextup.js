export default (header = '', title = '', duration = '', closeAriaLabel = '') => {
    return (
        `<div class="jw-nextup jw-background-color">` +
             `<div class="jw-nextup-tooltip">` +
                `<div class="jw-nextup-thumbnail"></div>` +
                `<div class="jw-nextup-body">` +
                    `<div class="jw-nextup-header">${header}</div>` +
                    `<div class="jw-nextup-title">${title}</div>` +
                    `<div class="jw-nextup-duration">${duration}</div>` +
                `</div>` +
            `</div>` +
            `<button type="button" class="jw-icon jw-nextup-close" aria-label="${closeAriaLabel}"></button>` +
        `</div>`
    );
};
