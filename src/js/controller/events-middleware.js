import { MEDIA_TIME } from 'events/events';

define([
    'utils/underscore'
], function (_) {
    return function middleware(model, type, currentState) {
        let newState = currentState;

        switch (type) {
            case MEDIA_TIME:
            case 'beforePlay':
            case 'pause':
            case 'play':
            case 'ready': {
                const viewable = model.get('viewable');
                // Don't add viewable to events if we don't know we're viewable
                if (viewable !== undefined) {
                    // Emit viewable as 0 or 1
                    newState = Object.assign({}, currentState, { viewable: viewable });
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
