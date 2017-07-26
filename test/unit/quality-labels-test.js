import _ from 'utils/underscore';
import {
    hasRedundantLevels,
    generateLabel,
    createLabel,
    getCustomLabel,
    findClosestBandwidth,
    toKbps
} from 'providers/utils/quality-labels';

describe('quality-labels', () => {

    var customLabels = {
        1000: 'low',
        2000: 'medium',
        3000: 'high',
    };

    var bandwidths = _.keys(customLabels);

    describe('createLabel', () => {
        it('creates a label using height when available', () => {
            var expected = '360p';
            var actual = createLabel(360, undefined, false);
            assert.equal(actual, expected);
        });

        it('creates a label using bandwidth when height is not available', () => {
            var expected = '1337 kbps';
            var actual = createLabel(undefined, 1337000, false);
            assert.equal(actual, expected);
        });

        it('does not add parentheses to bandwidth when redundant is true and height is not available', () => {
            var expected = '1337 kbps';
            var actual = createLabel(undefined, 1337000, true);
            assert.equal(actual, expected);
        });

        it('includes bandwidth string when redundant argument is true', () => {
            var expected = '360p (1337 kbps)';
            var actual = createLabel(360, 1337000, true);
            assert.equal(actual, expected);
        });

        it('returns an empty string when height and bandwidth are not available', () => {
            var expected = '';
            var actual = createLabel(undefined, undefined, false);
            assert.equal(actual, expected);
        });
    });


    describe('getCustomLabel', () => {
        it('gets custom label when bandwidth exactly matches a key', () => {
            var expected = 'medium';
            var actual = getCustomLabel(customLabels, 2000000);
            assert.equal(actual, expected);
        });

        it('gets custom label when bandwidth rounds to a key', () => {
            var expected = 'medium';
            var actual = getCustomLabel(customLabels, 2000004);
            assert.equal(actual, expected);
        });

        it('retuns null when no custom labels are given', () => {
            var expected = null;
            var actual = getCustomLabel(null, 4000000);
            assert.equal(actual, expected);
        });

        it('retuns null when custom labels are empty', () => {
            var expected = null;
            var actual = getCustomLabel({}, 4000000);
            assert.equal(actual, expected);
        });

        it('retuns null when bandwidth is undefined', () => {
            var expected = null;
            var actual = getCustomLabel(customLabels, undefined);
            assert.equal(actual, expected);
        });
    });


    describe('findClosestBandwidth', () => {
        it('retuns null when no bandwidths are given', () => {
            var expected = null;
            var actual = findClosestBandwidth([], 4000);
            assert.equal(actual, expected);
        });

        it('returns null when bandwidths are not an array', () => {
            var expected = null;
            var actual = findClosestBandwidth({ medium: 4000 }, 4000);
            assert.equal(actual, expected);
        });

        it('finds the quality label with closest to the target bandwidth when between two bandwidths', () => {
            var expected = 2000;
            var actual = findClosestBandwidth(bandwidths, 2200);
            assert.equal(actual, expected);
        });

        it('finds the quality label closest to the target bandwidth when exactly matching a bandwidth', () => {
            var expected = 1000;
            var actual = findClosestBandwidth(bandwidths, 1000);
            assert.equal(actual, expected);
        });

        it('chooses the top label when the target bandwidth is greater than every bandwidth', () => {
            var expected = 3000;
            var actual = findClosestBandwidth(bandwidths, 9999999);
            assert.equal(actual, expected);
        });

        it('chooses the lowest label when the target bandwidth is less than every bandwidth', () => {
            var expected = 1000;
            var actual = findClosestBandwidth(bandwidths, 1);
            assert.equal(actual, expected);
        });
    });


    describe('toKbps', () => {
        it('should be 0 if 0 bps', () => {
            var expected = 0;
            var actual = toKbps(0);
            assert.equal(actual, expected);
        });

        it('should be 0 if less than 1 kbps', () => {
            var expected = 0;
            var actual = toKbps(999);
            assert.equal(actual, expected);
        });

        it('should convert bps to kbps', () => {
            var expected = 3;
            var actual = toKbps(3000);
            assert.equal(actual, expected);
        });
    });


    describe('hasRedundantLevels', () => {
        it('should return true if at least two levels share the same height', () => {
            var levels = [{ height: 100 }, { height: 50 }, { height: 100 }];
            var actual = hasRedundantLevels(levels);
            assert.equal(actual, true);
        });

        it('should return false if no levels share the same height', () => {
            var levels = [{ height: 100 }, { height: 50 }, { height: 200 }];
            var actual = hasRedundantLevels(levels);
            assert.equal(actual, false);
        });

        it('should return true if at least two have no height and share the same bandwidth', () => {
            var levels = [{ bandwidth: 10000 }, { height: 50 }, { bandwidth: 10000 }];
            var actual = hasRedundantLevels(levels);
            assert.equal(actual, true);
        });

        it('should return false if at least two have no height and do not share the same bandwidth', () => {
            var levels = [{ bandwidth: 10000 }, { height: 50 }, { bandwidth: 20000 }];
            var actual = hasRedundantLevels(levels);
            assert.equal(actual, false);
        });

        it('should return false if there are no levels', () => {
            var levels = [];
            var actual = hasRedundantLevels(levels);
            assert.equal(actual, false);
        });

        it('should return false if levels are undefined', () => {
            var levels;
            var actual = hasRedundantLevels(levels);
            assert.equal(actual, false);
        });

        it('should return false if levels are not an array', () => {
            var levels = { height: 100, notHeight: 100 };
            var actual = hasRedundantLevels(levels);
            assert.equal(actual, false);
        });

        describe('generateLabel', () => {
            // Only Flash does this
            it('should use label property if it exists and there are no custom labels', () => {
                var level = { label: '360px' };
                var actual = generateLabel(level, null, false);
                assert.equal(actual, '360px');
            });

            // Only Flash does this
            it('should not use label property if it exists and there are custom labels', () => {
                var level = { label: '360px', bitrate: 2000000 };
                var actual = generateLabel(level, customLabels, false);
                assert.equal(actual, 'medium');
            });
        });
    });
});

