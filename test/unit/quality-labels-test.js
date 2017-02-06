define([
    'utils/quality-labels',
    'utils/underscore',
], function (qualityLabels, _) {
    QUnit.module('quality-labels');
    var test = QUnit.test.bind(QUnit);

    var customLabels  = {
        1000: 'low',
        2000: 'medium',
        3000: 'high',
    };

    var bandwidths = _.keys(customLabels);

    QUnit.module('createLabel');
    test('creates a label using height when available', function (assert) {
        var expected = '360p';
        var actual = qualityLabels.createLabel(360, undefined, false);
        assert.equal(actual, expected);
    });

    test('creates a label using bandwidth when height is not available', function (assert) {
        var expected = '1337 kbps';
        var actual = qualityLabels.createLabel(undefined, 1337000,  false);
        assert.equal(actual, expected);
    });

    test('does not add parentheses to bandwidth when redundant is true and height is not available', function (assert) {
        var expected = '1337 kbps';
        var actual = qualityLabels.createLabel(undefined, 1337000,  true);
        assert.equal(actual, expected);
    });

    test('includes bandwidth string when redundant argument is true', function (assert) {
        var expected = '360p (1337 kbps)';
        var actual = qualityLabels.createLabel(360, 1337000, true);
        assert.equal(actual, expected);
    });

    test('returns an empty string when height and bandwidth are not available', function (assert) {
        var expected = '';
        var actual = qualityLabels.createLabel(undefined, undefined, false);
        assert.equal(actual, expected);
    });

    QUnit.module('getCustomLabel');
    test('gets custom label when bandwidth exactly matches a key', function (assert) {
        var expected = 'medium';
        var actual = qualityLabels.getCustomLabel(customLabels, 2000000);
        assert.equal(actual, expected);
    });

    test('gets custom label when bandwidth rounds to a key', function (assert) {
       var expected = 'medium';
       var actual = qualityLabels.getCustomLabel(customLabels, 2000004);
       assert.equal(actual, expected);
    });

    test('retuns null when no custom labels are given', function (assert) {
        var expected = null;
        var actual = qualityLabels.getCustomLabel(null, 4000000);
        assert.equal(actual, expected);
    });

    test('retuns null when custom labels are empty', function (assert) {
        var expected = null;
        var actual = qualityLabels.getCustomLabel({}, 4000000);
        assert.equal(actual, expected);
    });

    test('retuns null when bandwidth is undefined', function (assert) {
        var expected = null;
        var actual = qualityLabels.getCustomLabel(customLabels, undefined);
        assert.equal(actual, expected);
    });

    QUnit.module('findClosestBandwidth');
    test('retuns null when no bandwidths are given', function (assert) {
        var expected = null;
        var actual = qualityLabels.findClosestBandwidth([], 4000);
        assert.equal(actual, expected);
    });

    test('returns null when bandwidths are not an array', function (assert) {
        var expected = null;
        var actual = qualityLabels.findClosestBandwidth({medium: 4000}, 4000);
        assert.equal(actual, expected);
    });

    test('finds the quality label with closest to the target bandwidth when between two bandwidths', function (assert) {
        var expected = 2000;
        var actual = qualityLabels.findClosestBandwidth(bandwidths, 2200);
        assert.equal(actual, expected);
    });

    test('finds the quality label closest to the target bandwidth when exactly matching a bandwidth', function (assert) {
        var expected = 1000;
        var actual = qualityLabels.findClosestBandwidth(bandwidths, 1000);
        assert.equal(actual, expected);
    });

    test('chooses the top label when the target bandwidth is greater than every bandwidth', function (assert) {
        var expected =  3000;
        var actual = qualityLabels.findClosestBandwidth(bandwidths, 9999999);
        assert.equal(actual, expected);
    });

    test('chooses the lowest label when the target bandwidth is less than every bandwidth', function (assert) {
        var expected = 1000;
        var actual = qualityLabels.findClosestBandwidth(bandwidths, 1);
        assert.equal(actual, expected);
    });

    QUnit.module('toKbps');
    test('should be 0 if 0 bps', function (assert) {
        var expected = 0;
        var actual = qualityLabels.toKbps(0);
        assert.equal(actual, expected);
    });

    test('should be 0 if less than 1 kbps', function (assert) {
        var expected = 0;
        var actual = qualityLabels.toKbps(999);
        assert.equal(actual, expected);
    });

    test('should convert bps to kbps', function (assert) {
        var expected = 3;
        var actual = qualityLabels.toKbps(3000);
        assert.equal(actual, expected);
    });
});
