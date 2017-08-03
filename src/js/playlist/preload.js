const preloadValues = {
    none: true,
    metadata: true,
    auto: true
};

export function getPreload(preload, fallback) {
    if (preloadValues[preload]) {
        return preload;
    }
    return preloadValues[fallback] ? fallback : 'metadata';
}
