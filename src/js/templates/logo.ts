export default (position: string, hide: boolean): string => {
    const jwhide = hide ? ' jw-hide' : '';
    return `<div class="jw-logo jw-logo-${position}${jwhide} jw-reset"></div>`;
};
