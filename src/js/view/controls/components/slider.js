import sliderTemplate from 'view/controls/templates/slider';
import { OS } from 'environment/environment';
import Events from 'utils/backbone.events';
import UI from 'utils/ui';
import { between } from 'utils/math';
import { bounds, createElement } from 'utils/dom';

const getRailBounds = function(elementRail) {
    const railBounds = bounds(elementRail);
    // Partial workaround of Android 'inert-visual-viewport'
    // https://bugs.chromium.org/p/chromium/issues/detail?id=489206
    const pageXOffset = window.pageXOffset;
    if (pageXOffset && OS.android && document.body.parentElement.getBoundingClientRect().left >= 0) {
        railBounds.left -= pageXOffset;
        railBounds.right -= pageXOffset;
    }
    return railBounds;
};

export default class Slider {
    constructor(className, orientation) {
        Object.assign(this, Events);

        this.className = className + ' jw-background-color jw-reset';
        this.orientation = orientation;

        this.dragStartListener = this.dragStart.bind(this);
        this.dragMoveListener = this.dragMove.bind(this);
        this.dragEndListener = this.dragEnd.bind(this);

        this.tapListener = this.tap.bind(this);
    }

    setup() {
        this.el = createElement(sliderTemplate(this.className, 'jw-slider-' + this.orientation));

        this.elementRail = this.el.getElementsByClassName('jw-slider-container')[0];
        this.elementBuffer = this.el.getElementsByClassName('jw-buffer')[0];
        this.elementProgress = this.el.getElementsByClassName('jw-progress')[0];
        this.elementThumb = this.el.getElementsByClassName('jw-knob')[0];

        this.userInteract = new UI(this.element(), { preventScrolling: true })
            .on('dragStart', this.dragStartListener)
            .on('drag', this.dragMoveListener)
            .on('dragEnd', this.dragEndListener)
            .on('tap click', this.tapListener);
    }

    dragStart() {
        this.trigger('dragStart');
        this.railBounds = getRailBounds(this.elementRail);
    }

    dragEnd(evt) {
        this.dragMove(evt);
        this.trigger('dragEnd');
    }

    dragMove(evt) {
        const railBounds = this.railBounds = (this.railBounds) ? this.railBounds : getRailBounds(this.elementRail);
        let dimension;
        let percentage;

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

    tap(evt) {
        this.railBounds = getRailBounds(this.elementRail);
        this.dragMove(evt);
    }

    limit(percentage) {
        // modules that extend Slider can set limits on the percentage (TimeSlider)
        return percentage;
    }

    update(percentage) {
        this.trigger('update', { percentage: percentage });
    }

    render(percentage) {
        percentage = Math.max(0, Math.min(percentage, 100));

        if (this.orientation === 'horizontal') {
            this.elementThumb.style.left = percentage + '%';
            this.elementProgress.style.width = percentage + '%';
        } else {
            this.elementThumb.style.bottom = percentage + '%';
            this.elementProgress.style.height = percentage + '%';
        }
    }

    updateBuffer(percentage) {
        this.elementBuffer.style.width = percentage + '%';
    }

    element() {
        return this.el;
    }
}
