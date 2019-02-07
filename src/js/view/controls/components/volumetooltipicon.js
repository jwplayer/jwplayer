import TooltipIcon from 'view/controls/components/tooltipicon';
import Slider from 'view/controls/components/slider';
import UI from 'utils/ui';
import { setAttribute } from 'utils/dom';

export default class VolumeTooltipIcon extends TooltipIcon {
    constructor(_model, name, ariaText, svgIcons, container) {
        super(name, ariaText, true, svgIcons, container);

        const localization = _model.get('localization');
        const audioMode = _model.get('audioMode');
        const orientation = audioMode ? 'horizontal' : 'vertical';

        this._model = _model;
        this.volumeSlider = new Slider('jw-slider-volume jw-volume-tip', orientation);
        //toggleClass(this.volumeSlider.element(), 'jw-volume-tip', !audioMode);
        this.volumeSlider.setup();

        const volumeSliderElement = this.volumeSlider.element();
        volumeSliderElement.classList.remove('jw-background-color');
        
        const overlay = this.tooltip;
        setAttribute(overlay, 'tabindex', '0');
        setAttribute(overlay, 'aria-label', localization.volumeSlider);
        setAttribute(overlay, 'aria-orientation', 'vertical');
        setAttribute(overlay, 'aria-valuemin', 0);
        setAttribute(overlay, 'aria-valuemax', 100);
        setAttribute(overlay, 'role', 'slider');

        this.addContent(volumeSliderElement);

        this.volumeSlider.on('update', function (evt) {
            this.trigger('update', evt);
        }, this);

        // Apply a click interaction listener to help with focus styling
        const { openTooltip, closeTooltip } = this;
        this.uiOver = new UI(overlay)
            .on('click', function() {}, this)
            .on('over', openTooltip, this)
            .on('out', closeTooltip, this)
            .on('focus', openTooltip, this)
            .on('blur', closeTooltip, this);

        this.ui = new UI(this.el, { directSelect: true })
            .on('click enter', this.toggleValue, this)
            .on('tap', this.toggleOpenState, this)
            .on('over', openTooltip, this)
            .on('out', closeTooltip, this)
            .on('focus', openTooltip, this)
            .on('blur', closeTooltip, this);

        this._model.on('change:volume', this.onVolume, this);
    }

    toggleValue() {
        this.trigger('toggleValue');
    }

    destroy() {
        this.uiOver.destroy();
        this.ui.destroy();
    }
}
