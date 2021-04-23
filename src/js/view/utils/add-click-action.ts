import UI from 'utils/ui';

export function addClickAction(element: HTMLElement, clickAction: (evt: Event) => void, ctx?: any): UI {
    const ui = new UI(element, { directSelect: true });
    ui.on('click tap enter', function (evt: Event): void {
        clickAction(evt);
    }, ctx);
    
    return ui;
}
