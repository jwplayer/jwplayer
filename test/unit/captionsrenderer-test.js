define([
    'test/underscore',
    'controller/model',
    'view/captionsrenderer',
    'parsers/captions/vttcue'
], function (_, Model, CaptionsRenderer, VTTCue) {
    /* jshint maxlen: 1000, qunit: true */

    var test = QUnit.test.bind(QUnit);

    var captionsRenderer = new CaptionsRenderer(new Model());
    captionsRenderer.setup();
    
    QUnit.module('CaptionsRenderer.getCurrentCues');

    test('should show the correct number of cues at any given position in time', function (assert) {
        var allCues = [
            new VTTCue(0, 3, 'HG: Morning, Rob.'),
            new VTTCue(4, 5, 'How are you?'),
            new VTTCue(7, 10, 'RW: Good, and you?'),
            new VTTCue(10, 14, 'I\'m great!'),
            new VTTCue(12, 15, 'EG: Hey, Jo...'),
            new VTTCue(13, 14, 'JB: Yeah?'),
            new VTTCue(13, 14, 'JP: Yeah?'),
            new VTTCue(16, null, 'The End')
        ];
        var currentNumCues = [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 2, 1, 2, 4, 4, 1, 1];

        for (var i = 0; i < currentNumCues.length; i += 1) {
            assert.equal(captionsRenderer.getCurrentCues(allCues, i).length, currentNumCues[i], 'Invalid number of cues at position ' + i);
        }
    });

    QUnit.module('CaptionsRenderer.updateCurrentCues');

    test('should set current cues ', function (assert) {
        var cues = [
            new VTTCue(0, 3, 'HG: Morning, Rob.')
        ];
        assert.equal(captionsRenderer.updateCurrentCues(cues).length, 1, '');

        cues = [
            new VTTCue(12, 15, 'EG: Hey, Jo...'),
            new VTTCue(13, 14, 'JB: Yeah?'),
            new VTTCue(13, 14, 'JP: Yeah?')
        ];
        assert.equal(captionsRenderer.updateCurrentCues(cues).length, 3, '');

        cues = [];
        assert.equal(captionsRenderer.updateCurrentCues(cues).length, 0, '');
    });
});