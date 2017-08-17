import CLOSE_ICON from 'assets/SVG/close.svg';

export default (header = '', title = '', closeAriaLabel = '') => {
    return (
        `<div class="jw-nextup jw-reset">` +
             `<div class="jw-nextup-tooltip jw-reset">` +
                `<div class="jw-nextup-header jw-reset">${header}</div>` +
                `<div class="jw-nextup-body jw-background-color jw-reset">` +
                    `<div class="jw-nextup-thumbnail jw-reset"></div>` +
                    `<div class="jw-nextup-title jw-reset">${title}</div>` +
                `</div>` +
            `</div>` +
            `<button class="jw-icon jw-nextup-close jw-reset" aria-label="${closeAriaLabel}">${CLOSE_ICON}</button>` +
        `</div>`
    );
};
