define([
    'utils/stream-time',
], function (streamTimeUtils) {
    QUnit.module('stream-time util');
    var test = QUnit.test.bind(QUnit);

    test('calculates the rewind position for a VOD', function (assert) {
        var expected = 1;
        var actual = streamTimeUtils.rewindPosition(10, 11, 20, 'VOD');
        assert.equal(actual, expected);
    });

    test('rewinds to a minimum of 0 for a VOD', function (assert) {
        var expected = 0;
        var actual = streamTimeUtils.rewindPosition(10, 1, 3000, 'VOD');
        assert.equal(actual, expected);
    });

    test('calculates the rewind position for a DVR as the distance from the seekableRange', function (assert) {
        var expected = 290;
        var actual = streamTimeUtils.rewindPosition(10, 20, 300, 'DVR');
        assert.equal(actual, expected);
    });

    test('rewinds to a minium of seekableRange for a DVR', function (assert) {
        var expected = 300;
        var actual = streamTimeUtils.rewindPosition(10, 5, 300, 'DVR');
        assert.equal(actual, expected);
    });

    test('returns 0 for Live', function (assert) {
        var expected = 0;
        var actual = streamTimeUtils.rewindPosition(10, 11, 300, 'LIVE');
        assert.equal(actual, expected);
    });
});