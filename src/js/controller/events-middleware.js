import { MEDIA_TIME, MEDIA_BEFOREPLAY, READY, WARNING } from 'events/events';
export default function middleware(model, type, currentState) {
    let newState = currentState;

    switch (type) {
        case MEDIA_TIME:
        case MEDIA_BEFOREPLAY:
        case 'pause':
        case 'play':
        case READY: {
            const viewable = model.get('viewable');
            // Don't add viewable to events if we don't know we're viewable
            if (viewable !== undefined) {
                // Emit viewable as 0 or 1
                newState = Object.assign({}, currentState, { viewable: viewable });
            }
            break;
        }
        case WARNING: {
            delete newState.key;
            break;
        }
        default: {
            break;
        }
    }

    return newState;
}
