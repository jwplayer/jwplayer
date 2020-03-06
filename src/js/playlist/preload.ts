import type { GenericObject } from 'types/generic.type';

const preloadValues: {
    none: boolean;
    metadata: boolean;
    auto: boolean;
} & GenericObject = {
    none: true,
    metadata: true,
    auto: true
};

export function getPreload(preload: string, fallback: string): string {
    if (preloadValues[preload]) {
        return preload;
    }
    return preloadValues[fallback] ? fallback : 'metadata';
}
