import MockModel from 'mock/mock-model';
import ViewModel from 'view/view-model';
import CaptionsRenderer from 'view/captionsrenderer';
import VTTCue from 'parsers/captions/vttcue';
import { WARNING } from 'events/events';
import { MSG_CANT_LOAD_PLAYER } from 'api/errors';

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

    it('triggers a standardized warning if the WebVTT polyfill fails to load', function () {
        return new Promise((resolve, reject) => {
            captionsRenderer.on(WARNING, e => {
                const { code, key } = e.reason;
                if (code !== 301121) {
                    reject(`Expected code 301121, got ${code}`);
                } else if (key !== MSG_CANT_LOAD_PLAYER) {
                    reject(`Expected key cantLoadPlayer, got ${code}`);
                }
                resolve();
            });

            // The captionsRenderer will try to load the VTT polyfill in response to the captionsList change event; it
            // will load with a 404 because unit tests don't chunk polyfills.webvtt.js
            model.set('renderCaptionsNatively', false);
            model.set('captionsList', [ {}, {} ]);
        });
    });
});

