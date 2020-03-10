import type { GenericObject } from 'types/generic.type';
import type Model from './model';

export default function middleware(model: Model, type: string, currentState: GenericObject): GenericObject {
    let newState: GenericObject = currentState;

    switch (type) {
        case 'time':
        case 'beforePlay':
        case 'pause':
        case 'play':
        case 'ready': {
            const viewable: number | undefined = model.get('viewable');
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
