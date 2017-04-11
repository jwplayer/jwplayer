export default (position, hide) => {
    // jw-hide causes the logo to fade out when jw-flag-user-inactive
    const jwhide = hide ? ' jw-hide' : '';
    return `<div class="jw-logo jw-logo-${position}${jwhide} jw-reset"></div>`;
};
