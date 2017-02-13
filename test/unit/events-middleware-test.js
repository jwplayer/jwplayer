define([
    'utils/underscore',
    'controller/events-middleware',
], function (_, middleware) {
    QUnit.module('events-middleware');
    var test = QUnit.test.bind(QUnit);
    var eventsMiddleware = middleware.eventsMiddleware;
    var statesMiddleware = middleware.statesMiddleware;

    var mockModel = function(attributes) {
        var model = {
            get: function (attribute) {
                return this[attribute];
            }
        };

        return _.extend({}, model, attributes);
    }

    test('should add viewable to the play event', function (assert) {
        var model = mockModel({ viewable: true });
        var expected = { type: 'playing', viewable: true };
        var actual = statesMiddleware(model, { type: 'playing' });
        assert.deepEqual(actual, expected);
    });

    test('should add viewable to the paused event', function (assert) {
        var model = mockModel({ viewable: true });
        var expected = { type: 'paused', viewable: true };
        var actual = statesMiddleware(model, { type: 'paused' });
        assert.deepEqual(actual, expected);
    });

    test('should add viewable to the time event', function (assert) {
        var model = mockModel({ viewable: true });
        var expected = { viewable: true };
        var actual = eventsMiddleware(model, 'time', {});
        assert.deepEqual(actual, expected);
    });

    test('should add viewable to the adImpression event', function (assert) {
        var model = mockModel({ viewable: true });
        var expected = { viewable: true };
        var actual = eventsMiddleware(model, 'adImpression', {});
        assert.deepEqual(actual, expected);
    })
});