export function inInteraction(event) {
    event = event || window.event;
    return event && /^(?:mouse|pointer|touch|gesture|click|key)/.test(event.type);
}
