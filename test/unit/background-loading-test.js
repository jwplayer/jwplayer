import Model from 'controller/model';
import ProgramController from 'program/program-controller';
import MediaController from 'program/media-controller';
import MockProvider from 'mock/mock-provider';
import MediaElementPool from 'program/media-element-pool';
import Config from 'api/config';
import sinon from 'sinon';

const defaultConfig = {
    volume: 20,
    mute: false,
    edition: 'enterprise'
};

describe('Background Loading', function () {

    let model = null;
    let config = null;
    let programController = null;
    let mediaElement = null;
    let container = null;
    let mockProvider = null;
    let mediaController = null;
    let mediaPool = null;

    beforeEach(function () {
        config = Config(Object.assign({}, defaultConfig));
        model = new Model().setup(config);
        container = document.createElement('div');
        model.attributes.mediaContainer = container;
        mediaElement = document.createElement('video');

        mediaPool = new MediaElementPool();
        programController = new ProgramController(model, mediaPool);
        mockProvider = new MockProvider();
        mockProvider.video = mediaElement;
        mediaController = new MediaController(mockProvider, model);
    });

    afterEach(function () {
        model.destroy();
    });

    describe('mediaController.container', function () {
        it('adds the video to a container', function() {
            mediaController.container = container;

            expect(mediaController.container).to.equal(container);
            expect(container.querySelector('video')).to.equal(mediaController.mediaElement);
            expect(mediaController.mediaElement).to.equal(mediaElement);
        });
    });

    describe('mediaController.background', function () {
        it('removes the video from its container pauses it', function () {
            mediaController.container = container;
            mediaController.pause = sinon.spy();

            expect(mockProvider.getContainer()).to.equal(container);

            mediaController.background = true;
            expect(container.querySelector('video')).to.equal(null);
            expect(mediaController.container).to.equal(null);
            expect(mediaController.pause.calledOnce).to.equal(true);
        });

        it('triggers beforeComplete when false and the media has already ended', function () {
            const onComplete = sinon.spy();
            mediaController.container = container;
            mediaController.item = {
                starttime: 42
            }
            mediaController.beforeComplete = true;
            mediaController.background = true;
            mediaController.on('complete', onComplete);

            mediaController.container = container;
            mediaController.background = false;
            expect(onComplete.calledOnce).to.equal(true);
            expect(mediaController.beforeComplete).to.equal(false);
            expect(mediaController.item.starttime).to.not.exist;
        });
    });

    describe('mediaController.stop', function () {
        it('resets beforeComplete', function () {
            mediaController.container = container;
            mediaController.beforeComplete = true;
            expect(mediaController.beforeComplete).to.equal(true);
            mediaController.stop();
            expect(mediaController.beforeComplete).to.equal(false);
        });
    });

    describe('prograController._setActiveMedia()', function () {
        it('activates the given mediaController', function () {
            programController._setActiveMedia(mediaController);

            expect(programController.mediaController).to.equal(mediaController);
            expect(mediaController.container).to.equal(container);
            expect(mediaController.mediaElement).to.equal(mediaElement);
            expect(container.querySelector('video')).to.equal(mediaElement);
            expect(model.getVideo()).to.equal(mockProvider);
            expect(model.mediaModel).to.equal(mediaController.mediaModel);
            expect(model.attributes.mediaElement).to.equal(mediaElement);
        });

        it('forwards events from the mediaController', function () {
            programController._setActiveMedia(mediaController);

            const onEvent = sinon.spy();
            programController.on('foo', onEvent);
            mediaController.trigger('foo');
            expect(onEvent.calledOnce).to.equal(true);
        });
    });

    describe('programController.setBackgroundMedia()', function () {
        it('puts the active media controller into the background', function () {
            programController._setActiveMedia(mediaController);
            mediaController.background = sinon.spy();

            programController.backgroundActiveMedia();
            expect(programController.mediaController).to.equal(null);
            expect(programController.background.currentMedia).to.equal(mediaController);
            expect(mediaController.background).to.equal(true);
        });

        it('forwards no events from a background mediaController', function () {
            programController._setActiveMedia(mediaController);
            programController.backgroundActiveMedia();

            programController.on('time', () => {
                throw new Error('Should not have forwarded a background event');
            });
            mediaController.trigger('time');
        });

        it('should do nothing if there is no active media', function () {
            programController.backgroundActiveMedia();
            expect(programController.background.currentMedia).to.equal(null);
        });

        it('should replace existing background media if already present', function () {
            programController._setActiveMedia(mediaController);
            programController.backgroundActiveMedia();
            mediaController.destroy = sinon.spy();
            mediaPool.recycle = sinon.spy();

            mockProvider.video = document.createElement('video');
            const newMediaController = new MediaController(mockProvider, model);
            programController._setActiveMedia(newMediaController);
            programController.backgroundActiveMedia();

            expect(programController.mediaController).to.equal(null);
            expect(programController.background.currentMedia).to.equal(newMediaController);
            expect(mediaController.destroy.calledOnce).to.equal(true);
            expect(mediaPool.recycle.calledOnce).to.equal(true);
        });
    });

    describe('programController.restoreBackgroundMedia()', function () {
        it('returns background media to the foreground', function () {
            programController._setActiveMedia(mediaController);
            programController._setActiveMedia = sinon.spy();

            programController.backgroundActiveMedia();
            programController.restoreBackgroundMedia();

            expect(programController._setActiveMedia.calledOnce).to.equal(true);
        });

        it('does nothing if there is no background media', function () {
            programController._setActiveMedia = sinon.spy();
            programController.restoreBackgroundMedia();

            expect(programController._setActiveMedia.calledOnce).to.equal(false);
        });

        it('destroys background media if there is an active foreground item', function () {
            programController._setActiveMedia(mediaController);
            programController.backgroundActiveMedia();
            programController._setActiveMedia(mediaController);
            programController._setActiveMedia = sinon.spy();
            mediaPool.recycle = sinon.spy();

            programController.restoreBackgroundMedia();
            expect(programController._setActiveMedia.calledOnce).to.equal(false);
            expect(mediaPool.recycle.calledOnce).to.equal(true);
            expect(programController.background.currentMedia).to.equal(null);
        });
    });
});
