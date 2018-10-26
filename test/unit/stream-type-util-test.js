import { streamType, isDvr } from 'providers/utils/stream-type';

describe('stream-type', function() {

    it('determines streamType', function() {
        const minDvrWindow = 120;
        let type = streamType(0, minDvrWindow);
        expect(type, 'streamType with 0 and 120').to.equal('VOD');

        type = streamType(0, 0);
        expect(type, 'streamType with 0 and 0').to.equal('VOD');

        type = streamType(10, minDvrWindow);
        expect(type, 'streamType with 10 and 120').to.equal('VOD');

        type = streamType(10, undefined);
        expect(type, 'streamType with 10 and undefined').to.equal('VOD');

        type = streamType(-120, minDvrWindow);
        expect(type, 'streamType with -120 and 120').to.equal('DVR');

        type = streamType(-120, -10);
        expect(type, 'streamType with 120 and -10').to.equal('DVR');

        type = streamType(-120, 0);
        expect(type, 'streamType with 120 and 0').to.equal('DVR');

        type = streamType(-120, 0);
        expect(type, 'streamType with -120 and 0').to.equal('DVR');

        type = streamType(-120, undefined);
        expect(type, 'streamType with 120 and undefined').to.equal('DVR');

        type = streamType(-20, minDvrWindow);
        expect(type, 'streamType with -20 and 120').to.equal('LIVE');

        type = streamType(-1, minDvrWindow);
        expect(type, 'streamType with -1 and 120').to.equal('LIVE');

        type = streamType(Infinity, minDvrWindow);
        expect(type, 'streamType with Infinity').to.equal('LIVE');

        type = streamType(-20, undefined);
        expect(type, 'streamType with -20 and undefined').to.equal('LIVE');
    });

    it('determines isDvr', function() {
        const minDvrWindow = 120;
        let dvrMode;

        dvrMode = isDvr(0, minDvrWindow);
        expect(dvrMode, 'expect false when duration is less than minDvrWindow').to.equal(false);

        dvrMode = isDvr(Infinity, minDvrWindow);
        expect(dvrMode, 'expect false when duration is Infinity').to.equal(false);

        dvrMode = isDvr(-110, minDvrWindow);
        expect(dvrMode, 'expect false when absolute duration is less than minDvrWindow').to.equal(false);

        dvrMode = isDvr(10, undefined);
        expect(dvrMode, 'expect false when duration is greater than 0 and minDvrWindow is undefined').to.equal(false);

        dvrMode = isDvr(-10, undefined);
        expect(dvrMode, 'expect false when duration is less than 0 and minDvrWindow is undefined').to.equal(false);

        dvrMode = isDvr(0, 0);
        expect(dvrMode, 'expect true when duration is equal to minDvrWindow').to.equal(true);

        dvrMode = isDvr(-120, minDvrWindow);
        expect(dvrMode, 'expect true when absolute duration equals minDvrWindow').to.equal(true);

        dvrMode = isDvr(-60, -10);
        expect(dvrMode, 'expect true when absolute duration is greater than negative minDvrWindow').to.equal(true);

        dvrMode = isDvr(-60, 0);
        expect(dvrMode, 'expect true when absolute duration is greater than minDvrWindow').to.equal(true);
    });
});
