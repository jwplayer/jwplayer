import PLAY_ICON from 'assets/SVG/play.svg';
import PAUSE_ICON from 'assets/SVG/pause.svg';
import REWIND_ICON from 'assets/SVG/rewind-10.svg';
import NEXT_ICON from 'assets/SVG/next.svg';
import VOLUME_ICON_0 from 'assets/SVG/volume-0.svg';
import VOLUME_ICON_50 from 'assets/SVG/volume-50.svg';
import VOLUME_ICON_100 from 'assets/SVG/volume-100.svg';
import CAPTIONS_ON_ICON from 'assets/SVG/captions-on.svg';
import CAPTIONS_OFF_ICON from 'assets/SVG/captions-off.svg';
import AIRPLAY_ON_ICON from 'assets/SVG/airplay-on.svg';
import AIRPLAY_OFF_ICON from 'assets/SVG/airplay-off.svg';
import FULLSCREEN_EXIT_ICON from 'assets/SVG/fullscreen-not.svg';
import FULLSCREEN_ENTER_ICON from 'assets/SVG/fullscreen.svg';
import SETTINGS_ICON from 'assets/SVG/settings.svg';
import DVR_ICON from 'assets/SVG/dvr.svg';
import LIVE_ICON from 'assets/SVG/live.svg';
import svgParse from 'utils/svgParser';
import { Browser, OS } from 'environment/environment';
import { dvrSeekLimit } from 'view/constants';
import CustomButton from 'view/controls/components/custom-button';
import utils from 'utils/helpers';
import _ from 'utils/underscore';
import Events from 'utils/backbone.events';
import UI from 'utils/ui';
import ariaLabel from 'utils/aria';
import TimeSlider from 'view/controls/components/timeslider';
import VolumeTooltip from 'view/controls/components/volumetooltip';
import button from 'view/controls/components/button';
import { SimpleTooltip } from 'view/controls/components/simple-tooltip';
import { prependChild } from 'utils/dom';

function text(name, role) {
    const element = document.createElement('span');
    element.className = 'jw-text jw-reset ' + name;
    if (role) {
        element.setAttribute('role', role);
    }
    return element;
}

function textIcon(name, role) {
    const element = document.createElement('div');
    element.className = 'jw-icon jw-icon-inline jw-text jw-reset ' + name;
    if (role) {
        element.setAttribute('role', role);
    }
    return element;
}

function div(classes) {
    const element = document.createElement('div');
    element.className = `jw-reset ${classes}`;
    return element;
}

function createCastButton(castToggle, localization) {

    if (Browser.safari) {
        const airplayButton = button(
            'jw-icon-airplay jw-off',
            castToggle,
            localization.airplay,
            [AIRPLAY_OFF_ICON, AIRPLAY_ON_ICON]);

        SimpleTooltip(airplayButton.element(), 'airplay', localization.airplay);

        return airplayButton;
    }

    if (!Browser.chrome || OS.iOS) {
        return;
    }

    const ariaText = localization.cast;

    const castButton = document.createElement('button', 'google-cast-button');
    ariaLabel(castButton, ariaText);
    castButton.setAttribute('type', 'button');

    const element = document.createElement('div');
    element.className = 'jw-reset jw-icon jw-icon-inline jw-icon-cast jw-button-color';
    element.style.display = 'none';
    element.style.cursor = 'pointer';
    element.appendChild(castButton);

    SimpleTooltip(element, 'chromecast', localization.cast);

    return {
        element: function() {
            return element;
        },
        toggle: function(m) {
            if (m) {
                this.show();
            } else {
                this.hide();
            }
        },
        show: function() {
            element.style.display = '';
        },
        hide: function() {
            element.style.display = 'none';
        },
        button: castButton
    };
}

function reasonInteraction() {
    return { reason: 'interaction' };
}

function buttonsInFirstNotInSecond(buttonsA, buttonsB) {
    return buttonsA.filter(a =>
        !buttonsB.some(b => (b.id + b.btnClass === a.id + a.btnClass) && a.callback === b.callback));
}

const appendChildren = (container, elements) => {
    elements.forEach(e => {
        if (e.element) {
            e = e.element();
        }
        container.appendChild(e);
    });
};

export default class Controlbar {
    constructor(_api, _model) {
        Object.assign(this, Events);
        this._api = _api;
        this._model = _model;
        this._isMobile = OS.mobile;
        const localization = _model.get('localization');
        const timeSlider = new TimeSlider(_model, _api);
        let volumeTooltip;
        let muteButton;

        const play = localization.play;
        const next = localization.next;
        const vol = localization.volume;
        const rewind = localization.rewind;

        const svgCollection = svgParse('<xml>' +
            PLAY_ICON +
            PAUSE_ICON +
            REWIND_ICON +
            NEXT_ICON +
            VOLUME_ICON_0 +
            VOLUME_ICON_50 +
            VOLUME_ICON_100 +
            CAPTIONS_OFF_ICON +
            CAPTIONS_ON_ICON +
            FULLSCREEN_ENTER_ICON +
            FULLSCREEN_EXIT_ICON +
            SETTINGS_ICON +
            LIVE_ICON +
            DVR_ICON +
        '</xml>');

        // Do not show the volume toggle in the mobile SDKs or <iOS10
        if (!_model.get('sdkplatform') && !(OS.iOS && OS.version.major < 10)) {
            // Clone icons so that can be used in VolumeTooltip
            const svgIcons = Array.prototype.map.call(
                svgCollection.querySelectorAll('.jw-svg-icon-volume-0,.jw-svg-icon-volume-100'),
                icon => icon.cloneNode(true));
            muteButton = button('jw-icon-volume', () => {
                _api.setMute();
            }, vol, svgIcons);
        }

        // Do not initialize volume slider or tooltip on mobile
        if (!this._isMobile) {
            volumeTooltip = new VolumeTooltip(_model, 'jw-icon-volume', vol,
                svgCollection.querySelectorAll('.jw-svg-icon-volume-0,.jw-svg-icon-volume-50,.jw-svg-icon-volume-100'));
        }

        const nextButton = button('jw-icon-next', () => {
            _api.next();
        }, next, svgCollection.querySelectorAll('.jw-svg-icon-next'));

        const settingsButton = button('jw-icon-settings jw-settings-submenu-button', () => {
            this.trigger('settingsInteraction', 'quality', true);
        }, localization.settings, svgCollection.querySelectorAll('.jw-svg-icon-settings'));
        settingsButton.element().setAttribute('aria-haspopup', 'true');

        const captionsButton = button('jw-icon-cc jw-settings-submenu-button', () => {
            this.trigger('settingsInteraction', 'captions', false);
        }, localization.cc, svgCollection.querySelectorAll('.jw-svg-icon-cc-off,.jw-svg-icon-cc-on'));
        captionsButton.element().setAttribute('aria-haspopup', 'true');

        const elements = this.elements = {
            alt: text('jw-text-alt', 'status'),
            play: button('jw-icon-playback', () => {
                _api.play(null, reasonInteraction());
            }, play, svgCollection.querySelectorAll('.jw-svg-icon-play,.jw-svg-icon-pause')),
            rewind: button('jw-icon-rewind', () => {
                this.rewind();
            }, rewind, svgCollection.querySelectorAll('.jw-svg-icon-rewind')),
            live: button('jw-icon-live', () => {
                this.goToLiveEdge();
            }, localization.liveBroadcast, svgCollection.querySelectorAll('.jw-svg-icon-live,.jw-svg-icon-dvr')),
            next: nextButton,
            elapsed: textIcon('jw-text-elapsed', 'timer'),
            countdown: textIcon('jw-text-countdown', 'timer'),
            time: timeSlider,
            duration: textIcon('jw-text-duration', 'timer'),
            mute: muteButton,
            volumetooltip: volumeTooltip,
            cast: createCastButton(() => {
                _api.castToggle();
            }, localization),
            fullscreen: button('jw-icon-fullscreen', () => {
                _api.setFullscreen();
            }, localization.fullscreen,
            svgCollection.querySelectorAll('.jw-svg-icon-fullscreen-off,.jw-svg-icon-fullscreen-on')),
            spacer: div('jw-spacer'),
            buttonContainer: div('jw-button-container'),
            settingsButton,
            captionsButton
        };

        // Add text tooltips
        const captionsTip = SimpleTooltip(captionsButton.element(), 'captions', localization.cc);
        const onCaptionsChanged = (model) => {
            const currentCaptions = model.get('captionsList')[model.get('captionsIndex')];
            let newText = localization.cc;
            if (currentCaptions && currentCaptions.label !== 'Off') {
                newText = currentCaptions.label;
            }
            captionsTip.setText(newText);
        };

        const nextUpTip = SimpleTooltip(elements.next.element(), 'next', localization.nextUp, () => {
            const nextUp = _model.get('nextUp');

            this.trigger('nextShown', {
                mode: nextUp.mode,
                ui: 'nextup',
                itemsShown: [nextUp],
                feedData: nextUp.feedData,
                reason: 'hover'
            });
        });
        SimpleTooltip(elements.rewind.element(), 'rewind', localization.rewind);
        SimpleTooltip(elements.settingsButton.element(), 'settings', localization.settings);
        SimpleTooltip(elements.fullscreen.element(), 'fullscreen', localization.fullscreen);

        // Filter out undefined elements
        const buttonLayout = [
            elements.play,
            elements.rewind,
            elements.next,
            elements.volumetooltip,
            elements.mute,
            elements.alt,
            elements.live,
            elements.elapsed,
            elements.countdown,
            elements.duration,
            elements.spacer,
            elements.cast,
            elements.captionsButton,
            elements.settingsButton,
            elements.fullscreen
        ].filter(e => e);

        const layout = [
            elements.time,
            elements.buttonContainer
        ].filter(e => e);

        const menus = this.menus = [
            elements.volumetooltip
        ].filter(e => e);

        this.el = document.createElement('div');
        this.el.className = 'jw-controlbar jw-reset';

        appendChildren(elements.buttonContainer, buttonLayout);
        appendChildren(this.el, layout);

        const logo = _model.get('logo');
        if (logo && logo.position === 'control-bar') {
            this.addLogo(logo);
        }

        // Initial State
        elements.play.show();
        elements.fullscreen.show();
        if (elements.mute) {
            elements.mute.show();
        }

        // Listen for model changes
        _model.change('volume', this.onVolume, this);
        _model.change('mute', this.onMute, this);
        _model.change('duration', this.onDuration, this);
        _model.change('position', this.onElapsed, this);
        _model.change('fullscreen', this.onFullscreen, this);
        _model.change('streamType', this.onStreamTypeChange, this);
        _model.change('cues', this.addCues, this);
        _model.change('altText', this.setAltText, this);
        _model.change('customButtons', this.updateButtons, this);
        _model.change('state', () => {
            // Check for change of position to counter race condition where state is updated before the current position
            _model.once('change:position', this.checkDvrLiveEdge, this);
        }, this);
        _model.on('change:captionsIndex', onCaptionsChanged, this);
        _model.on('change:captionsList', onCaptionsChanged, this);
        _model.change('nextUp', (model, nextUp) => {
            let tipText = localization.nextUp;
            if (nextUp && nextUp.title) {
                tipText += (`: ${nextUp.title}`);
            }
            nextUpTip.setText(tipText);
            elements.next.toggle(!!nextUp);
        });
        _model.on('change:audioMode', this.onAudioMode, this);
        if (elements.cast) {
            _model.change('castAvailable', this.onCastAvailable, this);
            _model.change('castActive', this.onCastActive, this);
        }

        // Event listeners
        // Volume sliders do not exist on mobile so don't assign listeners to them.
        if (elements.volume) {
            elements.volume.on('update', function (pct) {
                var val = pct.percentage;
                this._api.setVolume(val);
            }, this);
        }
        if (elements.volumetooltip) {
            elements.volumetooltip.on('update', function (pct) {
                const val = pct.percentage;
                this._api.setVolume(val);
            }, this);
            elements.volumetooltip.on('toggleValue', function () {
                this._api.setMute();
            }, this);
        }

        if (elements.cast && elements.cast.button) {
            new UI(elements.cast.button).on('click tap', function () {
                this._model.set('castClicked', true);
            }, this);
        }

        this._model.mediaController.on('seeked', function () {
            _model.once('change:position', this.checkDvrLiveEdge, this);
        }, this);

        new UI(elements.duration).on('click tap', function () {
            if (this._model.get('streamType') === 'DVR') {
                // Seek to "Live" position within live buffer, but not before current position
                const currentPosition = this._model.get('position');
                this._api.seek(Math.max(dvrSeekLimit, currentPosition), reasonInteraction());
            }
        }, this);

        // When the control bar is interacted with, trigger a user action event
        new UI(this.el).on('click tap drag', function () {
            this.trigger('userAction');
        }, this);

        _.each(menus, function (ele) {
            ele.on('open-tooltip', this.closeMenus, this);
        }, this);

        if (_model.get('audioMode')) {
            this.onAudioMode(_model, true);
        }
    }

    onVolume(model, pct) {
        this.renderVolume(model.get('mute'), pct);
    }

    onMute(model, muted) {
        this.renderVolume(muted, model.get('volume'));
    }

    renderVolume(muted, vol) {
        // mute, volume, and volumetooltip do not exist on mobile devices.
        if (this.elements.mute) {
            utils.toggleClass(this.elements.mute.element(), 'jw-off', muted);
            utils.toggleClass(this.elements.mute.element(), 'jw-full', !muted);
        }
        if (this.elements.volume) {
            this.elements.volume.render(muted ? 0 : vol);
        }
        if (this.elements.volumetooltip) {
            this.elements.volumetooltip.volumeSlider.render(muted ? 0 : vol);
            utils.toggleClass(this.elements.volumetooltip.element(), 'jw-off', muted);
            utils.toggleClass(this.elements.volumetooltip.element(), 'jw-full', vol === 100 && !muted);
        }
    }

    onCastAvailable(model, val) {
        this.elements.cast.toggle(val);
    }

    onCastActive(model, val) {
        this.elements.fullscreen.toggle(!val);
        if (this.elements.cast.button) {
            utils.toggleClass(this.elements.cast.button, 'jw-off', !val);
        }
    }

    onElapsed(model, val) {
        let elapsedTime;
        let countdownTime;
        const duration = model.get('duration');
        if (model.get('streamType') === 'DVR') {
            elapsedTime = countdownTime = val >= dvrSeekLimit ? '' : '-' + utils.timeFormat(-val);
        } else {
            elapsedTime = utils.timeFormat(val);
            countdownTime = utils.timeFormat(duration - val);
        }
        this.elements.elapsed.textContent = elapsedTime;
        this.elements.countdown.textContent = countdownTime;
    }

    onDuration(model, val) {
        this.elements.duration.textContent = utils.timeFormat(Math.abs(val));
    }

    onFullscreen(model, val) {
        utils.toggleClass(this.elements.fullscreen.element(), 'jw-off', val);
    }

    onAudioMode(model, val) {
        const timeSlider = this.elements.time.element();
        if (val) {
            this.elements.buttonContainer.insertBefore(
                timeSlider,
                this.elements.elapsed
            );
        } else {
            prependChild(this.el, timeSlider);
        }
    }

    checkDvrLiveEdge() {
        if (this._model.get('streamType') === 'DVR') {
            const currentPosition = this._model.get('position');
            // update live icon and displayed time when DVR stream enters or exits live edge
            utils.toggleClass(this.elements.live.element(), 'jw-dvr-live', currentPosition >= dvrSeekLimit);
            this.onElapsed(this._model, currentPosition);
        }
    }

    element() {
        return this.el;
    }

    setAltText(model, altText) {
        this.elements.alt.textContent = altText;
    }

    addCues(model, cues) {
        if (this.elements.time) {
            _.each(cues, function (ele) {
                this.elements.time.addCue(ele);
            }, this);
            this.elements.time.drawCues();
        }
    }

    // Close menus if it has no event.  Otherwise close all but the event's target.
    closeMenus(evt) {
        _.each(this.menus, function (ele) {
            if (!evt || evt.target !== ele.el) {
                ele.closeTooltip(evt);
            }
        });
    }

    rewind() {
        const currentPosition = this._model.get('position');
        const duration = this._model.get('duration');
        const rewindPosition = currentPosition - 10;
        let startPosition = 0;

        // duration is negative in DVR mode
        if (this._model.get('streamType') === 'DVR') {
            startPosition = duration;
        }
        // Seek 10s back. Seek value should be >= 0 in VOD mode and >= (negative) duration in DVR mode
        this._api.seek(Math.max(rewindPosition, startPosition), reasonInteraction());
    }

    onStreamTypeChange(model) {
        // Hide rewind button when in LIVE mode
        const streamType = model.get('streamType');
        this.elements.rewind.toggle(streamType !== 'LIVE');
        this.elements.live.toggle(streamType === 'LIVE' || streamType === 'DVR');
        this.elements.duration.style.display = streamType === 'DVR' ? 'none' : '';
        const duration = model.get('duration');
        this.onDuration(model, duration);
    }

    addLogo(logo) {
        const buttonContainer = this.elements.buttonContainer;

        const logoButton = new CustomButton(
            logo.file,
            'Logo',
            () => {
                if (logo.link) {
                    window.open(logo.link, '_blank');
                }
            },
            'logo'
        );

        buttonContainer.insertBefore(
            logoButton.element(),
            buttonContainer.querySelector('.jw-spacer').nextSibling
        );
    }

    goToLiveEdge() {
        if (this._model.get('streamType') === 'DVR') {
            // Seek to "Live" position within live buffer, but not before current position
            const currentPosition = this._model.get('position');
            this._api.seek(Math.max(dvrSeekLimit, currentPosition), reasonInteraction());
        }
    }

    updateButtons(model, newButtons, oldButtons) {
        // If buttons are undefined exit, buttons are only removed if newButtons is an array
        if (!newButtons) {
            return;
        }

        const buttonContainer = this.elements.buttonContainer;

        let addedButtons;
        let removedButtons;

        // On model.change these obects are the same and all buttons need to be added
        if (newButtons === oldButtons || !oldButtons) {
            addedButtons = newButtons;

        } else {
            addedButtons = buttonsInFirstNotInSecond(newButtons, oldButtons);
            removedButtons = buttonsInFirstNotInSecond(oldButtons, newButtons);

            this.removeButtons(buttonContainer, removedButtons);
        }

        for (let i = addedButtons.length - 1; i >= 0; i--) {
            let buttonProps = addedButtons[i];
            const newButton = new CustomButton(
                buttonProps.img,
                buttonProps.tooltip,
                buttonProps.callback,
                buttonProps.id,
                buttonProps.btnClass
            );

            if (buttonProps.tooltip) {
                SimpleTooltip(newButton.element(), buttonProps.id, buttonProps.tooltip);
            }

            let firstButton;
            if (newButton.id === 'related') {
                firstButton = this.elements.settingsButton.element();
            } else if (newButton.id === 'share') {
                firstButton = buttonContainer.querySelector('[button="related"]') ||
                    this.elements.settingsButton.element();
            } else {
                firstButton = this.elements.spacer.nextSibling;
                if (firstButton && firstButton.getAttribute('button') === 'logo') {
                    firstButton = firstButton.nextSibling;
                }
            }
            buttonContainer.insertBefore(newButton.element(), firstButton);
        }
    }

    removeButtons(buttonContainer, buttonsToRemove) {
        for (let i = buttonsToRemove.length; i--;) {
            const buttonElement = buttonContainer.querySelector(`[button="${buttonsToRemove[i].id}"]`);
            if (buttonElement) {
                buttonContainer.removeChild(buttonElement);
            }
        }
    }

    useInstreamTime(instreamModel) {
        // While in instream mode, the time slider needs to move according to instream time
        const timeSlider = this.elements.time;
        if (!timeSlider) {
            return;
        }

        instreamModel
            .change('position', timeSlider.onPosition, timeSlider)
            .change('duration', timeSlider.onDuration, timeSlider)
            .change('duration', () => {
                timeSlider.streamType = 'VOD';
            }, timeSlider);
    }

    syncPlaybackTime(model) {
        // When resuming playback mode, trigger a change so that the slider immediately resumes it's original position
        const timeSlider = this.elements.time;
        if (!timeSlider) {
            return;
        }

        timeSlider.onPosition(model, model.get('position'));
        timeSlider.onDuration(model, model.get('duration'));
        timeSlider.onStreamType(model, model.get('streamType'));
    }

    toggleCaptionsButtonState(active) {
        const captionsButton = this.elements.captionsButton;
        if (!captionsButton) {
            return;
        }

        utils.toggleClass(captionsButton.element(), 'jw-off', !active);
    }
}

