import UI from 'utils/ui';

export function addClickAction(element: HTMLElement, clickAction: (evt) => void, ctx?: any): UI {
    const ui = new UI(element, { directSelect: true });
    ui.on('click tap enter', function (evt) {
        clickAction(evt);
    }, ctx);
    
    return ui;
}