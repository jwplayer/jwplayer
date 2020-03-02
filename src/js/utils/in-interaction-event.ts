export function inInteraction(event?: Event): boolean {
    event = event || window.event;
    return !!event && /^(?:mouse|pointer|touch|gesture|click|key)/.test(event.type);
}
