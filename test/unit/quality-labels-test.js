import _ from 'utils/underscore';
import {
    hasRedundantLevels,
    generateLabel,
    createLabel,
    getCustomLabel,
    findClosestBandwidth,
    hasRedundantLabels,
    toKbps
} from 'providers/utils/quality-labels';

describe('quality-labels', function() {

    const customLabels = {
        1000: 'low',
        2000: 'medium',
        3000: 'high',
    };

    const bandwidths = _.keys(customLabels);

    describe('createLabel', function() {
        it('creates a label using height when available', function() {
            const expected = '360p';
            const actual = createLabel(360, undefined, false);
            expect(expected).to.equal(actual);
        });

        it('creates a label using bandwidth when height is not available', function() {
            const expected = '1337 kbps';
            const actual = createLabel(undefined, 1337000, false);
            expect(expected).to.equal(actual);
        });

        it('does not add parentheses to bandwidth when redundant is true and height is not available', function() {
            const expected = '1337 kbps';
            const actual = createLabel(undefined, 1337000, true);
            expect(expected).to.equal(actual);
        });

        it('includes bandwidth string when redundant argument is true', function() {
            const expected = '360p (1337 kbps)';
            const actual = createLabel(360, 1337000, true);
            expect(expected).to.equal(actual);
        });

        it('returns an empty string when height and bandwidth are not available', function() {
            const expected = '';
            const actual = createLabel(undefined, undefined, false);
            expect(expected).to.equal(actual);
        });
    });


    describe('getCustomLabel', function() {
        it('gets custom label when bandwidth exactly matches a key', function() {
            const expected = 'medium';
            const actual = getCustomLabel(customLabels, 2000000);
            expect(expected).to.equal(actual);
        });

        it('gets custom label when bandwidth rounds to a key', function() {
            const expected = 'medium';
            const actual = getCustomLabel(customLabels, 2000004);
            expect(expected).to.equal(actual);
        });

        it('retuns null when no custom labels are given', function() {
            const expected = null;
            const actual = getCustomLabel(null, 4000000);
            expect(expected).to.equal(actual);
        });

        it('retuns null when custom labels are empty', function() {
            const expected = null;
            const actual = getCustomLabel({}, 4000000);
            expect(expected).to.equal(actual);
        });

        it('retuns null when bandwidth is undefined', function() {
            const expected = null;
            const actual = getCustomLabel(customLabels, undefined);
            expect(expected).to.equal(actual);
        });
    });


    describe('findClosestBandwidth', function() {
        it('retuns null when no bandwidths are given', function() {
            const expected = null;
            const actual = findClosestBandwidth([], 4000);
            expect(expected).to.equal(actual);
        });

        it('returns null when bandwidths are not an array', function() {
            const expected = null;
            const actual = findClosestBandwidth({ medium: 4000 }, 4000);
            expect(expected).to.equal(actual);
        });

        it('finds the quality label with closest to the target bandwidth when between two bandwidths', function() {
            const expected = '2000';
            const actual = findClosestBandwidth(bandwidths, 2200);
            expect(expected).to.equal(actual);
        });

        it('finds the quality label closest to the target bandwidth when exactly matching a bandwidth', function() {
            const expected = '1000';
            const actual = findClosestBandwidth(bandwidths, 1000);
            expect(expected).to.equal(actual);
        });

        it('chooses the top label when the target bandwidth is greater than every bandwidth', function() {
            const expected = '3000';
            const actual = findClosestBandwidth(bandwidths, 9999999);
            expect(expected).to.equal(actual);
        });

        it('chooses the lowest label when the target bandwidth is less than every bandwidth', function() {
            const expected = '1000';
            const actual = findClosestBandwidth(bandwidths, 1);
            expect(expected).to.equal(actual);
        });
    });


    describe('toKbps', function() {
        it('should be 0 if 0 bps', function() {
            const expected = 0;
            const actual = toKbps(0);
            expect(expected).to.equal(actual);
        });

        it('should be 0 if less than 1 kbps', function() {
            const expected = 0;
            const actual = toKbps(999);
            expect(expected).to.equal(actual);
        });

        it('should convert bps to kbps', function() {
            const expected = 3;
            const actual = toKbps(3000);
            expect(expected).to.equal(actual);
        });
    });


    describe('hasRedundantLevels', function() {
        it('should return true if at least two levels share the same height', function() {
            const levels = [{ height: 100 }, { height: 50 }, { height: 100 }];
            const actual = hasRedundantLevels(levels);
            expect(actual).to.equal(true);
        });

        it('should return false if no levels share the same height', function() {
            const levels = [{ height: 100 }, { height: 50 }, { height: 200 }];
            const actual = hasRedundantLevels(levels);
            expect(actual).to.equal(false);
        });

        it('should return true if at least two have no height and share the same bandwidth', function() {
            const levels = [{ bandwidth: 10000 }, { height: 50 }, { bandwidth: 10000 }];
            const actual = hasRedundantLevels(levels);
            expect(actual).to.equal(true);
        });

        it('should return false if at least two have no height and do not share the same bandwidth', function() {
            const levels = [{ bandwidth: 10000 }, { height: 50 }, { bandwidth: 20000 }];
            const actual = hasRedundantLevels(levels);
            expect(actual).to.equal(false);
        });

        it('should return false if there are no levels', function() {
            const levels = [];
            const actual = hasRedundantLevels(levels);
            expect(actual).to.equal(false);
        });

        it('should return false if levels are undefined', function() {
            let levels;
            const actual = hasRedundantLevels(levels);
            expect(actual).to.equal(false);
        });

        it('should return false if levels are not an array', function() {
            const levels = { height: 100, notHeight: 100 };
            const actual = hasRedundantLevels(levels);
            expect(actual).to.equal(false);
        });

        describe('generateLabel', function() {
            // flash provider only
            it('should use label property if it exists and there are no custom labels', function() {
                const level = { label: '360px' };
                const actual = generateLabel(level, null, false);
                expect(actual).to.equal('360px');
            });

            // flash provider only
            it('should not use label property if it exists and there are custom labels', function() {
                const level = { label: '360px', bitrate: 2000000 };
                const actual = generateLabel(level, customLabels, false);
                expect(actual).to.equal('medium');
            });
        });
    });

    describe('#hasRedundantLabels', () => {
        it('should return true if multiple labels are the same', () => {
            const levels = [{ label: 'Video 1' }, { label: 'Video 2' }, { label: 'Video 2' }];
            expect(hasRedundantLabels(levels)).to.be.true;
        });
        it('should return false if multiple labels are not the same', () => {
            const levels = [{ label: 'Video 1' }, { label: 'Video 2' }, { label: 'Video 3' }];
            expect(hasRedundantLabels(levels)).to.be.false;
        });
        it('should return false if multiple labels are the not same with some nulls', () => {
            const levels = [{ label: 'Video 1' }, { label: 'Video 2' }, { label: 'Video 3' }, { label: null }, { label: null }];
            expect(hasRedundantLabels(levels)).to.be.false;
        });
        it('should return false if multiple labels are the same with some nulls', () => {
            const levels = [{ label: 'Video 1' }, { label: 'Video 2' }, { label: 'Video 1' }, { label: null }, { label: null }];
            expect(hasRedundantLabels(levels)).to.be.true;
        });
    });
});

