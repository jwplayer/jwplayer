export default function middleware(model, type, currentState) {
    let newState = currentState;

    switch (type) {
        case 'time':
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
}
