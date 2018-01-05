import MediaPool from 'program/media-element-pool';
import sinon from 'sinon';

describe('Media Element Pool', function () {
    let mediaPool = null;
    beforeEach(function () {
        mediaPool = new MediaPool();
    });

    it('starts with 3 empty media elements', function () {
        for (let i = 0; i < 3; i++) {
            const element = mediaPool.getPrimedElement();
            expect(element).to.not.equal(null);
            expect(element.nodeName).to.equal('VIDEO');
            // src is undefined when running in PhantomJS
            expect(element.src || '').to.equal('');
            expect(element.className).to.equal('jw-video jw-reset');
        }
        expect(mediaPool.getPrimedElement()).to.equal(null);
    });

    it('primes elements by calling load', function () {
        const spies = [];
        for (let i = 0; i < 3; i++) {
            const element = mediaPool.getPrimedElement();
            mediaPool.recycle(element);
            const spy = sinon.spy();
            element.load = spy;
            spies.push(spy);
        }

        mediaPool.prime();
        expect(spies.length).to.equal(3);
        spies.forEach(s => {
            expect(s.calledOnce).to.equal(true);
        });
    });

    it('synchronizes volume across the pool', function () {
        mediaPool.syncVolume(50);
        for (let i = 0; i < 3; i++) {
            expect(mediaPool.getPrimedElement().volume).to.equal(0.5);
        }
    });

    it('synchronizes mute across the pool', function () {
        mediaPool.syncMute(true);
        for (let i = 0; i < 3; i++) {
            expect(mediaPool.getPrimedElement().muted).to.equal(true);
        }
    });
});