import * as streamTypeUtil from 'providers/utils/stream-type';

describe('stream-type', function() {

    it('stream-type.streamType', function() {
        const minDvrWindow = 120;
        let type = streamTypeUtil.streamType(0, minDvrWindow);
        expect(type, 'streamType with 0 and 120').to.equal('VOD');

        type = streamTypeUtil.streamType(0, 0);
        expect(type, 'streamType with 0 and 0').to.equal('VOD');

        type = streamTypeUtil.streamType(10, minDvrWindow);
        expect(type, 'streamType with 10 and 120').to.equal('VOD');

        type = streamTypeUtil.streamType(10, undefined);
        expect(type, 'streamType with 10 and undefined').to.equal('VOD');

        type = streamTypeUtil.streamType(-120, minDvrWindow);
        expect(type, 'streamType with -120 and 120').to.equal('DVR');

        type = streamTypeUtil.streamType(-120, -10);
        expect(type, 'streamType with 120 and -10').to.equal('DVR');

        type = streamTypeUtil.streamType(-120, 0);
        expect(type, 'streamType with 120 and 0').to.equal('DVR');

        type = streamTypeUtil.streamType(-120, 0);
        expect(type, 'streamType with -120 and 0').to.equal('DVR');

        type = streamTypeUtil.streamType(-120, undefined);
        expect(type, 'streamType with 120 and undefined').to.equal('DVR');

        type = streamTypeUtil.streamType(-20, minDvrWindow);
        expect(type, 'streamType with -20 and 120').to.equal('LIVE');

        type = streamTypeUtil.streamType(-1, minDvrWindow);
        expect(type, 'streamType with -1 and 120').to.equal('LIVE');

        type = streamTypeUtil.streamType(Infinity, minDvrWindow);
        expect(type, 'streamType with Infinity').to.equal('LIVE');

        type = streamTypeUtil.streamType(-20, undefined);
        expect(type, 'streamType with -20 and undefined').to.equal('LIVE');
    });
});
