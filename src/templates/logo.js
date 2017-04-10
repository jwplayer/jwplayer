export default (config) => {
    // jw-hide causes the logo to fade out when jw-flag-user-inactive
    const jwhide = config.hide ? ' jw-hide' : '';
    return `<div class="jw-logo jw-logo-${config.position}${jwhide} jw-reset"></div>`;
};
