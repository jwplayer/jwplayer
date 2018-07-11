import PlayDisplayIcon from 'view/controls/play-display-icon';
import SimpleModel from 'model/simplemodel';

describe('PlayDisplayIcon', function() {
    let model;
    let displayIcon;
    let element;
    let icon;
    let svg;
    const localization = {
        playback: 'Start Playback',
        replay: 'Replay',
        pause: 'Pause',
        buffer: 'Buffering'
    };

    beforeEach(function() {
        model = Object.assign({}, SimpleModel);
        model.set('localization', localization);
        model.set('state', 'idle');
        svg = document.createElement('svg');
        svg.className = 'jw-svg-icon jw-svg-icon-pause';
        icon = document.createElement('div');
        icon.className = 'jw-icon-display';
        icon.appendChild(svg);
        element = document.createElement('div');
        element.appendChild(icon);
    });

    describe('on init', function() {

        it('should not add class if config is not set', function() {
            displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(displayIcon.icon.className).to.not.include('jw-ab-idle-label');
            expect(displayIcon.icon.lastChild.className).to.not.include('jw-idle-icon-text');

        });

        it('should not add class if config is invalid', function() {
            model.set('idleButtonText', 'invalid text');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(displayIcon.icon.className).to.not.include('jw-ab-idle-label');
            expect(displayIcon.icon.lastChild.className).to.not.include('jw-idle-icon-text');
        });

        it('should add class and text if config is "Watch Now"', function() {
            model.set('idleButtonText', 'Watch Now');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(displayIcon.icon.className).to.include('jw-ab-idle-label');
            expect(displayIcon.icon.lastChild.className).to.include('jw-idle-icon-text');
            expect(displayIcon.icon.lastChild.textContent).to.equal('Watch Now');
        });

        it('should add class and text if config is "Click to Play"', function () {
            model.set('idleButtonText', 'Click to Play');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(displayIcon.icon.className).to.include('jw-ab-idle-label');
            expect(displayIcon.icon.lastChild.className).to.include('jw-idle-icon-text');
            expect(displayIcon.icon.lastChild.textContent).to.equal('Click to Play');
        });

        it('should add class and text if config is "Play"', function () {
            model.set('idleButtonText', 'Play');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(displayIcon.icon.className).to.include('jw-ab-idle-label');
            expect(displayIcon.icon.lastChild.className).to.include('jw-idle-icon-text');
            expect(displayIcon.icon.lastChild.textContent).to.equal('Play');
        });
    });

    describe('on state change', function() {

        it('should add class and text if new state is idle (stop playback)', function() {
            model.set('state', 'playing');
            model.set('idleButtonText', 'Watch Now');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'idle');
            expect(displayIcon.icon.className).to.include('jw-ab-idle-label');
            expect(displayIcon.icon.lastChild.className).to.include('jw-idle-icon-text');
            expect(displayIcon.icon.lastChild.textContent).to.equal('Watch Now');
        });

        it('should remove class and text if old state is idle (start playback)', function() {
            model.set('idleButtonText', 'Watch Now');

            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'playing');

            expect(displayIcon.icon.className).to.not.include('jw-ab-idle-label');
            expect(displayIcon.icon.lastChild.className).to.include('jw-idle-icon-text');
            expect(displayIcon.icon.lastChild.textContent).to.equal('');
        });

        it('should add playback aria label if new state is idle (stop playback)', function() {
            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'complete');
            model.set('state', 'idle');

            expect(displayIcon.icon.getAttribute('aria-label')).to.equal(localization.playback);
        });

        it('should add pause aria label if old state is idle (start playback)', function() {
            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'playing');

            expect(displayIcon.icon.getAttribute('aria-label')).to.equal(localization.pause);
        });

        it('should remove aria label if new state label is empty', function() {
            localization.replay = '';
            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'complete');

            expect(displayIcon.icon.getAttribute('aria-label')).to.equal(null);
        });

        it('should remove aria label if new state is invalid', function() {
            displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'invalid');

            expect(displayIcon.icon.getAttribute('aria-label')).to.equal(null);
        });
    });
});
