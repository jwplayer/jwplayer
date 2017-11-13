import { version } from 'version';
import { getScriptPath, versionCheck } from 'utils/playerutils';

describe('playerutils', function() {

    it('versionCheck with valid version', function() {
        const versionRequirementMet = versionCheck('0.5');
        expect(versionRequirementMet).to.be.true;
    });

    it('versionCheck with invalid version', function() {
        const versionRequirementMet = versionCheck('99.1');
        expect(versionRequirementMet).to.be.false;
    });

    it('versionCheck with higher version', function() {
        const jParts = version.split(/\W/);
        const jMajor = parseFloat(jParts[0]);
        const jMinor = parseFloat(jParts[1]);
        const versionRequirementMet = versionCheck(jMajor + ' ' + (jMinor + 1));
        expect(versionRequirementMet).to.be.false;
    });

    it('getScriptPath returns an empty string when no file name is provided', function() {
        const path = getScriptPath(null);
        expect(path).to.equal('');
    });

    it('getScriptPath returns a directory url ending with a forward slash', function() {
        const scriptPath = getScriptPath('sinon.js');
        expect(/\S+\:\/\/.+\/$/.test(scriptPath), ' for "sinon.js" returned "' + scriptPath + '"').to.be.true;
    });
});
