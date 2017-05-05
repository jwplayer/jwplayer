define([
    'test/underscore',
    'jquery',
    'jwplayer'
], function (_, $, jwplayer) {

    describe('jwplayer function', function() {

        var append = function (html) {
            var div = $('<div/>');
            var $element = $(html);
            div.append($element);
            return $element[0];
        };

        var testInstanceOfApi = function (assert, api) {
            assert.isOk(_.isObject(api), 'jwplayer({dom id}) returned an object');
            assert.isOk(_.isFunction(api.setup), 'object.setup is a function');
            return api;
        };

        it('is defined', function() {
            // Test jwplayer module
            assert.isOk(_.isFunction(jwplayer), 'jwplayer is a function');
        });

        it('allows plugins to register when no player is found', function() {
            var x = jwplayer();

            // It might be preferable to always return an API instance
            // even one not set to replace an element
            assert.isOk(_.isObject(x), 'jwplayer({dom id}) returned an object');
            assert.isOk(_.isFunction(x.registerPlugin), 'object.registerPlugin is a function');
            assert.strictEqual(x.setup, undefined, 'object.setup is not defined');
        });

        it('handles invalid queries by returning an object plugins can register', function() {
            // test invalid queries after a player is setup
            append('<div id="player"></div>');

            jwplayer('player');

            var x = jwplayer('not a valid player id');

            // It might be preferable to always return an API instance
            // even one not set to replace an element
            assert.isOk(_.isObject(x), 'jwplayer({dom id}) returned an object');
            assert.isOk(_.isFunction(x.registerPlugin), 'object.registerPlugin is a function');
            assert.equal(x.setup, undefined, 'object.setup is not defined');
        });

        it.skip('returns a new api instance when given an element id', function() {
            append('<div id="player"></div>');

            testInstanceOfApi(assert, jwplayer('player')).remove();
        });

        it('returns a new api instance when given an element with an id', function() {
            var element = append('<div id="player"></div>');

            testInstanceOfApi(assert, jwplayer(element)).remove();
        });

        it('returns a new api instance when given an element with no id not in the DOM', function() {
            var element = $('<div></div>')[0];

            var x = testInstanceOfApi(assert, jwplayer(element));

            // FIXME: this only works with one player whose id is empty ""
            // TODO: create a lookup table for players? or put the unique id on the element?
            assert.strictEqual(x, jwplayer(element), 'element selection returns the same instance even without an id');

            x.remove();
        });

        it.skip('returns the same api instance for matching queries', function() {
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


            assert.equal(uniquePlayers.length, 1, 'all queries return the same instance');
            assert.strictEqual(jwplayer(0), x, 'jwplayer(0) returns the first player');
            assert.strictEqual(jwplayer(1), y, 'jwplayer(1) returns the seconds player');

            assert.isOk(x !== y, 'first player instance does not equal second instance');

            x.remove();
            y.remove();
        });
    });
});

