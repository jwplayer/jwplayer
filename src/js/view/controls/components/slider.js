import sliderTemplate from 'view/controls/templates/slider';

define([
    'utils/backbone.events',
    'utils/ui',
    'utils/helpers',
    'utils/underscore',
], function(Events, UI, utils, _) {

    const getRailBounds = function(elementRail) {
        const bounds = utils.bounds(elementRail);
        // Partial workaround of Android 'inert-visual-viewport'
        // https://bugs.chromium.org/p/chromium/issues/detail?id=489206
        const pageXOffset = window.pageXOffset;
        if (pageXOffset && utils.isAndroid() && document.body.parentElement.getBoundingClientRect().left >= 0) {
            bounds.left -= pageXOffset;
            bounds.right -= pageXOffset;
        }
        return bounds;
    };

    return class Slider {
        constructor(className, orientation) {
            _.extend(this, Events);

            this.className = className + ' jw-background-color jw-reset';
            this.orientation = orientation;

            this.dragStartListener = this.dragStart.bind(this);
            this.dragMoveListener = this.dragMove.bind(this);
            this.dragEndListener = this.dragEnd.bind(this);

            this.tapListener = this.tap.bind(this);
        }

        setup() {
            this.el = utils.createElement(sliderTemplate(this.className, 'jw-slider-' + this.orientation));

            this.elementRail = this.el.getElementsByClassName('jw-slider-container')[0];
            this.elementBuffer = this.el.getElementsByClassName('jw-buffer')[0];
            this.elementProgress = this.el.getElementsByClassName('jw-progress')[0];
            this.elementThumb = this.el.getElementsByClassName('jw-knob')[0];

            this.userInteract = new UI(this.element(), { preventScrolling: true });

            this.userInteract.on('dragStart', this.dragStartListener);
            this.userInteract.on('drag', this.dragMoveListener);
            this.userInteract.on('dragEnd', this.dragEndListener);

            this.userInteract.on('tap click', this.tapListener);
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
            const bounds = this.railBounds = (this.railBounds) ? this.railBounds : getRailBounds(this.elementRail);
            let dimension;
            let percentage;

            if (this.orientation === 'horizontal') {
                dimension = evt.pageX;
                if (dimension < bounds.left) {
                    percentage = 0;
                } else if (dimension > bounds.right) {
                    percentage = 100;
                } else {
                    percentage = utils.between((dimension - bounds.left) / bounds.width, 0, 1) * 100;
                }
            } else {
                dimension = evt.pageY;
                if (dimension >= bounds.bottom) {
                    percentage = 0;
                } else if (dimension <= bounds.top) {
                    percentage = 100;
                } else {
                    percentage = utils.between((bounds.height - (dimension - bounds.top)) / bounds.height, 0, 1) * 100;
                }
            }

            const updatedPercent = this.limit(percentage);
            this.render(updatedPercent);
            this.update(updatedPercent);

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
    };
});
