import UI from 'utils/ui';

export function addClickAction(element: HTMLElement, clickAction: (evt: Event) => void, ctx?: any, directSelect?: boolean): UI {
    const ui = new UI(element, { directSelect: !!directSelect }).on('click enter', clickAction, ctx);
    
    return ui;
}
