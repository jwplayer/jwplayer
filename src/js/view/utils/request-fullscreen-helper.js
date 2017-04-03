define([], function() {

    var DOCUMENT_FULLSCREEN_EVENTS = [
        'fullscreenchange',
        'webkitfullscreenchange',
        'mozfullscreenchange',
        'MSFullscreenChange'
    ];

    return function(elementContext, documentContext, changeCallback) {
        var requestFullscreen = elementContext.requestFullscreen ||
            elementContext.webkitRequestFullscreen ||
            elementContext.webkitRequestFullScreen ||
            elementContext.mozRequestFullScreen ||
            elementContext.msRequestFullscreen;

        var exitFullscreen = documentContext.exitFullscreen ||
            documentContext.webkitExitFullscreen ||
            documentContext.webkitCancelFullScreen ||
            documentContext.mozCancelFullScreen ||
            documentContext.msExitFullscreen;

        var supportsDomFullscreen = !!(requestFullscreen && exitFullscreen);

        for (var i = DOCUMENT_FULLSCREEN_EVENTS.length; i--;) {
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
                for (i = DOCUMENT_FULLSCREEN_EVENTS.length; i--;) {
                    documentContext.removeEventListener(DOCUMENT_FULLSCREEN_EVENTS[i], changeCallback);
                }
            }
        };
    };
});
