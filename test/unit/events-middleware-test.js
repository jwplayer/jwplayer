import _ from 'test/underscore';
import middleware from 'controller/events-middleware';

describe('events-middleware', function() {

    var mockModel = function (attributes) {
        var model = {
            get: function (attribute) {
                return this[attribute];
            }
        };

        return Object.assign({}, model, attributes);
    };

    it('should add viewable to the play event', function() {
        var model = mockModel({ viewable: 1 });
        var expected = { viewable: 1, foo: 'bar' };
        var actual = middleware(model, 'play', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('should add viewable to the paused event', function() {
        var model = mockModel({ viewable: 1 });
        var expected = { viewable: 1, foo: 'bar' };
        var actual = middleware(model, 'pause', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('should add viewable to the time event', function() {
        var model = mockModel({ viewable: 1 });
        var expected = { viewable: 1, foo: 'bar' };
        var actual = middleware(model, 'time', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('should add viewable to the beforePlay event', function() {
        var model = mockModel({ viewable: 1 });
        var expected = { viewable: 1, foo: 'bar' };
        var actual = middleware(model, 'beforePlay', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('should add viewable to the ready event', function() {
        var model = mockModel({ viewable: 1 });
        var expected = { viewable: 1, foo: 'bar' };
        var actual = middleware(model, 'ready', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('should not add viewable if visibility is undefined', function() {
        var model = mockModel({ viewable: undefined });
        var expected = { foo: 'bar' };
        var actual = middleware(model, 'time', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('does not modify original data when the type does not have a case', function() {
        var expected = { foo: 'bar' };
        var actual = middleware(mockModel({}), 'cat', expected);
        expect(actual).to.equal(expected);
    });
});
