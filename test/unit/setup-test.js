define([
    'test/underscore',
    'jquery',
    'api/api',
], function (_, $, Api) {
    /* jshint qunit:true */

    QUnit.module('Setup');
    var test = QUnit.test.bind(QUnit);

    test('fails when playlist is not an array', function(assert) {

        var readyHandler = function() {
            assert.ok(false, 'setup should not succeed');
        };

        var errorHandler = function(message) {
            assert.ok(message, 'setup failed with message: ' + message);
        };

        var model = {};
        testSetup(model, readyHandler, errorHandler, assert);

        model = { playlist : '' };
        testSetup(model, readyHandler, errorHandler, assert);

        // model = { playlist : function() {} };
        // testSetup(model, readyHandler, errorHandler, assert);

        model = { playlist : 1 };
        testSetup(model, readyHandler, errorHandler, assert);

        model = { playlist : true };
        testSetup(model, readyHandler, errorHandler, assert);
    });

    test('fails if playlist is empty', function(assert) {
        var model = {
            playlist: []
        };

        testSetup(model, function() {
            assert.ok(false, 'setup should not succeed');
        }, function(message) {
            assert.ok(message, 'setup failed with message: ' + message);
        }, assert);
    });

    test('fails when playlist items are filtered out', function(assert) {
        var model = {
            playlist: [{sources:[{file:'file.foo'}]}]
        };

        var playlist;
        testSetup(model, function() {
            // 'this' is the api instance
            playlist = this.getPlaylist();
            assert.deepEqual(playlist, [], 'playlist is an empty array');
            assert.ok(false, 'setup should not succeed');
        }, function(message) {
            playlist = this.getPlaylist();
            assert.deepEqual(playlist, [], 'playlist is an empty array');
            assert.ok(message, 'setup failed with message: ' + message);
        }, assert);
    });

    /*
    test('fails after timeout', function(assert) {
        var model = {
            setupTimeout: 0.001,
            playlist: [{sources:[{file:'file.mp4'}]}],
            skin: '//ssl.p.jwpcdn.com/player/v/7.0.0/skins/bekle.css'
        };

        testSetup(model, function() {
            assert.ok(false, 'setup should not succeed');
        }, function(message) {
            assert.ok(message, 'setup failed with message: ' + message);
        }, assert);
    });

    test('fails - skin error', function(assert) {
        var model = getModel({
            playlist: [{sources:[{file:'file.mp4'}]}],
            skin: '404.xml'
        });

        testSetup(model, function() {
            assert.ok(false, 'setup should not succeed');
        }, function(message) {
            assert.ok(message, 'setup failed with message: ' + message);
        }, assert);
    });
     */

    test('succeeds when model.playlist.sources is valid', function(assert) {
        var model = {
            playlist: [{sources:[{file:'http://playertest.longtailvideo.com/mp4.mp4'}]}]
        };

        testSetup(model, function() {
            assert.ok(true, 'setup ok');
        }, function(message) {
            assert.ok(false, 'setup failed with message: ' + message);
        }, assert);
    });

    /*
    test('can be cancelled', function(assert) {
        var model = {
            playlist: [{sources:[{file:'file.mp4'}]}]
        };

        var done = assert.async();

        var setup = testSetup(model, function() {
            assert.ok(false, 'setup should have been cancelled');
        }, function(message) {
            assert.ok(false, 'setup failed with message: ' + message);
        }, assert);

        // cancel setup
        setup.destroy();

        _.defer(function() {
            assert.ok(true, 'so far so good');
            done();
        }, 0);
    });
    */

    test('modifies config', function(assert) {
        var options = {
            file: 'http://playertest.longtailvideo.com/mp4.mp4',
            aspectratio: '4:3',
            width: '100%'
        };
        var optionsOrig = _.extend({}, options);

        var model = options;

        testSetup(model, function() {
            assert.ok(true, 'setup ok');
            assert.notEqual(options, optionsOrig, 'config was modified');
        }, function(message) {
            assert.ok(true, 'setup failed with message: ' + message);
            assert.notEqual(options, optionsOrig, 'config was modified');
        }, assert);
    });

    function testSetup(model, success, error, assert) {
        var done = assert.async();
        var container = createContainer('player-' + Math.random().toFixed(12).substr(2));
        var api = new Api(container, _.noop);
        // console.log('test setup', api.id, JSON.stringify(model));
        api.setup(model);

        api.on('ready', function() {
            // console.log('ready', api.id);
            clearTimeout(timeout);
            success.call(api);
            done();
            api.remove();
        });
        api.on('setupError', function(e) {
            // console.log('setupError', api.id);
            clearTimeout(timeout);
            error.call(api, e.message);
            done();
            api.remove();
        });
        var timeout = setTimeout(function() {
            // console.log('timeout', api.id);
            assert.notOk('Setup timed out');
            done();
            api.remove();
        }, 8000);
        return api;
    }

    function createContainer(id) {
        var container = $('<div id="' + id + '"></div>')[0];
        $('#qunit-fixture').append(container);
        return container;
    }

});
