define([
    'utils/underscore',
    'events/events',
    'events/states',
], function (_, Events, States) {
    function eventsMiddleware(model, type, data) {
        var viewable = model.get('viewable') || 0;
        return transform(type, data, { viewable: viewable });
    }

    function statesMiddleware(model, state) {
        var viewable = model.get('viewable') || 0;
        return transform(state.type, state, { viewable: viewable });
    }

    function transform(type, currentState, data) {
        var newState = {};

        switch (type) {
            case Events.JWPLAYER_MEDIA_TIME:
            case Events.JWPLAYER_AD_IMPRESSION:
            case States.PLAYING:
            case States.PAUSED: {
                newState = _.extend({}, currentState, { viewable: data.viewable });
                break;
            }
            default: {
                newState = currentState;
                break;
            }
        }

        return newState;
    }

    return {
        eventsMiddleware: eventsMiddleware,
        statesMiddleware: statesMiddleware,
    };
});
