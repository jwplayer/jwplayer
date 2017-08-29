import { version } from 'version';
import { getScriptPath, versionCheck } from 'utils/playerutils';

describe('playerutils', function() {

    it('versionCheck with valid version', function() {
        const versionRequirementMet = versionCheck('0.5');
        assert.isOk(versionRequirementMet);
    });

    it('versionCheck with invalid version', function() {
        const versionRequirementMet = versionCheck('99.1');
        assert.isNotOk(versionRequirementMet);
    });

    it('versionCheck with higher version', function() {
        const jParts = version.split(/\W/);
        const jMajor = parseFloat(jParts[0]);
        const jMinor = parseFloat(jParts[1]);
        const versionRequirementMet = versionCheck(jMajor + ' ' + (jMinor + 1));
        assert.isNotOk(versionRequirementMet);
    });

    it('getScriptPath returns an empty string when no file name is provided', function() {
        const path = getScriptPath(null);
        assert.equal(path, '');
    });

    it('getScriptPath returns a directory url ending with a forward slash', function() {
        const scriptPath = getScriptPath('sinon.js');
        assert.isOk(/\S+\:\/\/.+\/$/.test(scriptPath), ' for "sinon.js" returned "' + scriptPath + '"');
    });
});
