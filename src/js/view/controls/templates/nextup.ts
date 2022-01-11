import type { HTMLTemplateString } from 'types/generic.type';
import { Browser } from 'environment/environment';

export default (header = '', title = '', duration = '', closeAriaLabel = ''): HTMLTemplateString => {
    // When using firefox this adds opacity to stop the firefox PiP button getting clicked instead of the next up div
    const firefoxPipFix = Browser.firefox ? ' jw-nextup-firefox-pip-fix' : '';

    return (
        `<div class="jw-nextup jw-background-color jw-reset${firefoxPipFix}">` +
                `<div class="jw-nextup-tooltip jw-reset">` +
                `<div class="jw-nextup-thumbnail jw-reset"></div>` +
                `<div class="jw-nextup-body jw-reset">` +
                    `<div class="jw-nextup-header jw-reset">${header}</div>` +
                    `<div class="jw-nextup-title jw-reset-text" dir="auto">${title}</div>` +
                    `<div class="jw-nextup-duration jw-reset">${duration}</div>` +
                `</div>` +
            `</div>` +
            `<button type="button" class="jw-icon jw-nextup-close jw-reset" aria-label="${closeAriaLabel}"></button>` +
        `</div>`
    );
};
