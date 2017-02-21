define([
    'utils/underscore',
    'events/events',
], function (_, Events) {
    return function middleware(model, type, currentState) {
        var newState = currentState;

        switch (type) {
            case Events.JWPLAYER_MEDIA_TIME:
            case 'play':
            case 'pause': {
                var visibility = model.get('visibility');
                if (!_.isUndefined(visibility)) {
                    var viewable = Math.round(visibility);
                    newState = _.extend({}, currentState, { viewable: viewable });
                }
                break;
            }
            default: {
                break;
            }
        }

        return newState;
    };
});
