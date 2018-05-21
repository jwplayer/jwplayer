import activeTab from 'utils/active-tab';
import { requestAnimationFrame, cancelAnimationFrame } from 'utils/request-animation-frame';
import { Browser, OS } from 'environment/environment';

const views = [];
const observed = {};
const hasOrientation = 'screen' in window && 'orientation' in window.screen;
const isAndroidChrome = OS.android && Browser.chrome;

let intersectionObserver;
let responsiveRepaintRequestId = -1;

function lazyInitIntersectionObserver() {
    const IntersectionObserver = window.IntersectionObserver;
    if (!intersectionObserver) {
        // Fire the callback every time 25% of the player comes in/out of view
        intersectionObserver = new IntersectionObserver((entries) => {
            if (entries && entries.length) {
                for (let i = entries.length; i--;) {
                    const entry = entries[i];
                    for (let j = views.length; j--;) {
                        let view = views[j];
                        if (entry.target === view.getContainer()) {
                            view.model.set('intersectionRatio', entry.intersectionRatio);
                            break;
                        }
                    }
                }
            }
        }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    }
}

function scheduleResponsiveRedraw() {
    cancelAnimationFrame(responsiveRepaintRequestId);
    responsiveRepaintRequestId = requestAnimationFrame(function responsiveRepaint() {
        views.forEach(view => {
            view.updateBounds();
        });
        views.forEach(view => {
            if (view.model.get('visibility')) {
                view.updateStyles();
            }
        });
        views.forEach(view => {
            view.checkResized();
        });
    });
}

function onOrientationChange() {
    views.forEach(view => {
        if (view.model.get('visibility') >= 0.75) {
            const state = view.model.get('state');
            const orientation = window.screen.orientation.type;
            const isLandscape = orientation === 'landscape-primary' || orientation === 'landscape-secondary';

            if (!isLandscape && state === 'paused' && view.api.getFullscreen()) {
                // Set fullscreen to false when going back to portrait while paused and return early
                view.api.setFullscreen(false);
                return;
            } else if (state === 'playing') {
                view.api.setFullscreen(isLandscape);
                return;
            }
        }
    });
}

function onVisibilityChange() {
    views.forEach(view => {
        view.model.set('activeTab', activeTab());
    });
}

document.addEventListener('visibilitychange', onVisibilityChange);
document.addEventListener('webkitvisibilitychange', onVisibilityChange);
window.addEventListener('resize', scheduleResponsiveRedraw);
window.addEventListener('orientationchange', scheduleResponsiveRedraw);

if (isAndroidChrome && hasOrientation) {
    window.screen.orientation.addEventListener('change', onOrientationChange);
}

window.addEventListener('beforeunload', () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('webkitvisibilitychange', onVisibilityChange);
    window.removeEventListener('resize', scheduleResponsiveRedraw);
    window.removeEventListener('orientationchange', scheduleResponsiveRedraw);

    if (isAndroidChrome && hasOrientation) {
        window.screen.orientation.removeEventListener('change', onOrientationChange);
    }
});

export default {
    add: function(view) {
        views.push(view);
    },
    remove: function(view) {
        const index = views.indexOf(view);
        if (index !== -1) {
            views.splice(index, 1);
        }
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
