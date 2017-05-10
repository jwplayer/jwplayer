import { getBreakpoint, setBreakpoint } from 'view/utils/breakpoint';

define([
    'utils/helpers',
], function (utils) {
    QUnit.module('browser');
    var test = QUnit.test.bind(QUnit);

    test('width >= 1280 returns breakpoint 7', function (assert) {
        assert.expect(1);
        assert.equal(getBreakpoint(1280), 7);
    });

    test('width >= 960 returns breakpoint 6', function (assert) {
        assert.expect(1);
        assert.equal(getBreakpoint(960), 6);
    });

    test('width >= 800 returns breakpoint 5', function (assert) {
        assert.expect(1);
        assert.equal(getBreakpoint(800), 5);
    });

    test('width >= 640 returns breakpoint 4', function (assert) {
        assert.expect(1);
        assert.equal(getBreakpoint(640), 4);
    });

    test('width >= 540 returns breakpoint 3', function (assert) {
        assert.expect(1);
        assert.equal(getBreakpoint(540), 3);
    });

    test('width >= 420 returns breakpoint 2', function (assert) {
        assert.expect(1);
        assert.equal(getBreakpoint(420), 2);
    });

    test('width >= 320 returns breakpoint 1', function (assert) {
        assert.expect(1);
        assert.equal(getBreakpoint(320), 1);
    });

    test('width < 320 returns breakpoint 0', function (assert) {
        assert.expect(1);
        assert.equal(getBreakpoint(319), 0);
    });
});
