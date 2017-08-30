import { version } from 'version';

export const getScriptPath = function(scriptName) {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src;
        if (src) {
            const index = src.lastIndexOf('/' + scriptName);
            if (index >= 0) {
                return src.substr(0, index + 1);
            }
        }
    }
    return '';
};

/** Gets the repository location **/
export const repo = function () {
    if (__SELF_HOSTED__) {
        return getScriptPath('jwplayer.js');
    }

    const playerRepo = __REPO__;
    const protocol = (playerRepo && window.location.protocol === 'file:') ? 'https:' : '';
    return `${protocol}${playerRepo}`;
};

// Is the player at least a minimum required version?
export const versionCheck = function (target) {
    const tParts = ('0' + target).split(/\W/);
    const jParts = version.split(/\W/);
    const tMajor = parseFloat(tParts[0]);
    const jMajor = parseFloat(jParts[0]);
    if (tMajor > jMajor) {
        return false;
    } else if (tMajor === jMajor) {
        if (parseFloat('0' + tParts[1]) > parseFloat(jParts[1])) {
            return false;
        }
    }
    return true;
};

export const loadFrom = function () {
    if (__DEBUG__ || __SELF_HOSTED__) {
        return getScriptPath('jwplayer.js');
    }
    return repo();
};
