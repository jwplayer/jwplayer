import { getBreakpoint } from 'view/utils/breakpoint';

describe(('Breakpoint'), function() {
    it('width >= 1280 returns breakpoint 7', function() {
        expect(getBreakpoint(1280)).to.equal(7);
    });

    it('width >= 960 returns breakpoint 6', function() {
        expect(getBreakpoint(960)).to.equal(6);
    });

    it('width >= 800 returns breakpoint 5', function() {
        expect(getBreakpoint(800)).to.equal(5);
    });

    it('width >= 640 returns breakpoint 4', function() {
        expect(getBreakpoint(640)).to.equal(4);
    });

    it('width >= 540 returns breakpoint 3', function() {
        expect(getBreakpoint(540)).to.equal(3);
    });

    it('width >= 420 returns breakpoint 2', function() {
        expect(getBreakpoint(420)).to.equal(2);
    });

    it('width >= 320 returns breakpoint 1', function() {
        expect(getBreakpoint(320)).to.equal(1);
    });

    it('width < 320 returns breakpoint 0', function() {
        expect(getBreakpoint(319)).to.equal(0);
    });
});
