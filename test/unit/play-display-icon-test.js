import PlayDisplayIcon from 'view/controls/play-display-icon';
import SimpleModel from 'model/simplemodel';

describe('PlayDisplayIcon', function() {
    let model;
    let displayIcon;
    let element;
    let icon;
    const localization = {
        playback: 'Start Playback',
        replay: 'Replay',
        pause: 'Pause',
        buffer: 'Buffering'
    };

    beforeEach(function() {
        model = Object.assign({}, SimpleModel);
        model.set('localization', localization);
        icon = document.createElement('div');
        icon.className = 'jw-icon-display';
        element = document.createElement('div');
        element.appendChild(icon);
    });

    describe('on init', function() {

        it('should not add class if config is not set', function() {
            displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(icon.className).to.not.include('jw-ab-idle-');
        });

        it('should not add class if config is default', function() {
            model.set('idleButton', 'default');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(icon.className).to.not.include('jw-ab-idle-');
        });

        it('should not add class if config is invalid', function() {
            model.set('idleButton', 'invalid');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(icon.className).to.not.include('jw-ab-idle-');
        });

        it('should add class if config is stroke', function() {
            model.set('idleButton', 'stroke');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(icon.className).to.include('jw-ab-idle-stroke');
        });

        it('should add class if config is fill', function() {
            model.set('idleButton', 'fill');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(icon.className).to.include('jw-ab-idle-fill');
        });

        it('should add class if config is label', function() {
            model.set('idleButton', 'label');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(icon.className).to.include('jw-ab-idle-label');
        });
    });

    describe('on state change', function() {

        it('should add class if new state is idle (stop playback)', function() {
            model.set('state', 'playing');
            model.set('idleButton', 'stroke');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'idle');

            expect(icon.className).to.include('jw-ab-idle-stroke');
        });

        it('should remove class if old state is idle (start playback)', function() {
            model.set('state', 'idle');
            model.set('idleButton', 'stroke');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'playing');

            expect(icon.className).to.not.include('jw-ab-idle-stroke');
        });

        it('should add playback aria label if new state is idle (stop playback)', function() {
            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'idle');

            expect(icon.getAttribute('aria-label')).to.equal(localization.playback);
        });

        it('should add pause aria label if old state is idle (start playback)', function() {
            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'playing');

            expect(icon.getAttribute('aria-label')).to.equal(localization.pause);
        });

        it('should remove aria label if new state label is empty', function() {
            localization.replay = '';
            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'complete');

            expect(icon.getAttribute('aria-label')).to.equal(null);
        });

        it('should remove aria label if new state is invalid', function() {
            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'invalid');

            expect(icon.getAttribute('aria-label')).to.equal(null);
        });
    });
});
