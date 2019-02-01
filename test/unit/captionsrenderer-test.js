import MockModel from 'mock/mock-model';
import ViewModel from 'view/view-model';
import CaptionsRenderer from 'view/captionsrenderer';
import VTTCue from 'parsers/captions/vttcue';

describe('CaptionsRenderer.getCurrentCues', function() {
    let captionsRenderer;
    let model;
    beforeEach(function () {
        model = new MockModel();
        model.setup({});
        captionsRenderer = new CaptionsRenderer(new ViewModel(model));
        captionsRenderer.setup('player', {});
    });

    it('should show the correct number of cues at any given position in time', function() {
        const allCues = [
            new VTTCue(0, 3, 'HG: Morning, Rob.'),
            new VTTCue(4, 5, 'How are you?'),
            new VTTCue(7, 10, 'RW: Good, and you?'),
            new VTTCue(10, 14, 'I\'m great!'),
            new VTTCue(12, 15, 'EG: Hey, Jo...'),
            new VTTCue(13, 14, 'JB: Yeah?'),
            new VTTCue(13, 14, 'JP: Yeah?'),
            new VTTCue(16, null, 'The End')
        ];
        const currentNumCues = [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 2, 1, 2, 4, 4, 1, 1];

        for (let i = 0; i < currentNumCues.length; i += 1) {
            expect(captionsRenderer.getCurrentCues(allCues, i).length, 'Invalid number of cues at position ' + i).to.equal(currentNumCues[i]);
        }
    });
});

