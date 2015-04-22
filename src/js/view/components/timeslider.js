define([
    'utils/underscore',
    'view/components/slider',
    'utils/helpers'
], function(_, Slider, utils) {

    function TimeSlider(_model, _api) {
        var timeSlider = new Slider('jw-time', 'horizontal');

        // Store the attempted seek, until the previous one completes
        var _seekTo, _duration;
        var _seekThrottler = _.throttle(_seek, 400);

        function _seekThrottled(pct) {
            _seekTo = pct;
            _seekThrottler(pct);
        }

        function _onSeeked() {
            // When we are done scrubbing there will be a final seeked event
            //  which should not trigger another seek
            if (_model.get('scrubbing')) {
                _seek(_seekTo);
            }
        }

        function _seek(pct) {
            var position = pct/100 * _api.getDuration();
            _api.seek(position);
        }

        timeSlider
            .on('update', function(event) {
                _seekThrottled(event.percentage);
            })
            .on('dragStart', function() {
                _duration = _model.get('duration');
                _model.set('scrubbing', true);
            })
            .on('dragEnd', function() {
                _model.set('scrubbing', false);
            });

        _model
            .on('change:position', function(model, pos) {
                var pct = pos / _api.getDuration() * 100;
                timeSlider.update(pct);
            })
            .on('change:buffer', function(model, pct) {
                timeSlider.updateBuffer(pct);
            });

        _api.on('seeked', _onSeeked);

        return timeSlider;
    }

    return TimeSlider;
});
