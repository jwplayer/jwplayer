import activeTab from 'utils/active-tab';
import { Browser, OS } from 'environment/environment';
import { deviceIsLandscape } from 'utils/dom';

const views = [];
const widgets = [];
const scrollHandlers = [];
const observed = {};
const hasOrientation = 'screen' in window && 'orientation' in window.screen;
const isAndroidChrome = OS.android && Browser.chrome;

let intersectionObserver;
let scrollHandlerInitialized = false;

function lazyInitIntersectionObserver() {
    const IntersectionObserver = window.IntersectionObserver;
    if (!intersectionObserver) {
        // Fire the callback every time 25% of the player comes in/out of view
        intersectionObserver = new IntersectionObserver((entries) => {
            if (entries && entries.length) {
                for (let i = entries.length; i--;) {
                    const entry = entries[i];
                    matchIntersection(entry, views);
                    matchIntersection(entry, widgets);
                }
            }
        }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });
    }
}

function matchIntersection(entry, group) {
    for (let i = group.length; i--;) {
        const view = group[i];
        if (entry.target === view.getContainer()) {
            view.setIntersection(entry);
            break;
        }
    }
}

function onOrientationChange() {
    views.forEach(view => {
        const model = view.model;
        if (model.get('audioMode') || !model.get('controls') || model.get('visibility') < 0.75) {
            // return early if chromeless player/audio only mode and player is less than 75% visible
            return;
        }

        const state = model.get('state');
        const isLandscape = deviceIsLandscape();

        if (!isLandscape && state === 'paused' && view.api.getFullscreen()) {
            view.api.setFullscreen(false);
        } else if (state === 'playing') {
            view.api.setFullscreen(isLandscape);
        }
    });
}

function onVisibilityChange() {
    views.forEach(view => {
        view.model.set('activeTab', activeTab());
    });
}

function removeFromGroup(view, group) {
    const index = group.indexOf(view);
    if (index !== -1) {
        group.splice(index, 1);
    }
}

function onScroll(e) {
    scrollHandlers.forEach(handler => {
        handler(e);
    });
}

if (!__HEADLESS__) {
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('webkitvisibilitychange', onVisibilityChange);

    if (isAndroidChrome && hasOrientation) {
        window.screen.orientation.addEventListener('change', onOrientationChange);
    }

    window.addEventListener('beforeunload', () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        document.removeEventListener('webkitvisibilitychange', onVisibilityChange);
        window.removeEventListener('scroll', onScroll);

        if (isAndroidChrome && hasOrientation) {
            window.screen.orientation.removeEventListener('change', onOrientationChange);
        }
    });
}

export default {
    add: function(view) {
        views.push(view);
    },
    remove: function(view) {
        removeFromGroup(view, views);
    },
    addScrollHandler: function(handler) {
        if (!scrollHandlerInitialized) {
            scrollHandlerInitialized = true;
            window.addEventListener('scroll', onScroll);
        }

        scrollHandlers.push(handler);
    },
    removeScrollHandler: function(handler) {
        let idx = scrollHandlers.indexOf(handler);
        if (idx !== -1) {
            scrollHandlers.splice(idx, 1);
        }
    },
    addWidget: function(widget) {
        widgets.push(widget);
    },
    removeWidget: function(widget) {
        removeFromGroup(widget, widgets);
    },
    size: function() {
        return views.length;
    },
    observe(container) {
        lazyInitIntersectionObserver();

        if (observed[container.id]) {
            return;
        }

        observed[container.id] = true;
        intersectionObserver.observe(container);
    },
    unobserve(container) {
        if (intersectionObserver && observed[container.id]) {
            delete observed[container.id];
            intersectionObserver.unobserve(container);
        }
    }
};
