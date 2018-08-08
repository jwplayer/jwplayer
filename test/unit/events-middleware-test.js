import middleware from 'controller/events-middleware';

describe('events-middleware', function() {

    const mockModel = function (attributes) {
        const model = {
            get: function (attribute) {
                return this[attribute];
            }
        };

        return Object.assign({}, model, attributes);
    };

    it('should add viewable to the play event', function() {
        const model = mockModel({ viewable: 1 });
        const expected = { viewable: 1, foo: 'bar' };
        const actual = middleware(model, 'play', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('should add viewable to the paused event', function() {
        const model = mockModel({ viewable: 1 });
        const expected = { viewable: 1, foo: 'bar' };
        const actual = middleware(model, 'pause', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('should add viewable to the time event', function() {
        const model = mockModel({ viewable: 1 });
        const expected = { viewable: 1, foo: 'bar' };
        const actual = middleware(model, 'time', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('should add viewable to the beforePlay event', function() {
        const model = mockModel({ viewable: 1 });
        const expected = { viewable: 1, foo: 'bar' };
        const actual = middleware(model, 'beforePlay', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('should add viewable to the ready event', function() {
        const model = mockModel({ viewable: 1 });
        const expected = { viewable: 1, foo: 'bar' };
        const actual = middleware(model, 'ready', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('should not add viewable if visibility is undefined', function() {
        const model = mockModel({ viewable: undefined });
        const expected = { foo: 'bar' };
        const actual = middleware(model, 'time', { foo: 'bar' });
        expect(expected).to.deep.equal(actual);
    });

    it('does not modify original data when the type does not have a case', function() {
        const expected = { foo: 'bar' };
        const actual = middleware(mockModel({}), 'cat', expected);
        expect(actual).to.equal(expected);
    });
});
