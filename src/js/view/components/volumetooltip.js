define([
    'view/components/tooltip',
    'view/components/slider',
    'utils/ui',
    'utils/helpers'
], function(Tooltip, Slider, UI, utils) {
    var VolumeTooltip = Tooltip.extend({
        'constructor' : function(_model, name) {
            this._model = _model;

            Tooltip.call(this, name);

            this.volumeSlider = new Slider('jw-slider-volume jw-volume-tip', 'vertical');
            this.addContent(this.volumeSlider.element());

            this.volumeSlider.on('update', function (evt) {
                this.trigger('update', evt);
            }, this);

            utils.toggleClass(this.el, 'jw-hidden', false);

            new UI(this.el, {'useHover': true})
                .on('click', this.toggleValue, this)
                .on('tap', this.toggleOpenState, this)
                .on('over', this.openTooltip, this)
                .on('out', this.closeTooltip, this);

            this._model.on('change:volume', this.onVolume, this);
        },
        toggleValue : function(evt){
            if(evt.target === this.el){
                this.trigger('toggleValue');
            }
        }
    });

    return VolumeTooltip;
});

