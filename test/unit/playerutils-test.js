import { version } from 'version';
import * as playerutils from 'utils/playerutils';

describe('playerutils', function() {

    it('playerutils.versionCheck', function() {
        var versionCheck = playerutils.versionCheck('0.5');
        assert.isOk(versionCheck, 'playerutils.versionCheck with valid version');

        versionCheck = playerutils.versionCheck('99.1');
        assert.isNotOk(versionCheck, 'playerutils.versionCheck with invalid version');

        var jParts = version.split(/\W/);
        var jMajor = parseFloat(jParts[0]);
        var jMinor = parseFloat(jParts[1]);

        versionCheck = playerutils.versionCheck(jMajor + ' ' + (jMinor + 1));
        assert.isNotOk(versionCheck, 'playerutils.versionCheck with higher version');
    });
});
