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
            requestFullscreen.apply(elementContext);
        },
        exitFullscreen: function() {
            exitFullscreen.apply(documentContext);
        },
        fullscreenElement: function() {
            return documentContext.fullscreenElement ||
                documentContext.webkitCurrentFullScreenElement ||
                documentContext.mozFullScreenElement ||
                documentContext.msFullscreenElement;
        },
        destroy: function() {
            for (let i = DOCUMENT_FULLSCREEN_EVENTS.length; i--;) {
                documentContext.removeEventListener(DOCUMENT_FULLSCREEN_EVENTS[i], changeCallback);
            }
        }
    };
}
