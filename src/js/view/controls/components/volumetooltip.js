import Tooltip from 'view/controls/components/tooltip';
import Slider from 'view/controls/components/slider';
import UI from 'utils/ui';
import { setAttribute } from 'utils/dom';

export default class VolumeTooltip extends Tooltip {
    constructor(_model, name, ariaText, svgIcons) {
        super(name, ariaText, true, svgIcons);

        const localization = _model.get('localization');

        this._model = _model;
        this.volumeSlider = new Slider('jw-slider-volume jw-volume-tip', 'vertical');
        this.volumeSlider.setup();

        const volumeSliderElement = this.volumeSlider.element();
        volumeSliderElement.classList.remove('jw-background-color');
        
        const overlay = this.container;
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
