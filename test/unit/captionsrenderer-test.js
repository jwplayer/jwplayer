import Model from 'controller/model';
import ViewModel from 'view/view-model';
import CaptionsRenderer from 'view/captionsrenderer';
import VTTCue from 'parsers/captions/vttcue';

const model = new Model({});
const viewModel = new ViewModel(model);
const captionsRenderer = new CaptionsRenderer(viewModel, model);
captionsRenderer.setup('player', {});

describe('CaptionsRenderer.getCurrentCues', function() {

    it('should show the correct number of cues at any given position in time', function() {
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
            expect(captionsRenderer.getCurrentCues(allCues, i).length, 'Invalid number of cues at position ' + i).to.equal(currentNumCues[i]);
        }
    });
});

describe('CaptionsRenderer.updateCurrentCues', function() {

    it('should set current cues ', function() {
        var cues = [
            new VTTCue(0, 3, 'HG: Morning, Rob.')
        ];
        expect(captionsRenderer.updateCurrentCues(cues).length, '').to.equal(1);

        cues = [
            new VTTCue(12, 15, 'EG: Hey, Jo...'),
            new VTTCue(13, 14, 'JB: Yeah?'),
            new VTTCue(13, 14, 'JP: Yeah?')
        ];
        expect(captionsRenderer.updateCurrentCues(cues).length, '').to.equal(3);

        cues = [];
        expect(captionsRenderer.updateCurrentCues(cues).length, '').to.equal(0);
    });
});

