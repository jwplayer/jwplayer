import UI from 'utils/ui';
import { style } from 'utils/css';

export default class FloatingDragUI {
    constructor(element) {
        this.container = element;
        this.input = element.querySelector('.jw-media');
    }

    disable() {
        if (this.ui) {
            this.ui.destroy();
            this.ui = null;
        }
    }

    enable() {
        let playerLeft;
        let playerTop;
        let innerHeight;
        let innerWidth;
        const auto = 'auto';
        const { container, input } = this;
        const ui = this.ui = new UI(input, { preventScrolling: true })
            .on('dragStart', () => {
                playerLeft = container.offsetLeft;
                playerTop = container.offsetTop;
                innerHeight = window.innerHeight;
                innerWidth = window.innerWidth;
            })
            .on('drag', (e) => {
                let left = Math.max(playerLeft + e.pageX - ui.startX, 0);
                let top = Math.max(playerTop + e.pageY - ui.startY, 0);
                let right = Math.max(innerWidth - (left + container.clientWidth), 0);
                let bottom = Math.max(innerHeight - (top + container.clientHeight), 0);

                if (right === 0) {
                    left = auto;
                } else {
                    right = auto;
                }
                if (top === 0) {
                    bottom = auto;
                } else {
                    top = auto;
                }

                style(container, {
                    left,
                    right,
                    top,
                    bottom,
                    margin: 0
                });
            })
            .on('dragEnd', () => {
                playerLeft = playerTop = innerWidth = innerHeight = null;
            });
    }
}
