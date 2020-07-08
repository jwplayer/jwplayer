import sliderTemplate from 'view/controls/templates/slider';
import { OS } from 'environment/environment';
import Events from 'utils/backbone.events';
import UI from 'utils/ui';
import { between } from 'utils/math';
import { bounds, createElement } from 'utils/dom';
import type { BoundingRect } from 'types/generic.type';

interface Slider {
    className: string;
    orientation: string;
    ui: UI;
    el: HTMLElement;
    elementRail: HTMLElement;
    elementBuffer: HTMLElement;
    elementProgress: HTMLElement;
    elementThumb: HTMLElement;
    railBounds?: BoundingRect;
}

const getRailBounds = function(elementRail: HTMLElement): BoundingRect {
    const railBounds = bounds(elementRail);
    // Partial workaround of Android 'inert-visual-viewport'
    // https://bugs.chromium.org/p/chromium/issues/detail?id=489206
    const pageXOffset = window.pageXOffset;
    if (pageXOffset && OS.android && document.body.parentElement &&
        document.body.parentElement.getBoundingClientRect().left >= 0) {
        railBounds.left -= pageXOffset;
        railBounds.right -= pageXOffset;
    }
    return railBounds;
};

class Slider extends Events {
    constructor(className: string, orientation: string) {
        super();
        this.className = className + ' jw-background-color jw-reset';
        this.orientation = orientation;
    }

    setup(): void {
        this.el = createElement(sliderTemplate(this.className, 'jw-slider-' + this.orientation));

        this.elementRail = this.el.getElementsByClassName('jw-slider-container')[0] as HTMLElement;
        this.elementBuffer = this.el.getElementsByClassName('jw-buffer')[0] as HTMLElement;
        this.elementProgress = this.el.getElementsByClassName('jw-progress')[0] as HTMLElement;
        this.elementThumb = this.el.getElementsByClassName('jw-knob')[0] as HTMLElement;

        this.ui = new UI(this.element(), { preventScrolling: true })
            .on('dragStart', this.dragStart, this)
            .on('drag', this.dragMove, this)
            .on('dragEnd', this.dragEnd, this)
            .on('click tap', this.tap, this);
    }

    dragStart(): void {
        this.trigger('dragStart');
        this.railBounds = getRailBounds(this.elementRail as HTMLElement);
    }

    dragEnd(evt: Event): void {
        this.dragMove(evt as MouseEvent);
        this.trigger('dragEnd');
    }

    dragMove(evt: MouseEvent): boolean {
        const railBounds = this.railBounds = (this.railBounds) ? this.railBounds : getRailBounds(this.elementRail);
        let dimension: number;
        let percentage: number;

        if (this.orientation === 'horizontal') {
            dimension = evt.pageX;
            if (dimension < railBounds.left) {
                percentage = 0;
            } else if (dimension > railBounds.right) {
                percentage = 100;
            } else {
                percentage = between((dimension - railBounds.left) / railBounds.width, 0, 1) * 100;
            }
        } else {
            dimension = evt.pageY;
            if (dimension >= railBounds.bottom) {
                percentage = 0;
            } else if (dimension <= railBounds.top) {
                percentage = 100;
            } else {
                percentage =
                    between((railBounds.height - (dimension - railBounds.top)) / railBounds.height, 0, 1) * 100;
            }
        }

        this.render(percentage);
        this.update(percentage);

        return false;
    }

    tap(evt: Event): void {
        this.railBounds = getRailBounds(this.elementRail);
        this.dragMove(evt as MouseEvent);
    }

    limit(percentage: number): number {
        // modules that extend Slider can set limits on the percentage (TimeSlider)
        return percentage;
    }

    update(percentage: number): void {
        this.trigger('update', { percentage: percentage });
    }

    render(percentage: number): void {
        percentage = Math.max(0, Math.min(percentage, 100));

        const elThumb = this.elementThumb as HTMLElement;
        const elProgress = this.elementProgress as HTMLElement;

        if (this.orientation === 'horizontal') {
            elThumb.style.left = percentage + '%';
            elProgress.style.width = percentage + '%';
        } else {
            elThumb.style.bottom = percentage + '%';
            elProgress.style.height = percentage + '%';
        }
    }

    updateBuffer(percentage: number): void {
        this.elementBuffer.style.width = percentage + '%';
    }

    element(): HTMLElement {
        return this.el;
    }
}

export default Slider;
