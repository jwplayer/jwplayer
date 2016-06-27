define([
    'view/components/tooltip',
    'view/components/slider',
    'utils/ui',
    'utils/helpers'
], function(Tooltip, Slider, UI, utils) {
    var VolumeTooltip = Tooltip.extend({
        'constructor' : function(_model, name, ariaText) {
            this._model = _model;

            // Prevent Volume tooltip button from being aria-hidden="true"
            Tooltip.call(this, name, ariaText, true);

            this.volumeSlider = new Slider('jw-slider-volume jw-volume-tip', 'vertical');
            this.addContent(this.volumeSlider.element());

            this.volumeSlider.on('update', function (evt) {
                this.trigger('update', evt);
            }, this);

            utils.removeClass(this.el, 'jw-hidden');

            new UI(this.el, {'useHover': true, 'directSelect': true})
                .on('click', this.toggleValue, this)
                .on('tap', this.toggleOpenState, this)
                .on('over', this.openTooltip, this)
                .on('out', this.closeTooltip, this);

            this._model.on('change:volume', this.onVolume, this);
        },
        toggleValue : function(){
            this.trigger('toggleValue');
        }
    });

    return VolumeTooltip;
});

