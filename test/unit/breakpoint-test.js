define([
    'utils/helpers',
    'view/breakpoint'
], function (utils, breakpoint) {
    /* jshint qunit: true */
    QUnit.module('browser');
    var test = QUnit.test.bind(QUnit);

    function breakpointClassname(width, height) {
        var mockPlayer = utils.createElement();
        breakpoint(mockPlayer, width, height);
        return mockPlayer.className;
    }

    test('width >= 1280 sets jw-breakpoint-7', function (assert) {
        assert.expect(1);
        assert.equal(breakpointClassname(1280), 'jw-breakpoint-7');
    });

    test('width >= 960 sets jw-breakpoint-6', function (assert) {
        assert.expect(1);
        assert.equal(breakpointClassname(960), 'jw-breakpoint-6');
    });

    test('width >= 800 sets jw-breakpoint-5', function (assert) {
        assert.expect(1);
        assert.equal(breakpointClassname(800), 'jw-breakpoint-5');
    });

    test('width >= 640 sets jw-breakpoint-4', function (assert) {
        assert.expect(1);
        assert.equal(breakpointClassname(640), 'jw-breakpoint-4');
    });

    test('width >= 540 sets jw-breakpoint-3', function (assert) {
        assert.expect(1);
        assert.equal(breakpointClassname(540), 'jw-breakpoint-3');
    });

    test('width >= 420 sets jw-breakpoint-2', function (assert) {
        assert.expect(1);
        assert.equal(breakpointClassname(420), 'jw-breakpoint-2');
    });

    test('width >= 320 sets jw-breakpoint-1', function (assert) {
        assert.expect(1);
        assert.equal(breakpointClassname(320), 'jw-breakpoint-1');
    });

    test('width < 320 sets jw-breakpoint-0', function (assert) {
        assert.expect(1);
        assert.equal(breakpointClassname(319), 'jw-breakpoint-0');
    });

    test('if height > width jw-orientation-portrait is set', function (assert) {
        assert.expect(1);
        assert.equal(breakpointClassname(319, 320), 'jw-breakpoint-0 jw-orientation-portrait');
    })
});
