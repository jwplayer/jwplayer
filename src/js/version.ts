declare global {
    const __BUILD_VERSION__: string;
}

export const version: string = __BUILD_VERSION__;
