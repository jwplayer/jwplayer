import type { HTMLTemplateString } from 'types/generic.type';

export type FullscreenHelpers = {
    events: string[];
    supportsDomFullscreen: () => boolean;
    requestFullscreen: () => void;
    exitFullscreen: () => void;
    fullscreenElement: () => void;
    destroy: () => void; 
};

export type FullscreenElement = {
    fullscreenElement: any | undefined;
    webkitCurrentFullScreenElement: any| undefined;
    mozFullScreenElement: any| undefined;
    msFullscreenElement: any| undefined;
};

const DOCUMENT_FULLSCREEN_EVENTS = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange'
];

// TODO talk to Zack about the playerElement
// TODO talk to Zack about the documentContext
export function requestFullscreenHelper(_playerElement: HTMLTemplateString, documentContext: Document, callback: Function): FullscreenHelpers {
    const element: any = _playerElement;
    const requestFullscreen = element.requestFullscreen ||
        element.webkitRequestFullscreen ||
        element.webkitRequestFullScreen ||
        element.mozRequestFullScreen ||
        element.msRequestFullscreen;

    const doc: any = documentContext;
    const exitFullscreen = documentContext.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.webkitCancelFullScreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen;

    const supportsDomFullscreen = !!(requestFullscreen && exitFullscreen);

    for (let i = DOCUMENT_FULLSCREEN_EVENTS.length; i--;) {
        const eventName: string = DOCUMENT_FULLSCREEN_EVENTS[i];
        doc.addEventListener(eventName, callback);
    }

    return {
        events: DOCUMENT_FULLSCREEN_EVENTS,
        supportsDomFullscreen: () => {
            return supportsDomFullscreen;
        },
        requestFullscreen: () => {
            requestFullscreen.call(_playerElement, {
                navigationUI: 'hide'
            });
        },
        exitFullscreen: function (): void {
            if (this.fullscreenElement() !== null) {
                exitFullscreen.apply(documentContext);
            }
        },
        fullscreenElement: () => {
            const { fullscreenElement, webkitCurrentFullScreenElement, mozFullScreenElement, msFullscreenElement }: FullscreenElement =
                doc;
            if (fullscreenElement === null) {
                return fullscreenElement;
            }
            return fullscreenElement || webkitCurrentFullScreenElement || mozFullScreenElement || msFullscreenElement;
        },
        destroy: () => {
            for (let i = DOCUMENT_FULLSCREEN_EVENTS.length; i--;) {
                const eventName: string = DOCUMENT_FULLSCREEN_EVENTS[i];
                doc.removeEventListener(eventName, callback);
            }
        }
    };
}
