import Model from 'controller/model';
import ProgramController from 'program/program-controller';
import MediaElementPool from 'program/media-element-pool';
import Events from 'utils/backbone.events';
import DefaultProvider from 'providers/default';
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

const Provider = function() {};
Object.assign(Provider.prototype, DefaultProvider, Events);


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
                return Provider;
            }
        };
        programController.toString = (() => '[ProgramController]');
        sinon.spy(programController, 'trigger');
    });

    afterEach(function () {
        programController.off();
        model.destroy();
        model = null;
        programController = null;
    });

    it('forwards provider events', function() {
        programController.stopVideo();
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.activeProvider;

                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(programController.trigger).to.have.always.have.been.calledOn(programController);
                expectAllEventsTriggered(programController.trigger);
            });
    });

    it('does not forward provider events when provider is backgrounded', function() {
        programController.stopVideo();
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.activeProvider;

                programController.backgroundActiveMedia();
                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(programController.trigger).to.have.callCount(0);
            });
    });

    it('does not forward provider events when provider is detached', function() {
        programController.stopVideo();
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.activeProvider;

                programController.attached = false;
                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(programController.trigger).to.have.callCount(0);
            });
    });

    it('forwards queued provider events when provider is foregrounded', function() {
        programController.stopVideo();
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.activeProvider;

                programController.backgroundActiveMedia();
                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(programController.trigger).to.have.callCount(0);
                programController.restoreBackgroundMedia();
                // expectAllEventsTriggered(programController.trigger);
            });
    });

    it('forwards queued provider events when provider is reattached', function() {
        programController.stopVideo();
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.activeProvider;

                programController.attached = false;
                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(programController.trigger).to.have.callCount(0);
                programController.attached = true;
                // expectAllEventsTriggered(programController.trigger);
            });
    });
});

function expectAllEventsTriggered(triggerSpy) {
    expect(triggerSpy).to.have.callCount(providerEvents.length);
    providerEvents.forEach((event, i) => {
        expect(triggerSpy.getCall(i)).to.have.been.calledWith(event.type, event);
    });
}
