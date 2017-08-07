import _ from 'test/underscore';
import $ from 'jquery';
import jwplayer from 'jwplayer';

function testInstanceOfApi(assert, api) {
    assert.isOk(_.isObject(api), 'jwplayer({dom id}) returned an object');
    assert.isOk(_.isFunction(api.setup), 'object.setup is a function');
    return api;
}

describe('jwplayer function', function() {

    beforeEach(function() {
        // remove fixture
        $('body').append('<div id="test-container"><div id="player"></div></div>');
    });

    afterEach(function() {
        // remove all test players
        for (let i = 10; i--;) {
            let player = jwplayer();
            if (player.remove) { player.remove(); }
        }
        // remove fixture
        $('#test-container').remove();
    });

    it('is defined', function() {
        // Test jwplayer module
        assert.isOk(_.isFunction(jwplayer), 'jwplayer is a function');
    });

    it.skip('allows plugins to register when no player is found', function() {
        const x = jwplayer();

        // It might be preferable to always return an API instance
        // even one not set to replace an element
        assert.isOk(_.isObject(x), 'jwplayer({dom id}) returned an object');
        assert.isOk(_.isFunction(x.registerPlugin), 'object.registerPlugin is a function');
        assert.strictEqual(x.setup, undefined, 'object.setup is not defined');
    });

    it.skip('handles invalid queries by returning an object plugins can register', function() {
        // test invalid queries after a player is setup
        jwplayer('player');

        const x = jwplayer('not a valid player id');

        // It might be preferable to always return an API instance
        // even one not set to replace an element
        assert.isOk(_.isObject(x), 'jwplayer({dom id}) returned an object');
        assert.isOk(_.isFunction(x.registerPlugin), 'object.registerPlugin is a function');
        assert.equal(x.setup, undefined, 'object.setup is not defined');
    });

    it('returns a new api instance when given an element id', function() {
        testInstanceOfApi(assert, jwplayer('player'));
    });

    it('returns a new api instance when given an element with an id', function() {
        const element = $('#player')[0];
        testInstanceOfApi(assert, jwplayer(element));
    });

    it('returns a new api instance when given an element with no id not in the DOM', function() {
        const element = $('<div></div>')[0];
        const x = testInstanceOfApi(assert, jwplayer(element));

        // FIXME: this only works with one player whose id is empty ""
        // TODO: create a lookup table for players? or put the unique id on the element?
        assert.strictEqual(x, jwplayer(element), 'element selection returns the same instance even without an id');
    });

    it('returns the same api instance for matching queries', function() {
        const element = $('#player')[0];

        const x = jwplayer('player');
        const y = jwplayer($('<div></div>')[0]);

        const uniquePlayers = _.uniq([
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
    });
});
