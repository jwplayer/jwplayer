import {
    getIosFullscreenState,
    setupWebkitListeners,
    removeWebkitListeners
} from 'providers/utils/webkit-fullscreen-helper';
import Events from 'utils/backbone.events';
import sinon from 'sinon';

const _this = Object.assign({}, Events);
const mockVideo = document.createElement('video');

function dispatchEvent(event) {
    mockVideo.dispatchEvent(new Event(event));
}

describe('Webkit Fullscreen Helper', function() {
    describe('getIosFullscreenState', function() {
        it('defaults to false', function() {
            const state = getIosFullscreenState();
            expect(state).to.be.false;
        });

        it('returns true when webkit begins fullscreen', function() {
            setupWebkitListeners(_this, mockVideo);
            dispatchEvent('webkitbeginfullscreen');
            const state = getIosFullscreenState();
            expect(state).to.be.true;

            removeWebkitListeners(mockVideo);
        });

        it('returns false when webkit ends fullscreen', function() {
            setupWebkitListeners(_this, mockVideo);

            dispatchEvent('webkitbeginfullscreen');
            let state = getIosFullscreenState();
            expect(state).to.be.true;

            dispatchEvent('webkitendfullscreen');
            state = getIosFullscreenState();
            expect(state).to.be.false;

            removeWebkitListeners(mockVideo);
        });
    });

    describe('setupWebkitListeners', function() {
        it('adds video event listners', function() {
            mockVideo.addEventListener = sinon.spy();
            setupWebkitListeners(_this, mockVideo);

            expect(mockVideo.addEventListener.callCount).to.equal(2);
            expect(mockVideo.addEventListener.getCall(0)).calledWith('webkitbeginfullscreen');
            expect(mockVideo.addEventListener.getCall(1)).calledWith('webkitendfullscreen');
        });
    });

    describe('removeWebkitListeners', function() {
        it('removes video event listeners', function() {
            mockVideo.removeEventListener = sinon.spy();
            removeWebkitListeners(mockVideo);

            expect(mockVideo.removeEventListener.callCount).to.equal(2);
            expect(mockVideo.removeEventListener.getCall(0)).calledWith('webkitbeginfullscreen');
            expect(mockVideo.removeEventListener.getCall(1)).calledWith('webkitendfullscreen');
        });
    });
});
