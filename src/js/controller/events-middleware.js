define([
    'utils/underscore',
    'events/events',
], function (_, Events) {
    return function middleware(model, type, currentState) {
        var newState = {};

        switch (type) {
            case Events.JWPLAYER_MEDIA_TIME:
            case Events.JWPLAYER_AD_IMPRESSION:
            case 'play':
            case 'pause': {
                var viewable = model.get('viewable') || 0;
                newState = _.extend({}, currentState, { viewable: viewable });
                break;
            }
            default: {
                newState = currentState;
                break;
            }
        }

        return newState;
    };
});
