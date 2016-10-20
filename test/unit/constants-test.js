define([
    'utils/constants'
], function (constants) {
    /* jshint qunit: true */

    QUnit.module('constants');

    QUnit.test('constants', function(assert) {
        assert.equal(typeof constants.repo, 'string', 'constants.repo is a string');

        for (var i = 0; i < constants.SkinsIncluded.length; i++) {
            var skinIncluded = constants.SkinsIncluded[i];
            assert.equal(typeof skinIncluded, 'string', 'Player configured to include "'+ skinIncluded +'" skin');
        }

        for (var j = 0; j < constants.SkinsLoadable.length; j++) {
            var loadsSkin = constants.SkinsLoadable[j];
            assert.equal(typeof loadsSkin, 'string', 'Player configured to load "'+ loadsSkin +'" skin');
        }

    });
});