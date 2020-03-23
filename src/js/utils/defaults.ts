import type { GenericObject } from '../types/generic.type';

// Adds properties to the first object from the rest
// Does not add properties which exist anywhere in the object or it's prototype chain (no shadowing, no overriding)
export default function defaults(obj: GenericObject, ...rest: any[]): GenericObject {
    rest.forEach((source: any) => {
        if (source) {
            for (const prop in source) {
                if (!(prop in obj)) {
                    obj[prop] = source[prop];
                }
            }
        }
    });
    return obj;
}
