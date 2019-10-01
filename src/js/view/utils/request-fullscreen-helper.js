const DOCUMENT_FULLSCREEN_EVENTS = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange'
];

export default function(elementContext, documentContext, changeCallback) {
    const requestFullscreen = elementContext.requestFullscreen ||
        elementContext.webkitRequestFullscreen ||
        elementContext.webkitRequestFullScreen ||
        elementContext.mozRequestFullScreen ||
        elementContext.msRequestFullscreen;

    const exitFullscreen = documentContext.exitFullscreen ||
        documentContext.webkitExitFullscreen ||
        documentContext.webkitCancelFullScreen ||
        documentContext.mozCancelFullScreen ||
        documentContext.msExitFullscreen;

    const supportsDomFullscreen = !!(requestFullscreen && exitFullscreen);

    for (let i = DOCUMENT_FULLSCREEN_EVENTS.length; i--;) {
        documentContext.addEventListener(DOCUMENT_FULLSCREEN_EVENTS[i], changeCallback);
    }

    return {
        events: DOCUMENT_FULLSCREEN_EVENTS,
        supportsDomFullscreen: function() {
            return supportsDomFullscreen;
        },
        requestFullscreen: function() {
            requestFullscreen.call(elementContext, {
                navigationUI: 'hide'
            });
        },
        exitFullscreen: function() {
            if (this.fullscreenElement() !== null) {
                exitFullscreen.apply(documentContext);
            }
        },
        fullscreenElement: function() {
            const { fullscreenElement, webkitCurrentFullScreenElement, mozFullScreenElement, msFullscreenElement } =
                documentContext;
            if (fullscreenElement === null) {
                return fullscreenElement;
            }
            return fullscreenElement || webkitCurrentFullScreenElement || mozFullScreenElement || msFullscreenElement;
        },
        destroy: function() {
            for (let i = DOCUMENT_FULLSCREEN_EVENTS.length; i--;) {
                documentContext.removeEventListener(DOCUMENT_FULLSCREEN_EVENTS[i], changeCallback);
            }
        }
    };
}
