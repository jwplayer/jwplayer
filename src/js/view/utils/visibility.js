export default function getVisibility(model, element) {
    // Set visibility to 1 if we're in fullscreen
    if (model.get('fullscreen')) {
        return 1;
    }

    // Set visibility to 0 if we're not in the active tab
    if (!model.get('activeTab')) {
        return 0;
    }
    // Otherwise, set it to the intersection ratio reported from the intersection observer
    let intersectionRatio = model.get('intersectionRatio');

    if (intersectionRatio === undefined) {
        // Get intersectionRatio through brute force
        intersectionRatio = computeVisibility(element);
    }

    return intersectionRatio;
}

function computeVisibility(target) {
    const html = document.documentElement;
    const body = document.body;
    const rootRect = {
        top: 0,
        left: 0,
        right: html.clientWidth || body.clientWidth,
        width: html.clientWidth || body.clientWidth,
        bottom: html.clientHeight || body.clientHeight,
        height: html.clientHeight || body.clientHeight
    };

    if (!body.contains(target)) {
        return 0;
    }
    // If the element isn't displayed, an intersection can't happen.
    if (window.getComputedStyle(target).display === 'none') {
        return 0;
    }

    const targetRect = getBoundingClientRect(target);
    if (!targetRect) {
        return 0;
    }

    let intersectionRect = targetRect;
    let parent = target.parentNode;
    let atRoot = false;

    while (!atRoot) {
        let parentRect = null;
        if (parent === body || parent === html || parent.nodeType !== 1) {
            atRoot = true;
            parentRect = rootRect;
        } else if (window.getComputedStyle(parent).overflow !== 'visible') {
            parentRect = getBoundingClientRect(parent);
        }
        if (parentRect) {
            intersectionRect = computeRectIntersection(parentRect, intersectionRect);
            if (!intersectionRect) {
                break;
            }
        }
        parent = parent.parentNode;
    }
    const targetArea = targetRect.width * targetRect.height;
    const intersectionArea = intersectionRect.width * intersectionRect.height;
    return targetArea ? (intersectionArea / targetArea) : 0;
}

function getBoundingClientRect(el) {
    try {
        return el.getBoundingClientRect();
    } catch (e) {/* ignore Windows 7 IE11 "Unspecified error" */}
}

function computeRectIntersection(rect1, rect2) {
    const top = Math.max(rect1.top, rect2.top);
    const bottom = Math.min(rect1.bottom, rect2.bottom);
    const left = Math.max(rect1.left, rect2.left);
    const right = Math.min(rect1.right, rect2.right);
    const width = right - left;
    const height = bottom - top;
    return (width >= 0 && height >= 0) && {
        top: top,
        bottom: bottom,
        left: left,
        right: right,
        width: width,
        height: height
    };
}
