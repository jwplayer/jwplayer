const views = [];
const observed = {};

let intersectionObserver;

function lazyInitIntersectionObserver() {
    const IntersectionObserver = window.IntersectionObserver;
    if (!intersectionObserver) {
        intersectionObserver = new IntersectionObserver((entries) => {
            if (entries && entries.length) {
                for (let i = entries.length; i--;) {
                    const entry = entries[i];
                    matchIntersection(entry, views);
                }
            }
        }, { threshold: [1] });
    }
}

function matchIntersection(entry, group) {
    for (let i = group.length; i--;) {
        const view = group[i];
        if (entry.target === view.getFloatingContainer()) {
            view.setFloatingIntersection(entry);
            break;
        }
    }
}

export default {
    add: function(view) {
        views.push(view);
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
