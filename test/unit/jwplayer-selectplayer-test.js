import _ from 'test/underscore';
import $ from 'jquery';
import jwplayer from 'jwplayer';
import GlobalApi from 'api/global-api';

function testInstanceOfApi(api) {
    expect(_.isObject(api), 'jwplayer({dom id}) returned an object').to.be.true;
    expect(_.isFunction(api.setup), 'object.setup is a function').to.be.true;
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
        expect(_.isFunction(jwplayer), 'jwplayer is a function').to.be.true;
    });

    it('allows plugins to register when no player is found', function() {
        const x = jwplayer();

        // It might be preferable to always return an API instance
        // even one not set to replace an element
        expect(typeof(x), 'jwplayer({dom id}) returned an object').to.be.equal('object');
        expect(x.registerPlugin, 'object.registerPlugin is a function').to.equal(GlobalApi.registerPlugin);
        expect(x.setup, 'object.setup is not defined').to.equal(undefined);
    });

    it('handles invalid queries by returning an object plugins can register', function() {
        // test invalid queries after a player is setup
        jwplayer('player');

        const x = jwplayer('not a valid player id');

        // It might be preferable to always return an API instance
        // even one not set to replace an element
        expect(typeof(x), 'jwplayer({dom id}) returned an object').to.be.equal('object');
        expect(x.registerPlugin, 'object.registerPlugin is a function').to.equal(GlobalApi.registerPlugin);
        expect(x.setup, 'object.setup is not defined').to.equal(undefined);
    });

    it('returns a new api instance when given an element id', function() {
        testInstanceOfApi(jwplayer('player'));
    });

    it('returns a new api instance when given an element with an id', function() {
        const element = $('#player')[0];
        testInstanceOfApi(jwplayer(element));
    });

    it('returns a new api instance when given an element with no id not in the DOM', function() {
        const element = $('<div></div>')[0];
        const x = testInstanceOfApi(jwplayer(element));

        // FIXME: this only works with one player whose id is empty ""
        // TODO: create a lookup table for players? or put the unique id on the element?
        expect(x, 'element selection returns the same instance even without an id').to.equal(jwplayer(element));
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

        expect(uniquePlayers.length, 'all queries return the same instance').to.equal(1);
        expect(jwplayer(0), 'jwplayer(0) returns the first player').to.equal(x);
        expect(jwplayer(1), 'jwplayer(1) returns the seconds player').to.equal(y);

        expect(x !== y, 'first player instance does not equal second instance').to.be.true;
    });
});
