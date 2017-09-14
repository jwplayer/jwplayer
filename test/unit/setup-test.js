import Api from 'api/api';
import ApiSettings from 'api/api-settings';
import $ from 'jquery';
import {
    install as installVideoPolyfill,
    uninstall as uninstallVideoPolyfill
} from 'mock/video-element-polyfill';

describe('Setup', function() {
    this.timeout(3000);

    beforeEach(function() {
        installVideoPolyfill();
        ApiSettings.debug = true;
        // remove fixture
        $('body').append('<div id="test-container"><div id="player"></div></div>');
    });

    afterEach(function() {
        ApiSettings.debug = false;
        // remove fixture
        $('#test-container').remove();
        uninstallVideoPolyfill();
    });

    it('fails when playlist is undefined', function (done) {

        var readyHandler = function() {
            expect(false, 'setup should not succeed').to.be.true;
        };

        var errorHandler = function (message) {
            expect(message, 'setup failed with message: ' + message).to.be.true;
        };

        testSetup(done, {}, readyHandler, errorHandler);
    });

    it('fails when playlist is an empty string', function (done) {

        var readyHandler = function() {
            expect(false, 'setup should not succeed').to.be.true;
        };

        var errorHandler = function (message) {
            expect(message, 'setup failed with message: ' + message).to.be.true;
        };

        testSetup(done, { playlist: '' }, readyHandler, errorHandler);
    });

    it('fails when playlist is a number', function (done) {

        var readyHandler = function() {
            expect(false, 'setup should not succeed').to.be.true;
        };

        var errorHandler = function (message) {
            expect(message, 'setup failed with message: ' + message).to.be.true;
        };

        testSetup(done, { playlist: 1 }, readyHandler, errorHandler);
    });

    it('fails when playlist is a boolean', function (done) {

        var readyHandler = function() {
            expect(false, 'setup should not succeed').to.be.true;
        };

        var errorHandler = function (message) {
            expect(message, 'setup failed with message: ' + message).to.be.true;
        };

        testSetup(done, { playlist: true }, readyHandler, errorHandler);
    });

    it('fails if playlist is empty', function (done) {
        var model = {
            playlist: []
        };

        testSetup(done, model, function() {
            expect(false, 'setup should not succeed').to.be.true;
            done();
        }, function (message) {
            expect(message, 'setup failed with message: ' + message).to.be.true;
            done();
        });
    });

    it('fails when playlist items are filtered out', function (done) {
        var model = {
            playlist: [{ sources: [{ file: 'file.foo' }] }]
        };

        var playlist;
        testSetup(done, model, function() {
            // 'this' is the api instance
            playlist = this.getPlaylist();
            expect(playlist, 'playlist is an empty array').to.be.an('array').that.is.empty;
            expect(false, 'setup should not succeed').to.be.true;
            done();
        }, function (message) {
            playlist = this.getPlaylist();
            expect(playlist, 'playlist is an empty array').to.be.an('array').that.is.empty;
            expect(message, 'setup failed with message: ' + message).to.be.true;
            done();
        });
        done();
    });

    it('succeeds when model.playlist.sources is valid', function (done) {
        var model = {
            playlist: [{ sources: [{ file: 'http://playertest.longtailvideo.com/mp4.mp4' }] }]
        };

        testSetup(done, model, function() {
            expect(true, 'setup ok').to.be.true;
            done();
        }, function (message) {
            expect(false, 'setup failed with message: ' + message).to.be.true;
            done();
        });
    });

    function testSetup(done, model, success, error) {
        var container = $('#player')[0];
        var api = new Api(container);
        api.setup(model);

        api.on('ready', function() {
            success.call(api);
            try {
                api.remove();
            } catch (e) {
                expect(e.toString()).to.be.false;
            }
            done();
        });
        api.on('setupError', function (e) {
            error.call(api, e.message);
            try {
                api.remove();
            } catch (evt) {
                expect(evt.toString()).to.be.false;
            }
            done();
        });
        done();
        return api;
    }
});
