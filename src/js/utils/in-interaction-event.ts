import { GenericObject } from 'types/generic.type';

export function inInteraction(event: GenericObject | undefined): boolean {
    event = event || window.event;
    return !!event && /^(?:mouse|pointer|touch|gesture|click|key)/.test(event.type);
}
