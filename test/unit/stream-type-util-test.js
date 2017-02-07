define([
    'utils/stream-type'
], function (streamTypeUtil) {
    /* jshint qunit: true */
    QUnit.module('stream-type');
    var test = QUnit.test.bind(QUnit);

    var minDvrWindow = 120;
    var dvrSeekableRange = 120;
    var liveSeekableRange = 0;

    test('chooses the correct stream type based on duration, seekableRange, and minDvrWindow', function(assert) {
        var type = streamTypeUtil.streamType(0, dvrSeekableRange, minDvrWindow);
        assert.equal(type, 'VOD');

        type = streamTypeUtil.streamType(0, dvrSeekableRange, 0);
        assert.equal(type, 'VOD');

        type = streamTypeUtil.streamType(10, dvrSeekableRange, minDvrWindow);
        assert.equal(type, 'VOD');

        type = streamTypeUtil.streamType(10, dvrSeekableRange, undefined);
        assert.equal(type, 'VOD');

        type = streamTypeUtil.streamType(Infinity, dvrSeekableRange, minDvrWindow);
        assert.equal(type, 'DVR');

        type = streamTypeUtil.streamType(Infinity, dvrSeekableRange, -10);
        assert.equal(type, 'DVR');

        type = streamTypeUtil.streamType(Infinity, dvrSeekableRange, 0);
        assert.equal(type, 'DVR');

        type = streamTypeUtil.streamType(Infinity, dvrSeekableRange, undefined);
        assert.equal(type, 'DVR');

        type = streamTypeUtil.streamType(Infinity, liveSeekableRange, minDvrWindow);
        assert.equal(type, 'LIVE');

        type = streamTypeUtil.streamType(Infinity, liveSeekableRange, undefined);
        assert.equal(type, 'LIVE');
    });
})