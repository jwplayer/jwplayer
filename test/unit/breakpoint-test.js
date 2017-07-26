import { getBreakpoint } from 'view/utils/breakpoint';

describe(('Breakpoint'), function() {
    it('width >= 1280 returns breakpoint 7', function() {
        assert.equal(getBreakpoint(1280), 7);
    });

    it('width >= 960 returns breakpoint 6', function() {
        assert.equal(getBreakpoint(960), 6);
    });

    it('width >= 800 returns breakpoint 5', function() {
        assert.equal(getBreakpoint(800), 5);
    });

    it('width >= 640 returns breakpoint 4', function() {
        assert.equal(getBreakpoint(640), 4);
    });

    it('width >= 540 returns breakpoint 3', function() {
        assert.equal(getBreakpoint(540), 3);
    });

    it('width >= 420 returns breakpoint 2', function() {
        assert.equal(getBreakpoint(420), 2);
    });

    it('width >= 320 returns breakpoint 1', function() {
        assert.equal(getBreakpoint(320), 1);
    });

    it('width < 320 returns breakpoint 0', function() {
        assert.equal(getBreakpoint(319), 0);
    });
});
