define([
    'view/controls/components/tooltip',
    'view/controls/components/slider',
    'utils/ui',
    'utils/helpers'
], function(Tooltip, Slider, UI) {

    return class VolumeTooltip extends Tooltip {
        constructor(_model, name, ariaText) {
            super(name, ariaText, true);

            this._model = _model;

            this.volumeSlider = new Slider('jw-slider-volume jw-volume-tip', 'vertical');
            this.volumeSlider.setup();

            this.addContent(this.volumeSlider.element());

            this.volumeSlider.on('update', function (evt) {
                this.trigger('update', evt);
            }, this);

            new UI(this.el, { useHover: true, directSelect: true })
                .on('click', this.toggleValue, this)
                .on('tap', this.toggleOpenState, this)
                .on('over', this.openTooltip, this)
                .on('out', this.closeTooltip, this);

            this._model.on('change:volume', this.onVolume, this);
        }

        toggleValue() {
            this.trigger('toggleValue');
        }
    };
});

