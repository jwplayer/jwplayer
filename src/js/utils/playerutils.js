import { version } from 'version';
import _ from 'utils/underscore';
import { isHTTPS } from 'utils/validator';
import { getScriptPath } from 'utils/parser';

const REPO_URL = __REPO__;

/** Gets the repository location **/
export const repo = _.memoize(function () {
    if (__SELF_HOSTED__) {
        return getScriptPath('jwplayer.js');
    }

    const semver = version.split('+')[0];
    const playerRepo = REPO_URL + semver + '/';
    if (isHTTPS()) {
        return playerRepo.replace(/^http:/, 'https:');
    }
    return playerRepo;
});

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
