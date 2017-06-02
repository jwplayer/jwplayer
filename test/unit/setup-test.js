define([
    'test/underscore',
    'jquery',
    'api/api',
], function (_, $, Api) {

    describe('Setup', function() {

        it('fails when playlist is not an array', function (done) {

            var readyHandler = function() {
                assert.isOk(false, 'setup should not succeed');
            };

            var errorHandler = function (message) {
                assert.isOk(message, 'setup failed with message: ' + message);
            };

            var model = {};
            testSetup(done, model, readyHandler, errorHandler);

            model = { playlist: '' };
            testSetup(done, model, readyHandler, errorHandler);

            model = { playlist: 1 };
            testSetup(done, model, readyHandler, errorHandler);

            model = { playlist: true };
            testSetup(done, model, readyHandler, errorHandler);
            done();
        });

        it('fails if playlist is empty', function (done) {
            var model = {
                playlist: []
            };

            testSetup(done, model, function() {
                assert.isOk(false, 'setup should not succeed');
            }, function (message) {
                assert.isOk(message, 'setup failed with message: ' + message);
            });
            done();
        });

        it('fails when playlist items are filtered out', function (done) {
            var model = {
                playlist: [{ sources: [{ file: 'file.foo' }] }]
            };

            var playlist;
            testSetup(done, model, function() {
                // 'this' is the api instance
                playlist = this.getPlaylist();
                assert.deepEqual(playlist, [], 'playlist is an empty array');
                assert.isOk(false, 'setup should not succeed');
            }, function (message) {
                playlist = this.getPlaylist();
                assert.deepEqual(playlist, [], 'playlist is an empty array');
                assert.isOk(message, 'setup failed with message: ' + message);
            });
            done();
        });

        it('succeeds when model.playlist.sources is valid', function (done) {
            var model = {
                playlist: [{ sources: [{ file: 'http://playertest.longtailvideo.com/mp4.mp4' }] }]
            };

            testSetup(done, model, function() {
                assert.isOk(true, 'setup ok');
            }, function (message) {
                assert.isOk(false, 'setup failed with message: ' + message);
            });
            done();
        });

        it('modifies config', function (done) {
            var options = {
                file: 'http://playertest.longtailvideo.com/mp4.mp4',
                aspectratio: '4:3',
                width: '100%'
            };
            var optionsOrig = _.extend({}, options);

            testSetup(done, options, function() {
                assert.isOk(true, 'setup ok');
                assert.notEqual(options, optionsOrig, 'config was modified');
            }, function (message) {
                assert.isOk(true, 'setup failed with message: ' + message);
                assert.notEqual(options, optionsOrig, 'config was modified');
            });
            done();
        });

        function testSetup(done, model, success, error) {
            var container = createContainer('player-' + Math.random().toFixed(12).substr(2));
            var api = new Api(container, _.noop);
            api.setup(model);

            api.on('ready', function() {
                clearTimeout(timeout);
                success.call(api);
                try {
                    api.remove();
                } catch (e) {
                    assert.isNotOk(e.toString());
                }
            });
            api.on('setupError', function (e) {
                clearTimeout(timeout);
                error.call(api, e.message);
                try {
                    api.remove();
                } catch (evt) {
                    assert.isNotOk(evt.toString());
                }
            });
            var timeout = setTimeout(function() {
                assert.isNotOk('Setup timed out');
                try {
                    api.remove();
                } catch (e) {
                    assert.isNotOk(e.toString());
                }
            }, 8000);
            done();
            return api;
        }

        function createContainer(id) {
            return $('<div id="' + id + '"></div>')[0];
        }

    });
});
