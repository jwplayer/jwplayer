define([
    'utils/constants',
    'utils/underscore',
    'utils/validator',
    'utils/parser',
    'version'
], function(Constants, _, validator, parser, version) {
    var playerUtils = {};

    /** Gets the repository location **/
    playerUtils.repo = _.memoize(function () {
        if (__SELF_HOSTED__) {
            return parser.getScriptPath('jwplayer.js');
        }

        var semver = version.split('+')[0];
        var repo = Constants.repo + semver + '/';
        if (validator.isHTTPS()) {
            return repo.replace(/^http:/, 'https:');
        }
        return repo;
    });

    // Is the player at least a minimum required version?
    playerUtils.versionCheck = function (target) {
        var tParts = ('0' + target).split(/\W/);
        var jParts = version.split(/\W/);
        var tMajor = parseFloat(tParts[0]);
        var jMajor = parseFloat(jParts[0]);
        if (tMajor > jMajor) {
            return false;
        } else if (tMajor === jMajor) {
            if (parseFloat('0' + tParts[1]) > parseFloat(jParts[1])) {
                return false;
            }
        }
        return true;
    };

    playerUtils.loadFrom = function () {
        if (__DEBUG__ || __SELF_HOSTED__) {
            return parser.getScriptPath('jwplayer.js');
        }
        return playerUtils.repo();
    };

    return playerUtils;
});
