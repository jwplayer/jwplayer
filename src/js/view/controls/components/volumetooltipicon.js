import TooltipIcon from 'view/controls/components/tooltipicon';
import Slider from 'view/controls/components/slider';
import UI from 'utils/ui';
import { setAttribute, toggleClass } from 'utils/dom';

class VolumeSlider extends Slider {
    constructor(orientation, label, styleElement, callbacks) {
        const className = orientation === 'vertical' ? 'jw-slider-volume jw-volume-tip' : 'jw-slider-volume';
        super(className, orientation);
        this.setup();

        this.element().classList.remove('jw-background-color');

        setAttribute(styleElement, 'tabindex', '0');
        setAttribute(styleElement, 'aria-label', label);
        setAttribute(styleElement, 'aria-orientation', orientation);
        setAttribute(styleElement, 'aria-valuemin', 0);
        setAttribute(styleElement, 'aria-valuemax', 100);
        setAttribute(styleElement, 'role', 'slider');

        // Apply a click interaction listener to help with focus styling
        const { openTooltip, closeTooltip } = callbacks;
        this.uiOver = new UI(styleElement)
            .on('click', function() {}, callbacks)
            .on('over', openTooltip, callbacks)
            .on('out', closeTooltip, callbacks)
            .on('focus', openTooltip, callbacks)
            .on('blur', closeTooltip, callbacks);
    }
}

export default class VolumeTooltipIcon extends TooltipIcon {
    constructor(_model, name, ariaText, svgIcons, horizontalContainer) {
        super(name, ariaText, true, svgIcons);

        this._model = _model;
        this.horizontalContainer = horizontalContainer;

        const volumeLabel = _model.get('localization').volumeSlider;
        this.horizontalSlider = new VolumeSlider('horizontal', volumeLabel, horizontalContainer, this);
        this.volumeSlider = new VolumeSlider('vertical', volumeLabel, this.tooltip, this);

        horizontalContainer.appendChild(this.horizontalSlider.element());
        this.addContent(this.volumeSlider.element());

        this.volumeSlider.on('update', function (evt) {
            this.trigger('update', evt);
        }, this);

        this.horizontalSlider.on('update', function (evt) {
            this.trigger('update', evt);
        }, this);

        const { openTooltip, closeTooltip } = this;
        this.ui = new UI(this.el, { directSelect: true })
            .on('click enter', this.toggleValue, this)
            .on('tap', this.toggleOpenState, this)
            .on('over', openTooltip, this)
            .on('out', closeTooltip, this)
            .on('focus', openTooltip, this)
            .on('blur', closeTooltip, this);

        this._model.on('change:volume', this.onVolume, this);
    }

    openTooltip(evt) {
        super.openTooltip(evt);
        toggleClass(this.horizontalContainer, this.openClass, this.isOpen);
    }

    closeTooltip(evt) {
        super.closeTooltip(evt);
        toggleClass(this.horizontalContainer, this.openClass, this.isOpen);
    }

    toggleValue() {
        this.trigger('toggleValue');
    }

    destroy() {
        this.horizontalSlider.uiOver.destroy();
        this.volumeSlider.uiOver.destroy();
        this.ui.destroy();
    }
}
