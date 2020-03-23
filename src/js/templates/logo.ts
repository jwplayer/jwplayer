import type { HTMLTemplateString } from '../types/generic.type';

export default (position: string, hide: boolean): HTMLTemplateString => {
    const jwhide = hide ? ' jw-hide' : '';
    return `<div class="jw-logo jw-logo-${position}${jwhide} jw-reset"></div>`;
};
