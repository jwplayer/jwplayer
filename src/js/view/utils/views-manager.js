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
            view.updateStyles();
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

export default {
    add: function(view) {
        views.push(view);
    },
    remove: function(view) {
        const index = views.indexOf(view);
        if (index !== -1) {
            views.splice(index, 1);
        }
    }
};
