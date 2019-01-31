import PlayDisplayIcon from 'view/controls/play-display-icon';
import SimpleModel from 'model/simplemodel';

describe('PlayDisplayIcon', function() {
    let model;
    let element;
    let icon;
    let svg;
    const localization = {
        playback: 'Play',
        replay: 'Replay',
        pause: 'Pause',
        buffer: 'Buffering'
    };

    beforeEach(function() {
        model = new SimpleModel();
        model.set('localization', localization);
        model.set('state', 'idle');
        svg = document.createElement('svg');
        svg.className = 'jw-svg-icon jw-svg-icon-pause';
        icon = document.createElement('div');
        icon.className = 'jw-icon jw-icon-display';
        icon.appendChild(svg);
        element = document.createElement('div');
        element.appendChild(icon);
    });

    describe('on init', function() {

        it('should not add class if config is not set', function() {
            const displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(displayIcon.icon.className).to.not.include('jw-idle-label');
            expect(displayIcon.icon.lastChild.className).to.not.include('jw-idle-icon-text');
        });

        it('should not create element if displayPlaybackLabel is false', function () {
            const displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(displayIcon.icon.className).to.not.include('jw-idle-label');
            expect(displayIcon.icon.lastChild.className).to.not.include('jw-idle-icon-text');
        });

        it('should create element when displayPlaybackLabel is true', function () {
            model.set('displayPlaybackLabel', true);
            const displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(displayIcon.icon.className).to.include('jw-idle-label');
            expect(displayIcon.icon.lastChild.className).to.include('jw-idle-icon-text');
            expect(displayIcon.icon.textContent).to.equal(localization.playback);
        });

        it('should set playback label to the value of localization.playback', function() {
            const defaultPlaybackLocalization = localization.playback;
            localization.playback = 'Jugar';
            model.set('displayPlaybackLabel', true);
            const displayIcon = new PlayDisplayIcon(model, {}, element);

            expect(displayIcon.icon.className).to.include('jw-idle-label');
            expect(displayIcon.icon.lastChild.className).to.include('jw-idle-icon-text');
            expect(displayIcon.icon.textContent).to.equal(localization.playback);
            expect(displayIcon.icon.textContent).to.not.equal(defaultPlaybackLocalization);
        });
    });

    describe('on state change', function() {
        it('should add playback aria label if new state is idle (stop playback)', function() {
            const displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'complete');
            model.set('state', 'idle');

            expect(displayIcon.icon.getAttribute('aria-label')).to.equal(localization.playback);
        });

        it('should add pause aria label if old state is idle (start playback)', function() {
            const displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'playing');

            expect(displayIcon.icon.getAttribute('aria-label')).to.equal(localization.pause);
        });

        it('should remove aria label if new state label is empty', function() {
            localization.replay = '';
            const displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'complete');

            expect(displayIcon.icon.getAttribute('aria-label')).to.equal(null);
        });

        it('should remove aria label if new state is invalid', function() {
            const displayIcon = new PlayDisplayIcon(model, {}, element);

            model.set('state', 'invalid');

            expect(displayIcon.icon.getAttribute('aria-label')).to.equal(null);
        });
    });
});
