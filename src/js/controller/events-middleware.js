define([
    'utils/underscore',
    'events/events',
], function (_, Events) {
    return function middleware(model, type, currentState) {
        var newState = currentState;

        switch (type) {
            case Events.JWPLAYER_MEDIA_TIME:
            case 'beforePlay':
            case 'pause':
            case 'play':
            case 'ready': {
                var viewable = model.get('viewable');
                // Don't add viewable to events if we don't know we're viewable
                if (!_.isUndefined(viewable)) {
                    // Emit viewable as 0 or 1
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
