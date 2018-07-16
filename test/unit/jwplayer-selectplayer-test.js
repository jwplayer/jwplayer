import _ from 'test/underscore';
import jwplayer from 'jwplayer';

function testInstanceOfApi(api) {
    expect(api).to.be.an('object');
    expect(api.setup).to.be.a('function');
    return api;
}

describe('jwplayer function', function() {

    beforeEach(function() {
        // add fixture
        const fixture = document.createElement('div');
        fixture.id = 'test-container';
        const playerContainer = document.createElement('div');
        playerContainer.id = 'player';
        fixture.appendChild(playerContainer);
        document.body.appendChild(fixture);
    });

    afterEach(function() {
        // remove all test players
        for (let i = 10; i--;) {
            let player = jwplayer();
            if (player.remove) {
                player.remove();
            }
        }
        // remove fixture
        const fixture = document.querySelector('#test-container');
        document.body.removeChild(fixture);
    });

    it('is defined', function() {
        // Test jwplayer module
        expect(jwplayer).to.be.a('function');
    });

    it('allows plugins to register when no player is found', function() {
        const x = jwplayer();

        // It might be preferable to always return an API instance
        // even one not set to replace an element
        expect(x).to.be.an('object');
        expect(x).to.have.property('registerPlugin').which.is.a('function');
        expect(x).to.not.have.property('setup');
    });

    it('handles invalid queries by returning an object plugins can register', function() {
        // test invalid queries after a player is setup
        jwplayer('player');

        const x = jwplayer('not a valid player id');

        // It might be preferable to always return an API instance
        // even one not set to replace an element
        expect(x).to.be.an('object');
        expect(x).to.have.property('registerPlugin').which.is.a('function');
        expect(x).to.not.have.property('setup');
    });

    it('returns a new api instance when given an element id', function() {
        testInstanceOfApi(jwplayer('player'));
    });

    it('returns a new api instance when given an element with an id', function() {
        const element = document.querySelector('#player');
        testInstanceOfApi(jwplayer(element));
    });

    it('returns a new api instance when given an element with no id not in the DOM', function() {
        const element = document.createElement('div');
        const x = testInstanceOfApi(jwplayer(element));

        // FIXME: this only works with one player whose id is empty ""
        // TODO: create a lookup table for players? or put the unique id on the element?
        expect(x, 'element selection returns the same instance even without an id').to.equal(jwplayer(element));
    });

    it('returns the same api instance for matching queries', function() {
        const element = document.querySelector('#player');

        const x = jwplayer('player');
        const y = jwplayer(document.createElement('div'));

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

        expect(x, 'first player instance does not equal second instance').to.not.equal(y);
    });
});
