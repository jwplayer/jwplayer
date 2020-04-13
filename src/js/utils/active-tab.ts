export default (function(): () => boolean {
    if ('hidden' in document) {
        return function (): boolean {
            return !document.hidden;
        };
    }
    if ('webkitHidden' in document) {
        return function (): boolean {
            return !document.webkitHidden;
        };
    }
    // document.hidden not supported
    return function (): boolean {
        return true;
    };
}());
