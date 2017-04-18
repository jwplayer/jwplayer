import { requestAnimationFrame, cancelAnimationFrame } from 'utils/request-animation-frame';

const views = [];
let responsiveRepaintRequestId = -1;

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
    });
}

function onVisibilityChange() {
    views.forEach(view => {
        view.visibilityChange();
    });
}

document.addEventListener('visibilitychange', onVisibilityChange);
document.addEventListener('webkitvisibilitychange', onVisibilityChange);
window.addEventListener('resize', scheduleResponsiveRedraw);
window.addEventListener('orientationchange', scheduleResponsiveRedraw);

let intersectionObserver;
const IntersectionObserver = window.IntersectionObserver;
if (window.IntersectionObserver) {
    // Fire the callback every time 25% of the player comes in/out of view
    intersectionObserver = new IntersectionObserver((entries) => {
        if (entries && entries.length) {
            for (let i = entries.length; i--;) {
                const entry = entries[i];
                views.forEach(view => {
                    if (entry.target === view.getContainer()) {
                        view.model.set('intersectionRatio', entry.intersectionRatio);
                    }
                });
            }
        }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
}

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
    observe(container) {
        if (intersectionObserver) {
            intersectionObserver.unobserve(container);
            intersectionObserver.observe(container);
        }
    },
    unobserve(container) {
        if (intersectionObserver) {
            intersectionObserver.unobserve(container);
        }
    }
};
