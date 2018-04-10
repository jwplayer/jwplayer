export function addInteractionListeners(element, action, dir = 'up') {
    element.addEventListener('mouse' + dir, action);
    element.addEventListener('pointer' + dir, action);
    element.addEventListener('touchstart', action);
}

export function removeInteractionListeners(element, action, dir = 'up') {
    element.removeEventListener('mouse' + dir, action);
    element.removeEventListener('pointer' + dir, action);
    element.removeEventListener('touchstart', action);
}
