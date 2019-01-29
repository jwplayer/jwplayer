import Model from 'controller/model';
import ProgramController from 'program/program-controller';
import MediaElementPool from 'program/media-element-pool';
import { Features } from 'environment/environment';
import MockProvider, { MockVideolessProvider } from 'mock/mock-provider';
import sinon from 'sinon';
import {
    PlayerError,
    MSG_CANT_PLAY_VIDEO,
    ERROR_PLAYLIST_ITEM_MISSING_SOURCE
} from 'api/errors';

const defaultConfig = {
    playlist: null,
    mediaContainer: null,
    volume: 20,
    mute: false,
    edition: 'enterprise',
    backgroundLoading: Features.backgroundLoading
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
        type: 'meta',
        metadataType: 'unknown'
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

function getReadOnlyError() {
    // This creates an error object with read-only message and code properties
    // This is to mock DOMException which can occur during setup and must be replaced
    // with a player error
    return Object.create(Error.prototype, {
        code: {
            writable: false,
            configurable: false,
            value: 123
        },
        message: {
            writable: false,
            configurable: false,
            value: 'Read-only Error object'
        },
    });
}

describe('ProgramController', function () {
    const sandbox = sinon.createSandbox();
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
        sandbox.restore();
    });

    it('forwards provider events', function() {
        const callback = sandbox.spy();
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
        const callback = sandbox.spy();
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
        const callback = sandbox.spy();
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
        const callback = sandbox.spy();
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
        const callback = sandbox.spy();
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
        const callback = sandbox.spy();
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

        sandbox.spy(model, 'trigger');
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

                sandbox.spy(model, 'set');
                sandbox.spy(model, 'trigger');
                sandbox.spy(model, 'persistQualityLevel');
                sandbox.spy(model, 'persistVideoSubtitleTrack');
                providerPlayerModelEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(model.set).to.have.callCount(5);
                expect(model.set.firstCall).to.have.been.calledWith('volume', 10);
                expect(model.set.getCall(1)).to.have.been.calledWith('bitrateSelection', 200);
                expect(model.set.getCall(2)).to.have.been.calledWith('qualityLabel', 'level2');
                expect(model.set.getCall(3)).to.have.been.calledWith('captionsIndex', 0);
                expect(model.set.getCall(4)).to.have.been.calledWith('captionLabel', 'Off');
                expect(model.trigger).to.have.callCount(6);
                expect(model.trigger.firstCall).to.have.been.calledWith('change:volume');
                expect(model.trigger.getCall(1)).to.have.been.calledWith('change:bitrateSelection');
                expect(model.trigger.getCall(2)).to.have.been.calledWith('change:qualityLabel');
                expect(model.trigger.getCall(3)).to.have.been.calledWith('change:captionsIndex');
                expect(model.trigger.getCall(4)).to.have.been.calledWith('change:captionLabel');
                expect(model.trigger.getCall(5)).to.have.been.calledWith('subtitlesTracks');
                expect(model.persistQualityLevel).to.have.callCount(1);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(1);
            });
    });

    it('does not updates the model when provider is backgrounded', function() {
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.mediaController.provider;

                programController.backgroundActiveMedia();
                sandbox.spy(model, 'set');
                sandbox.spy(model, 'trigger');
                sandbox.spy(model, 'persistQualityLevel');
                sandbox.spy(model, 'persistVideoSubtitleTrack');
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
                sandbox.spy(model, 'set');
                sandbox.spy(model, 'trigger');
                sandbox.spy(model, 'persistQualityLevel');
                sandbox.spy(model, 'persistVideoSubtitleTrack');
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
                sandbox.spy(model, 'set');
                sandbox.spy(model, 'trigger');
                sandbox.spy(model, 'persistQualityLevel');
                sandbox.spy(model, 'persistVideoSubtitleTrack');
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

    it('updates the model when provider is reattached', function() {
        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.mediaController.provider;

                programController.attached = false;
                sandbox.spy(model, 'set');
                sandbox.spy(model, 'trigger');
                sandbox.spy(model, 'persistQualityLevel');
                sandbox.spy(model, 'persistVideoSubtitleTrack');
                providerPlayerModelEvents.forEach(event => {
                    provider.trigger(event.type, event);
                });
                expect(model.set).to.have.callCount(0);
                expect(model.trigger).to.have.callCount(0);
                expect(model.persistQualityLevel).to.have.callCount(0);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(0);
                programController.attached = true;
                expect(model.set).to.have.callCount(5);
                expect(model.trigger).to.have.callCount(6);
                expect(model.persistQualityLevel).to.have.callCount(1);
                expect(model.persistVideoSubtitleTrack).to.have.callCount(1);
            });
    });

    it('videoless providers are detached instead of backgrounded', function() {
        sandbox.stub(programController.providers,
            'choose').callsFake(() => ({ name: 'mockVideoless', provider: MockVideolessProvider }));

        return programController.setActiveItem(0)
            .then(function () {
                const provider = programController.mediaController.provider;

                programController.backgroundActiveMedia();
                sandbox.spy(model, 'set');
                sandbox.spy(model, 'trigger');
                sandbox.spy(model, 'persistQualityLevel');
                sandbox.spy(model, 'persistVideoSubtitleTrack');
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
        sandbox.spy(model, 'trigger');
        const changeMediaElement = model.get('backgroundLoading') ? 1 : 0;
        return programController.setActiveItem(0)
            .then(function () {
                expect(model.trigger).to.have.callCount(5 + changeMediaElement);
                expect(model.trigger.lastCall).to.have.been.calledWith('change:itemReady', model, true);
                programController.backgroundLoad(mp4Item);
            })
            .then(() => programController.setActiveItem(1))
            .then(function () {
                expect(model.trigger).to.have.callCount(11 + changeMediaElement * 2);
                expect(model.trigger.lastCall).to.have.been.calledWith('change:itemReady', model, true);
            });
    });

    describe('errors', function () {
        it('throws a PlayerError after failing to load a provider', function () {
            const providersMock = {
                load() {
                    return Promise.reject({
                        code: 153
                    });
                },
                choose() {
                    return {};
                }
            };

            programController.providers = providersMock;
            return new Promise((resolve, reject) => {
                programController._setupMediaController('foo')
                    .then(() => {
                        reject(new Error('Should have thrown an error'));
                    })
                    .catch(resolve);
            }).then(e => {
                expect(e.code).to.equal(153);
            });
        });

        it('throws a PlayerError when attempting to set an item with no source as active', function () {
            model.attributes.playlist = [{}];
            return new Promise((resolve, reject) => {
                programController.setActiveItem(0)
                    .then(() => {
                        reject(new Error('Should have thrown an error'));
                    })
                    .catch(resolve);
            }).then(e => {
                expect(e).instanceof(PlayerError);
                expect(e.code).to.equal(ERROR_PLAYLIST_ITEM_MISSING_SOURCE);
                expect(e.key).to.equal(MSG_CANT_PLAY_VIDEO);
            });
        });

        it('forwards exceptions thrown in setActiveItem', function() {
            sandbox.stub(programController,
                '_setupMediaController').callsFake(() => Promise.reject(getReadOnlyError()));
            return new Promise((resolve, reject) => {
                programController.setActiveItem(0)
                    .then(() => {
                        reject(new Error('Should have thrown an error'));
                    })
                    .catch(resolve);
            }).then(e => {
                expect(() => {
                    e.message = 'New error message.';
                }).to.throw();
                expect(e.code).to.equal(123);
                expect(e.message).to.equal('Read-only Error object');
            });
        });

        //
    });
});

function expectAllEventsTriggered(callbackSpy) {
    expect(callbackSpy).to.have.callCount(providerEvents.length);
    providerEvents.forEach((event, i) => {
        expect(callbackSpy.getCall(i)).to.have.been.calledWith(event.type, event);
    });
}
