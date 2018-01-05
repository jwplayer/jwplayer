import MediaPool from 'program/media-element-pool';
import { MEDIA_POOL_SIZE } from 'program/program-constants';
import sinon from 'sinon';

describe('Media Element Pool', function () {
    const numTags = MEDIA_POOL_SIZE - 1;
    let mediaPool = null;
    beforeEach(function () {
        mediaPool = new MediaPool();
    });

    it(`starts with ${numTags} empty media elements`, function () {
        for (let i = 0; i < numTags; i++) {
            const element = mediaPool.getPrimedElement();
            expect(element).to.not.equal(null);
            expect(element.nodeName).to.equal('VIDEO');
            // src is undefined when running in PhantomJS
            expect(element.src || '').to.equal('');
            expect(element.className).to.equal('jw-video jw-reset');
        }
        expect(mediaPool.getPrimedElement()).to.equal(null);
    });

    it('synchronizes volume across the pool', function () {
        mediaPool.syncVolume(50);
        for (let i = 0; i < numTags; i++) {
            expect(mediaPool.getPrimedElement().volume).to.equal(0.5);
        }
    });

    it('synchronizes mute across the pool', function () {
        mediaPool.syncMute(true);
        for (let i = 0; i < numTags; i++) {
            expect(mediaPool.getPrimedElement().muted).to.equal(true);
        }
    });

    it('provides an exclusive element to ad pools', function () {
        const adElement = mediaPool.getAdElement();
        expect(adElement).to.not.equal(null);
        for (let i = 0; i < numTags; i++) {
            expect(mediaPool.getPrimedElement()).to.not.equal(adElement);
        }
    });
});