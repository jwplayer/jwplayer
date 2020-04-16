import {
    hasRedundantLevels,
    generateLabel,
    hasRedundantLabels,
    toKbps
} from 'providers/utils/quality-labels';

describe('quality-labels', function() {

    const customLabels = {
        1000: 'low',
        2000: 'medium',
        3000: 'high',
    };

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

        it('should get custom label when bandwidth exactly matches a custom lable key', function() {
            const level = { bitrate: 2000000 };
            const expected = 'medium';
            const actual = generateLabel(level, customLabels, false);
            expect(actual).to.equal(expected);
        });

        it('should get custom label when bandwidth rounds to a custom label key', function() {
            const level = { bitrate: 2000004 };
            const expected = 'medium';
            const actual = generateLabel(level, customLabels, false);
            expect(actual).to.equal(expected);
        });

        it('should get closest custom label when bandwidth is between two custom label keys', function() {
            const level = { bitrate: 2200000 };
            const expected = 'medium';
            const actual = generateLabel(level, customLabels, false);
            expect(actual).to.equal(expected);
        });

        it('should get the largest custome label when bandwidth is greater than every custom label key', function() {
            const level = { bitrate: 9999999 };
            const expected = 'high';
            const actual = generateLabel(level, customLabels, false);
            expect(actual).to.equal(expected);
        });

        it('should get the lowest custom label when bandwidth is less than every custom label key', function() {
            const level = { bitrate: 1 };
            const expected = 'low';
            const actual = generateLabel(level, customLabels, false);
            expect(actual).to.equal(expected);
        });

        it('should create a label with height when available and custom labels are empty', function() {
            const level = { height: 360 };
            const expected = '360p';
            const actual = generateLabel(level, {}, false);
            expect(actual).to.equal(expected);
        });

        it('should retun an empty string when bandwidth is undefined', function() {
            const expected = '';
            const actual = generateLabel(undefined, customLabels, undefined);
            expect(actual).to.equal(expected);
        });

        // Uses createLabel when qualityLabels and label property are not provided
        it('should create a label using height when available', function() {
            const level = { height: 360 };
            const expected = '360p';
            const actual = generateLabel(level, null, false);
            expect(actual).to.equal(expected);
        });

        it('should create a label using bandwidth when height is not available', function() {
            const level = { bitrate: 1337000 };
            const expected = '1337 kbps';
            const actual = generateLabel(level, null, false);
            expect(actual).to.equal(expected);
        });

        it('should create a label that does not add parentheses to bandwidth when redundant is true and height is not available', function() {
            const level = { bitrate: 1337000 };
            const expected = '1337 kbps';
            const actual = generateLabel(level, null, true);
            expect(actual).to.equal(expected);
        });

        it('should create a label that includes bandwidth string when redundant argument is true', function() {
            const level = { height: 360, bitrate: 1337000 };
            const expected = '360p (1337 kbps)';
            const actual = generateLabel(level, null, true);
            expect(actual).to.equal(expected);
        });

        it('should return an empty string when height and bandwidth are not available and custom labels are empty', function() {
            const expected = '';
            const actual = generateLabel(undefined, {}, false);
            expect(actual).to.equal(expected);
        });

        it('should return an empty string when height and bandwidth are not available', function() {
            const expected = '';
            const actual = generateLabel(undefined, null, false);
            expect(actual).to.equal(expected);
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

