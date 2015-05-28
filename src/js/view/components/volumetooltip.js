define([
    'view/components/tooltip',
    'view/components/slider',
    'events/events',
    'utils/ui',
    'utils/helpers'
], function(Tooltip, Slider, events, UI, utils) {
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

            new UI(this.el).on(events.touchEvents.CLICK, this.toggle.bind(this)).on(events.touchEvents.TAP, utils.noop);

            this._model.on('change:volume', this.onVolume, this);
        },
        toggle : function(evt){
            if(evt.target === this.el){
                this.trigger('toggle');
            }
        }
    });

    return VolumeTooltip;
});

