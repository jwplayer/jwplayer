import Api from 'api/api';
import Controller from "../../src/js/controller/controller";
import { Events } from "backbone";
import MediaElementPool from '../../src/js/program/media-element-pool';
import Playlist from '../../src/js/playlist/playlist';

describe('OS Controller updatePlaylist', function() {
    let fixture;
    let playerContainer;
    let api;
    let controller;

    beforeEach(function() {
        // Add fixture
        fixture = document.createElement('div');
        playerContainer = document.createElement('div');
        playerContainer.id = 'player';
        const overlays = document.createElement('div');
        overlays.className = 'jw-overlays';
        playerContainer.appendChild(overlays);
        fixture.appendChild(playerContainer);
        document.body.appendChild(fixture);
    });

    afterEach(function() {
        // Remove fixture
        document.body.removeChild(fixture);
        if (api) {
            api.remove();
            api = null;
        }
        if (controller) {
            controller.destroy();
            controller = null;
        }
    });

    function setup(controllerInstance, config) {
        api = new Api(playerContainer);
        const mediaPool = new MediaElementPool();
        const eventListeners = {};
        const commandQueue = [];
    
        Object.assign(controllerInstance, Events);
        controllerInstance.playerSetup(config, api, playerContainer, eventListeners, commandQueue, mediaPool);
    }

    it('sets feedData and playlist on the model', function() {
        controller = new Controller();

        setup(controller, {
            playlist: [],
            localization: {},
            volume: 0,
        });

        const feedData = {
            feedId: 1,
            playlist: [{
                file: 'bar.mp4'
            }]
        };
        const playlist = Playlist(feedData.playlist);

        controller.updatePlaylist(playlist, feedData);

        expect(controller.getConfig().playlist.length).to.equal(1);
        expect(controller.getConfig().feedData).to.deep.equal({
            feedId: 1,
        });
    });

    it('without ads setting repeat to true sets loop to true then sets repeat to false', function() {
        controller = new Controller();

        setup(controller, {
            playlist: [],
            localization: {},
            volume: 0,
            repeat: true
        });

        const feedData = {
            feedId: 1,
            playlist: [{
                file: 'bar.mp4'
            }]
        };
        const playlist = Playlist(feedData.playlist);

        controller.updatePlaylist(playlist, feedData);

        expect(controller.getConfig().playlist.length).to.equal(1);
        expect(controller.getConfig().feedData).to.deep.equal({
            feedId: 1,
        });
        expect(controller.getConfig().repeat).to.equal(false);
        expect(controller.getConfig().loop).to.equal(true);
    });

    it('with ads setting repeat to true does not set loop to true', function() {
        controller = new Controller();

        setup(controller, {
            playlist: [],
            localization: {},
            volume: 0,
            repeat: true,
            advertising: {}
        });

        const feedData = {
            feedId: 1,
            playlist: [{
                file: 'bar.mp4'
            }]
        };
        const playlist = Playlist(feedData.playlist);

        controller.updatePlaylist(playlist, feedData);

        expect(controller.getConfig().playlist.length).to.equal(1);
        expect(controller.getConfig().feedData).to.deep.equal({
            feedId: 1,
        });
        expect(controller.getConfig().advertising).to.exist;
        expect(controller.getConfig().repeat).to.equal(true);
        expect(controller.getConfig().loop).to.equal(false);
    });
});
