import TooltipIcon from 'view/controls/components/tooltipicon';
import Slider from 'view/controls/components/slider';
import UI from 'utils/ui';
import { setAttribute, toggleClass } from 'utils/dom';

class VolumeSlider extends Slider {
    constructor(orientation, label, styleElement) {
        let className = 'jw-slider-volume';
        if (orientation === 'vertical') {
            className += ' jw-volume-tip';
        }
        super(className, orientation);
        this.setup();

        this.element().classList.remove('jw-background-color');

        setAttribute(styleElement, 'tabindex', '0');
        setAttribute(styleElement, 'aria-label', label);
        setAttribute(styleElement, 'aria-orientation', orientation);
        setAttribute(styleElement, 'aria-valuemin', 0);
        setAttribute(styleElement, 'aria-valuemax', 100);
        setAttribute(styleElement, 'role', 'slider');

        this.uiOver = new UI(styleElement)
            .on('click', function() {});
    }
}

export default class VolumeTooltipIcon extends TooltipIcon {
    constructor(_model, name, ariaText, svgIcons, horizontalContainer) {
        super(name, ariaText, true, svgIcons);

        this._model = _model;
        this.horizontalContainer = horizontalContainer;

        const volumeLabel = _model.get('localization').volumeSlider;
        this.horizontalSlider = new VolumeSlider('horizontal', volumeLabel, horizontalContainer, this);
        this.verticalSlider = new VolumeSlider('vertical', volumeLabel, this.tooltip, this);

        horizontalContainer.appendChild(this.horizontalSlider.element());
        this.addContent(this.verticalSlider.element());

        this.verticalSlider.on('update', function (evt) {
            this.trigger('update', evt);
        }, this);

        this.horizontalSlider.on('update', function (evt) {
            this.trigger('update', evt);
        }, this);

        this.ui = new UI(this.el, { directSelect: true })
            .on('click enter', this.toggleValue, this)
            .on('tap', this.toggleOpenState, this);

        this.addTooltipHandlers(this.ui);
        this.addTooltipHandlers(this.horizontalSlider.uiOver);
        this.addTooltipHandlers(this.verticalSlider.uiOver);

        this._model.on('change:volume', this.onVolume, this);
    }

    addTooltipHandlers(ui) {
        const { openTooltip, closeTooltip } = this;
        ui.on('over', openTooltip, this)
            .on('out', closeTooltip, this)
            .on('focus', openTooltip, this)
            .on('blur', closeTooltip, this);
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
        this.verticalSlider.uiOver.destroy();
        this.ui.destroy();
    }
}
