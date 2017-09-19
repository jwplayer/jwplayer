import Tooltip from 'view/controls/components/tooltip';
import Slider from 'view/controls/components/slider';
import UI from 'utils/ui';

export default class VolumeTooltip extends Tooltip {
    constructor(_model, name, ariaText, svgIcons) {
        super(name, ariaText, true, svgIcons);

        this._model = _model;
        this.volumeSlider = new Slider('jw-slider-volume jw-volume-tip', 'vertical');
        this.volumeSlider.setup();
        this.volumeSlider.element().classList.remove('jw-background-color');

        this.addContent(this.volumeSlider.element());

        this.volumeSlider.on('update', function (evt) {
            this.trigger('update', evt);
        }, this);

        new UI(this.el, { useHover: true, directSelect: true, useFocus: true })
            .on('click enter', this.toggleValue, this)
            .on('tap', this.toggleOpenState, this)
            .on('over', this.openTooltip, this)
            .on('out', this.closeTooltip, this);

        this._model.on('change:volume', this.onVolume, this);
    }

    toggleValue() {
        this.trigger('toggleValue');
    }
}
