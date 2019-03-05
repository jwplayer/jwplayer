import UI from 'utils/ui';
import { style } from 'utils/css';

export default class FloatingDragUI {
    constructor(element) {
        this.element = element;
    }

    disable() {
        this.ui.destroy();
    }

    enable() {
        let playerLeft;
        let playerTop;
        let innerHeight;
        let innerWidth;
        const { element } = this;
        const ui = this.ui = new UI(element)
            .on('dragStart', () => {
                playerLeft = element.offsetLeft;
                playerTop = element.offsetTop;
                innerHeight = window.innerHeight;
                innerWidth = window.innerWidth;
            })
            .on('drag', (e) => {
                let left = Math.max(playerLeft + e.pageX - ui.startX, 0);
                let top = Math.max(playerTop + e.pageY - ui.startY, 0);
                let right = Math.max(innerWidth - (left + element.clientWidth), 0);
                let bottom = Math.max(innerHeight - (top + element.clientHeight), 0);

                left === 0 ? right = null : left = null;
                top === 0 ? bottom = null : top = null;
                style(element, {
                    left,
                    right,
                    top,
                    bottom
                });
            })
            .on('dragEnd', () => {
                playerLeft = playerTop = innerWidth = innerHeight = null;
            });
    }
}