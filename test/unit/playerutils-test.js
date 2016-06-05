define([
    'utils/playerutils',
    'version'
], function (playerutils, version) {
    /* jshint qunit: true */

    QUnit.module('playerutils');

    QUnit.test('playerutils.versionCheck', function(assert) {
        var versionCheck = playerutils.versionCheck('0.5');
        assert.ok(versionCheck, 'playerutils.versionCheck with valid version');

        versionCheck = playerutils.versionCheck('99.1');
        assert.notOk(versionCheck, 'playerutils.versionCheck with invalid version');

        var jParts = version.split(/\W/);
        var jMajor = parseFloat(jParts[0]);
        var jMinor = parseFloat(jParts[1]);

        versionCheck = playerutils.versionCheck(jMajor + ' ' + (jMinor + 1));
        assert.notOk(versionCheck, 'playerutils.versionCheck with higher version');
    });

});