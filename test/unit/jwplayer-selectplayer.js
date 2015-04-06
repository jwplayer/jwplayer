define([
    'test/underscore',
    'jquery',
    'jwplayer',
    'api/global-api'
], function (_, $, jwplayer, globalApi) {
    /* jshint qunit: true */

    module('jwplayer function');

    var append = function(html) {
        var $element = $(html);
        $('#qunit-fixture').append($element);
        return $element[0];
    };

    var testInstanceOfApi = function(api) {
        ok(_.isObject(api), 'jwplayer({dom id}) returned an object');
        ok(_.isFunction(api.setup), 'object.setup is a function');
        return api;
    };

    test('is defined', function() {
        // Test jwplayer module
        ok(_.isFunction(jwplayer), 'jwplayer is a function');

        strictEqual(jwplayer, globalApi.selectPlayer, 'jwplayer() is the same as globalApi.selectPlayer()');
    });

    test('allows plugins to register when no player is found', function() {
        var x = jwplayer();

        // It might be preferable to always return an API instance
        // even one not set to replace an element
        ok(_.isObject(x), 'jwplayer({dom id}) returned an object');
        ok(_.isFunction(x.registerPlugin), 'object.registerPlugin is a function');
        strictEqual(x.setup, undefined, 'object.setup is not defined');
    });

    test('handles invalid queries by returning an object plugins can register', function() {
        // test invalid queries after a player is setup
        append('<div id="player"></div>');

        var a = jwplayer('player');

        var x = jwplayer('not a valid player id');

        // It might be preferable to always return an API instance
        // even one not set to replace an element
        ok(_.isObject(x), 'jwplayer({dom id}) returned an object');
        ok(_.isFunction(x.registerPlugin), 'object.registerPlugin is a function');
        strictEqual(x.setup, undefined, 'object.setup is not defined');

        a.remove();
    });

    test('returns a new api instance when given an element id', function() {
        append('<div id="player"></div>');

        testInstanceOfApi( jwplayer('player') ).remove();
    });

    test('returns a new api instance when given an element with an id', function() {
        var element = append('<div id="player"></div>');

        testInstanceOfApi( jwplayer(element) ).remove();
    });

    test('returns a new api instance when given an element with no id not in the DOM', function() {
        var element = $('<div></div>')[0];

        var x = testInstanceOfApi( jwplayer(element) );

        // FIXME: this only works with one player whose id is empty ""
        // TODO: create a lookup table for players? or put the unique id on the element?
        strictEqual(x, jwplayer(element), 'element selection returns the same instance even without an id');

        x.remove();
    });

    test('returns the same api instance for matching queries', function() {
        var element = append('<div id="player"></div>');

        var x = jwplayer('player');
        var y = jwplayer($('<div></div>')[0]);

        var uniquePlayers = _.uniq([
            x,
            jwplayer(0),
            jwplayer(),
            jwplayer(element),
            jwplayer(element.id),
            // as an optimization, anything false will return _instances[0]
            jwplayer(''),
            jwplayer(false)
        ]);


        equal(uniquePlayers.length, 1, 'all queries return the same instance');
        strictEqual(jwplayer(0), x, 'jwplayer(0) returns the first player');
        strictEqual(jwplayer(1), y, 'jwplayer(1) returns the seconds player');

        ok(x !== y, 'first player instance does not equal second instance');

        x.remove();
        y.remove();
    });
});
