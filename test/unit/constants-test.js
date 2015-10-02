define([
    'utils/constants'
], function (constants) {
    /* jshint qunit: true */

    module('constants');

    test('constants', function(assert) {
        assert.equal(typeof constants.repo, 'string');

        for (var i = 0; i < constants.SkinsIncluded.length; i++) {
            assert.equal(typeof constants.SkinsIncluded[i], 'string');
        }

        for (var j = 0; j < constants.SkinsLoadable.length; j++) {
            assert.equal(typeof constants.SkinsLoadable[j], 'string');
        }

    });
});