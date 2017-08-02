import activeTab from 'utils/active-tab';
import { requestAnimationFrame, cancelAnimationFrame } from 'utils/request-animation-frame';

const views = [];

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

function onVisibilityChange() {
    views.forEach(view => {
        view.model.set('activeTab', activeTab());
    });
}

document.addEventListener('visibilitychange', onVisibilityChange);
document.addEventListener('webkitvisibilitychange', onVisibilityChange);
window.addEventListener('resize', scheduleResponsiveRedraw);
window.addEventListener('orientationchange', scheduleResponsiveRedraw);

window.addEventListener('beforeunload', () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('webkitvisibilitychange', onVisibilityChange);
    window.removeEventListener('resize', scheduleResponsiveRedraw);
    window.removeEventListener('orientationchange', scheduleResponsiveRedraw);
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
        try {
            intersectionObserver.unobserve(container);
        } catch (e) {/* catch Exception thrown by Edge 15 browser */}
        intersectionObserver.observe(container);
    },
    unobserve(container) {
        if (intersectionObserver) {
            intersectionObserver.unobserve(container);
        }
    }
};
