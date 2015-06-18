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
            }.bind(this));

            utils.toggleClass(this.el, 'jw-hidden', false);

            new UI(this.el).on('click', this.toggleValue.bind(this)).on('tap', this.toggleOpenState.bind(this));
            this.el.addEventListener('mouseover', this.openTooltip.bind(this));
            this.el.addEventListener('mouseout', this.closeTooltip.bind(this));

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

