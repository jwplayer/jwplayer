import Model from 'controller/model';
import ProgramController from 'program/program-controller';
import MediaElementPool from 'program/media-element-pool';
import { Features } from 'environment/environment';
import MockProvider, { MockVideolessProvider } from 'mock/mock-provider';
import sinon from 'sinon';
import Config from 'api/config';

const defaultConfig = {
    playlist: null,
    mediaContainer: null,
    volume: 20,
    mute: false,
    edition: 'enterprise'
};

const mp4Item = {
    sources: [
        {
            file: 'foo.mp4'
        }
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
        type: 'subtitlesTracks'
    },
    {
        type: 'mediaType',
        mediaType: 'video'
    },
    {
        type: 'bufferChange'
    }
];

const providerPlayerModelEvents = [
    {
        type: 'volume',
        volume: 10
    },
    {
        type: 'levelsChanged',
        currentQuality: 1,
        levels: [ { label: 'level1', bitrate: 100 }, { label: 'level2', bitrate: 200 } ]
    },
    {
        type: 'subtitlesTrackChanged',
        currentTrack: 0,
        tracks: []
    },
    {
        type: 'subtitlesTracks'
    },
    {
        type: 'meta',
        data: 'metadata'
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
        programController.providers = {
            choose: () => ({name: 'mock', provider: MockProvider}),
            load: () => Promise.resolve(MockProvider),
            canPlay: () => true
        };
        model.toString = (() => '[Model]');
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
                const provider = programController.mediaController.provider;

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
                const provider = programController.mediaController.provider;

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
                const provider = programController.mediaController.provider;

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
                const provider = programController.mediaController.provider;
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
                const provider = programController.mediaController.provider;

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
                const provider = programController.mediaController.provider;

                programController.attached = false;
                providerEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(callback).to.have.callCount(0);
                programController.attached = true;
                expectAllEventsTriggered(callback);
            });
    });

    it('triggers events off the model when the active item is set', function() {
        // If background loading is not supported, mediaElement does not change
        const { backgroundLoading } = Features;
        let call = 1;

        sinon.spy(model, 'trigger');
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.mediaController.provider;
                expect(model.trigger).to.have.callCount(backgroundLoading ? 6 : 5);
                expect(model.trigger.firstCall).to.have.been.calledWith('change:playlistItem');
                if (backgroundLoading) {
                    expect(model.trigger.getCall(call++)).to.have.been.calledWith('change:mediaElement');
                }
                expect(model.trigger.getCall(call++)).to.have.been.calledWith('change:mediaModel');
                expect(model.trigger.getCall(call++)).to.have.been.calledWith('change:provider');
                expect(model.trigger.getCall(call++)).to.have.been.calledWith('change:renderCaptionsNatively');
                call++;
                expect(model.trigger.lastCall).to.have.been.calledWith('change:itemReady', model, true);
                expect(model.trigger.lastCall).to.have.been.calledAfter(provider.setContainer.firstCall);
                expect(provider.init).to.have.callCount(1);
                expect(provider.load).to.have.callCount(0);
            })
            .then(() => programController.setActiveItem(1))
            .then(function () {
                const provider = programController.mediaController.provider;
                expect(model.trigger).to.have.callCount(backgroundLoading ? 11 : 10);
                expect(model.trigger.getCall(call++)).to.have.been.calledWith('change:item');
                expect(model.trigger.getCall(call++)).to.have.been.calledWith('change:playlistItem');
                expect(model.trigger.getCall(call++)).to.have.been.calledWith('change:mediaModel');
                expect(model.trigger.getCall(call++)).to.have.been.calledWith('change:provider');
                expect(model.trigger.lastCall).to.have.been.calledWith('change:itemReady', model, true);
                expect(model.trigger.lastCall).to.have.been.calledAfter(provider.init.secondCall);
                expect(provider.init).to.have.callCount(2);
                expect(provider.load).to.have.callCount(0);
            });
    });

    it('updates the model', function() {
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.mediaController.provider;

                sinon.spy(model, 'set');
                sinon.spy(model, 'trigger');
                sinon.spy(model, 'persistQualityLevel');
                sinon.spy(model, 'persistVideoSubtitleTrack');
                providerPlayerModelEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(model.set).to.have.callCount(4);
                expect(model.set.firstCall).to.have.been.calledWith('volume', 10);
                expect(model.set.getCall(1)).to.have.been.calledWith('bitrateSelection', 200);
                expect(model.set.getCall(2)).to.have.been.calledWith('captionsIndex', 0);
                expect(model.set.getCall(3)).to.have.been.calledWith('captionLabel', 'Off');
                expect(model.trigger).to.have.callCount(5);
                expect(model.trigger.firstCall).to.have.been.calledWith('change:volume');
                expect(model.trigger.getCall(1)).to.have.been.calledWith('change:bitrateSelection');
                expect(model.trigger.getCall(2)).to.have.been.calledWith('change:captionsIndex');
                expect(model.trigger.getCall(3)).to.have.been.calledWith('change:captionLabel');
                expect(model.trigger.getCall(4)).to.have.been.calledWith('subtitlesTracks');
                expect(model.persistQualityLevel).to.have.callCount(1);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(1);
            });
    });

    it('does not updates the model when provider is backgrounded', function() {
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.mediaController.provider;

                programController.backgroundActiveMedia();
                sinon.spy(model, 'set');
                sinon.spy(model, 'trigger');
                sinon.spy(model, 'persistQualityLevel');
                sinon.spy(model, 'persistVideoSubtitleTrack');
                providerPlayerModelEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(model.set).to.have.callCount(0);
                expect(model.trigger).to.have.callCount(0);
                expect(model.persistQualityLevel).to.have.callCount(0);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(0);
            });
    });

    it('does not updates the model when provider is detached', function() {
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.mediaController.provider;

                programController.attached = false;
                sinon.spy(model, 'set');
                sinon.spy(model, 'trigger');
                sinon.spy(model, 'persistQualityLevel');
                sinon.spy(model, 'persistVideoSubtitleTrack');
                providerPlayerModelEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(model.set).to.have.callCount(0);
                expect(model.trigger).to.have.callCount(0);
                expect(model.persistQualityLevel).to.have.callCount(0);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(0);
            });
    });

    it('updates the model when provider is foregrounded', function() {
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.mediaController.provider;

                programController.backgroundActiveMedia();
                sinon.spy(model, 'set');
                sinon.spy(model, 'trigger');
                sinon.spy(model, 'persistQualityLevel');
                sinon.spy(model, 'persistVideoSubtitleTrack');
                providerPlayerModelEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(model.set).to.have.callCount(0);
                expect(model.trigger).to.have.callCount(0);
                expect(model.persistQualityLevel).to.have.callCount(0);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(0);
                programController.restoreBackgroundMedia();
                expect(model.set).to.have.callCount(13);
                expect(model.set.firstCall).to.have.been.calledWith('mediaElement');
                expect(model.set.getCall(1)).to.have.been.calledWith('mediaModel');
                expect(model.set.getCall(2)).to.have.been.calledWith('provider');
                expect(model.trigger).to.have.callCount(6);
                expect(model.persistQualityLevel).to.have.callCount(1);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(1);
            });
    });

    it('updates the model when provider is reattached', function() {
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.mediaController.provider;

                programController.attached = false;
                sinon.spy(model, 'set');
                sinon.spy(model, 'trigger');
                sinon.spy(model, 'persistQualityLevel');
                sinon.spy(model, 'persistVideoSubtitleTrack');
                providerPlayerModelEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(model.set).to.have.callCount(0);
                expect(model.trigger).to.have.callCount(0);
                expect(model.persistQualityLevel).to.have.callCount(0);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(0);
                programController.attached = true;
                expect(model.set).to.have.callCount(5);
                expect(model.set.firstCall).to.have.been.calledWith('attached', true);
                expect(model.trigger).to.have.callCount(6);
                expect(model.trigger.firstCall).to.have.been.calledWith('change:attached');
                expect(model.persistQualityLevel).to.have.callCount(1);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(1);
            });
    });

    it('videoless providers are detached instead of backgrounded', function() {
        programController.providers.choose = () => ({ name: 'mockVideoless', provider: MockVideolessProvider });
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.mediaController.provider;

                programController.backgroundActiveMedia();
                sinon.spy(model, 'set');
                sinon.spy(model, 'trigger');
                sinon.spy(model, 'persistQualityLevel');
                sinon.spy(model, 'persistVideoSubtitleTrack');
                providerPlayerModelEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(model.set).to.have.callCount(0);
                expect(model.trigger).to.have.callCount(0);
                expect(model.persistQualityLevel).to.have.callCount(0);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(0);
                programController.restoreBackgroundMedia();
                expect(model.set).to.have.callCount(14);
                expect(model.set.firstCall).to.have.been.calledWith('mediaElement');
                expect(model.set.getCall(1)).to.have.been.calledWith('mediaModel');
                expect(model.set.getCall(2)).to.have.been.calledWith('provider');
                expect(model.trigger).to.have.callCount(7);
                expect(model.persistQualityLevel).to.have.callCount(1);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(1);
            });
    });

    it('fires itemReady for background loaded items', function() {
        sinon.spy(model, 'trigger');
        return programController.setActiveItem(0)
            .then(function () {
                expect(model.trigger).to.have.callCount(6);
                expect(model.trigger.lastCall).to.have.been.calledWith('change:itemReady', model, true);
                programController.backgroundLoad(mp4Item);
            })
            .then(() => programController.setActiveItem(1))
            .then(function () {
                expect(model.trigger).to.have.callCount(14);
                expect(model.trigger.lastCall).to.have.been.calledWith('change:itemReady', model, true);
            });
    });
});

function expectAllEventsTriggered(callbackSpy) {
    expect(callbackSpy).to.have.callCount(providerEvents.length);
    providerEvents.forEach((event, i) => {
        expect(callbackSpy.getCall(i)).to.have.been.calledWith(event.type, event);
    });
}
