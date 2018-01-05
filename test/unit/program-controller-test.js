import Model from 'controller/model';
import ProgramController from 'program/program-controller';
import MediaElementPool from 'program/media-element-pool';
import MockProvider from 'mock/mock-provider';
import sinon from 'sinon';

const defaultConfig = {
    playlist: null,
    mediaContainer: null,
    volume: 20,
    mute: false,
    edition: 'enterprise'
};

const mp4Item = {
    sources: [
        {}
    ]
};

const defaultPlaylist = [
    mp4Item,
    mp4Item
];

const providerEvents = [
    {
        type: 'levels'
    },
    {
        type: 'meta'
    },
    {
        type: 'subtitleTracks'
    },
    {
        type: 'mediaType'
    },
    {
        type: 'bufferChange'
    }
];

describe('ProgramController', function () {

    let model = null;
    let programController = null;

    beforeEach(function () {
        const config = Object.assign({}, defaultConfig, {
            playlist: defaultPlaylist.slice(0),
            mediaContainer: document.createElement('div'),
        });
        model = new Model().setup(config);
        programController = new ProgramController(model, new MediaElementPool());
        programController.providerController = {
            choose() {
                return MockProvider;
            }
        };
        programController.toString = (() => '[ProgramController]');
    });

    afterEach(function () {
        programController.destroy();
        model.destroy();
        model = null;
        programController = null;
    });

    it('forwards provider events', function() {
        const callback = sinon.spy();
        const context = {};
        programController.on('all', callback, context);
        programController.stopVideo();
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.activeProvider;

                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(callback).to.have.always.have.been.calledOn(context);
                expectAllEventsTriggered(callback);
            });
    });

    it('does not forward provider events when provider is backgrounded', function() {
        const callback = sinon.spy();
        programController.on('all', callback, {});
        programController.stopVideo();
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.activeProvider;

                programController.backgroundActiveMedia();
                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(callback).to.have.callCount(0);
            });
    });

    it('does not forward provider events when provider is detached', function() {
        const callback = sinon.spy();
        programController.on('all', callback, {});
        programController.stopVideo();
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.activeProvider;

                programController.attached = false;
                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(callback).to.have.callCount(0);
            });
    });

    it('does not forward provider events when program-controller is destroyed', function() {
        const callback = sinon.spy();
        programController.on('all', callback, {});
        programController.stopVideo();
        const itemPromise = programController.setActiveItem(0)
            .then(function () {
                const provider = programController.activeProvider;
                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(callback).to.have.callCount(0);
            });
        programController.destroy();
        return itemPromise;
    });

    it('forwards queued provider events when provider is foregrounded', function() {
        const callback = sinon.spy();
        programController.on('all', callback, {});
        programController.stopVideo();
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.activeProvider;

                programController.backgroundActiveMedia();
                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(callback).to.have.callCount(0);
                programController.restoreBackgroundMedia();
                expectAllEventsTriggered(callback);
            });
    });

    it('forwards queued provider events when provider is reattached', function() {
        const callback = sinon.spy();
        programController.on('all', callback, {});
        programController.stopVideo();
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.activeProvider;

                programController.attached = false;
                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(callback).to.have.callCount(0);
                programController.attached = true;
                expectAllEventsTriggered(callback);
            });
    });
});

function expectAllEventsTriggered(callbackSpy) {
    expect(callbackSpy).to.have.callCount(providerEvents.length);
    providerEvents.forEach((event, i) => {
        expect(callbackSpy.getCall(i)).to.have.been.calledWith(event.type, event);
    });
}
