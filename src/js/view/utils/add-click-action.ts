import UI from 'utils/ui';

export function addClickAction(element: HTMLElement, clickAction: (evt: Event) => void, ctx?: any): UI {
    const ui = new UI(element).on('click', clickAction, ctx);
    
    return ui;
}
