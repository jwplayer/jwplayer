import { Browser, OS } from 'environment/environment';
import { USER_ACTION, STATE_PLAYING } from 'events/events';
import { cloneIcons } from 'view/controls/icons';
import CustomButton from 'view/controls/components/custom-button';
import TimeSlider from 'view/controls/components/timeslider';
import VolumeTooltip from 'view/controls/components/volumetooltip';
import button from 'view/controls/components/button';
import { SimpleTooltip } from 'view/controls/components/simple-tooltip';
import ariaLabel from 'utils/aria';
import Events from 'utils/backbone.events';
import { prependChild, setAttribute, toggleClass } from 'utils/dom';
import { timeFormat } from 'utils/parser';
import UI from 'utils/ui';
import { each } from 'utils/underscore';
import { genId, FEED_SHOWN_ID_LENGTH } from 'utils/random-id-generator';

function text(name, role) {
    const element = document.createElement('span');
    element.className = 'jw-text jw-reset ' + name;
    if (role) {
        setAttribute(element, 'role', role);
    }
    return element;
}

function textIcon(name, role) {
    const element = document.createElement('div');
    element.className = 'jw-icon jw-icon-inline jw-text jw-reset ' + name;
    if (role) {
        setAttribute(element, 'role', role);
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
            cloneIcons('airplay-off,airplay-on'));

        SimpleTooltip(airplayButton.element(), 'airplay', localization.airplay);

        return airplayButton;
    }

    if (!Browser.chrome || OS.iOS) {
        return;
    }


    const castButton = document.createElement('google-cast-launcher');
    setAttribute(castButton, 'type', 'button');
    setAttribute(castButton, 'tabindex', '-1');
    castButton.className += ' jw-reset';

    const element = document.createElement('div');
    element.className = 'jw-reset jw-icon jw-icon-inline jw-icon-cast jw-button-color';
    element.style.display = 'none';
    element.style.cursor = 'pointer';
    element.appendChild(castButton);
    ariaLabel(element, localization.cast);

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
        let feedShownId = '';

        const vol = localization.volume;

        // Do not show the volume toggle in the mobile SDKs or <iOS10
        if (!_model.get('sdkplatform') && !(OS.iOS && OS.version.major < 10)) {
            // Clone icons so that can be used in VolumeTooltip
            const svgIcons = cloneIcons('volume-0,volume-100');
            muteButton = button('jw-icon-volume', () => {
                _api.setMute();
            }, vol, svgIcons);
        }

        // Do not initialize volume slider or tooltip on mobile
        if (!this._isMobile) {
            volumeTooltip = new VolumeTooltip(_model, 'jw-icon-volume', vol,
                cloneIcons('volume-0,volume-50,volume-100'));

            const volumeTooltipEl = volumeTooltip.element();
            setAttribute(volumeTooltipEl, 'aria-valuemin', 0);
            setAttribute(volumeTooltipEl, 'aria-valuemax', 100);
            setAttribute(volumeTooltipEl, 'role', 'slider');
        }

        const nextButton = button('jw-icon-next', () => {
            _api.next({ feedShownId, reason: 'interaction' });
        }, localization.next, cloneIcons('next'));

        const settingsButton = button('jw-icon-settings jw-settings-submenu-button', (event) => {
            this.trigger('settingsInteraction', 'quality', true, event);
        }, localization.settings, cloneIcons('settings'));
        setAttribute(settingsButton.element(), 'aria-haspopup', 'true');

        const captionsButton = button('jw-icon-cc jw-settings-submenu-button', (event) => {
            this.trigger('settingsInteraction', 'captions', false, event);
        }, localization.cc, cloneIcons('cc-off,cc-on'));
        setAttribute(captionsButton.element(), 'aria-haspopup', 'true');

        const liveButton = button('jw-text-live', () => {
            this.goToLiveEdge();
        }, localization.liveBroadcast);
        liveButton.element().textContent = localization.liveBroadcast;

        const elements = this.elements = {
            alt: text('jw-text-alt', 'status'),
            play: button('jw-icon-playback', () => {
                _api.playToggle(reasonInteraction());
            }, localization.play, cloneIcons('play,pause,stop')),
            rewind: button('jw-icon-rewind', () => {
                this.rewind();
            }, localization.rewind, cloneIcons('rewind')),
            live: liveButton,
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
            }, localization.fullscreen, cloneIcons('fullscreen-off,fullscreen-on')),
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

        const nextElement = elements.next.element();
        const nextUpTip = SimpleTooltip(nextElement, 'next', localization.nextUp, () => {
            const nextUp = _model.get('nextUp');
            feedShownId = genId(FEED_SHOWN_ID_LENGTH);
            this.trigger('nextShown', {
                mode: nextUp.mode,
                ui: 'nextup',
                itemsShown: [nextUp],
                feedData: nextUp.feedData,
                reason: 'hover',
                feedShownId
            });
        }, () => {
            feedShownId = '';
        });
        setAttribute(nextElement, 'dir', 'auto');
        SimpleTooltip(elements.rewind.element(), 'rewind', localization.rewind);
        SimpleTooltip(elements.settingsButton.element(), 'settings', localization.settings);
        const fullscreenTip = SimpleTooltip(elements.fullscreen.element(), 'fullscreen', localization.fullscreen);

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
        _model.change('state', this.onState, this);
        _model.change('duration', this.onDuration, this);
        _model.change('position', this.onElapsed, this);
        _model.change('fullscreen', (model, val) => {
            const fullscreenElement = this.elements.fullscreen.element();
            toggleClass(fullscreenElement, 'jw-off', val);

            const fullscreenText = model.get('fullscreen') ? localization.exitFullscreen : localization.fullscreen;
            fullscreenTip.setText(fullscreenText);
            setAttribute(fullscreenElement, 'aria-label', fullscreenText);
        }, this);
        _model.change('streamType', this.onStreamTypeChange, this);
        _model.change('dvrLive', (model, dvrLive) => {
            const { liveBroadcast, notLive } = localization;
            const liveElement = this.elements.live.element();
            const dvrNotLive = dvrLive === false;
            // jw-dvr-live: Player is in DVR mode but not at the live edge.
            toggleClass(liveElement, 'jw-dvr-live', dvrNotLive);
            setAttribute(liveElement, 'aria-label', dvrNotLive ? notLive : liveBroadcast);
            liveElement.textContent = liveBroadcast;
        }, this);
        _model.change('altText', this.setAltText, this);
        _model.change('customButtons', this.updateButtons, this);
        _model.on('change:captionsIndex', onCaptionsChanged, this);
        _model.on('change:captionsList', onCaptionsChanged, this);
        _model.change('nextUp', (model, nextUp) => {
            feedShownId = genId(FEED_SHOWN_ID_LENGTH);
            let tipText = localization.nextUp;
            if (nextUp && nextUp.title) {
                tipText += (`: ${nextUp.title}`);
            }
            nextUpTip.setText(tipText);
            elements.next.toggle(!!nextUp);
        });
        _model.change('audioMode', this.onAudioMode, this);
        if (elements.cast) {
            _model.change('castAvailable', this.onCastAvailable, this);
            _model.change('castActive', this.onCastActive, this);
        }

        // Event listeners
        // Volume sliders do not exist on mobile so don't assign listeners to them.
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
            new UI(elements.cast.element()).on('click tap enter', function(evt) {
                // controlbar cast button needs to manually trigger a click
                // on the native cast button for taps and enter key
                if (evt.type !== 'click') {
                    elements.cast.button.click();
                }
                this._model.set('castClicked', true);
            }, this);
        }

        new UI(elements.duration).on('click tap enter', function () {
            if (this._model.get('streamType') === 'DVR') {
                // Seek to "Live" position within live buffer, but not before current position
                const currentPosition = this._model.get('position');
                const dvrSeekLimit = this._model.get('dvrSeekLimit');
                this._api.seek(Math.max(-dvrSeekLimit, currentPosition), reasonInteraction());
            }
        }, this);

        // When the control bar is interacted with, trigger a user action event
        new UI(this.el).on('click tap drag', function () {
            this.trigger(USER_ACTION);
        }, this);
        each(menus, function (ele) {
            ele.on('open-tooltip', this.closeMenus, this);
        }, this);
    }

    onVolume(model, pct) {
        this.renderVolume(model.get('mute'), pct);
    }

    onMute(model, muted) {
        this.renderVolume(muted, model.get('volume'));
    }

    renderVolume(muted, vol) {
        const mute = this.elements.mute;
        const volumeTooltip = this.elements.volumetooltip;
        // mute, volume, and volumetooltip do not exist on mobile devices.
        if (mute) {
            toggleClass(mute.element(), 'jw-off', muted);
            toggleClass(mute.element(), 'jw-full', !muted);
        }
        if (volumeTooltip) {
            volumeTooltip.updateVolume(vol, muted);
        }
    }

    onCastAvailable(model, val) {
        this.elements.cast.toggle(val);
    }

    onCastActive(model, val) {
        this.elements.fullscreen.toggle(!val);
        if (this.elements.cast.button) {
            toggleClass(this.elements.cast.button, 'jw-off', !val);
        }
    }

    onElapsed(model, position) {
        let elapsedTime;
        let countdownTime;
        const duration = model.get('duration');
        if (model.get('streamType') === 'DVR') {
            const currentPosition = Math.ceil(position);
            const dvrSeekLimit = this._model.get('dvrSeekLimit');
            let time = currentPosition >= -dvrSeekLimit ? '' : '-' + timeFormat(-(position + dvrSeekLimit));
            elapsedTime = countdownTime = time;
            model.set('dvrLive', currentPosition >= -dvrSeekLimit);
        } else {
            elapsedTime = timeFormat(position);
            countdownTime = timeFormat(duration - position);
        }
        this.elements.elapsed.textContent = elapsedTime;
        this.elements.countdown.textContent = countdownTime;
    }

    onDuration(model, val) {
        this.elements.duration.textContent = timeFormat(Math.abs(val));
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

    element() {
        return this.el;
    }

    setAltText(model, altText) {
        this.elements.alt.textContent = altText;
    }

    // Close menus if it has no event.  Otherwise close all but the event's target.
    closeMenus(evt) {
        each(this.menus, function (ele) {
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

    onState(model, state) {
        const localization = model.get('localization');
        let label = localization.play;
        if (state === STATE_PLAYING) {
            if (model.get('streamType') !== 'LIVE') {
                label = localization.pause;
            } else {
                label = localization.stop;
            }
        }
        setAttribute(this.elements.play.element(), 'aria-label', label);
    }

    onStreamTypeChange(model, streamType) {
        const liveMode = streamType === 'LIVE';
        const dvrMode = streamType === 'DVR';

        // Hide rewind button when in LIVE mode
        this.elements.rewind.toggle(!liveMode);

        this.elements.live.toggle(liveMode || dvrMode);
        setAttribute(this.elements.live.element(), 'tabindex', liveMode ? '-1' : '0');

        this.elements.duration.style.display = dvrMode ? 'none' : '';

        this.onDuration(model, model.get('duration'));
        this.onState(model, model.get('state'));
    }

    addLogo(logo) {
        const buttonContainer = this.elements.buttonContainer;

        const logoButton = new CustomButton(
            logo.file,
            this._model.get('localization').logo,
            () => {
                if (logo.link) {
                    window.open(logo.link, '_blank');
                }
            },
            'logo',
            'jw-logo-button'
        );

        if (!logo.link) {
            setAttribute(logoButton.element(), 'tabindex', '-1');
        }
        buttonContainer.insertBefore(
            logoButton.element(),
            buttonContainer.querySelector('.jw-spacer').nextSibling
        );
    }

    goToLiveEdge() {
        if (this._model.get('streamType') === 'DVR') {
            // Seek to "Live" position within live buffer, but not before current position
            const currentPosition = this._model.get('position');
            const dvrSeekLimit = this._model.get('dvrSeekLimit');

            this._api.seek(Math.max(-dvrSeekLimit, currentPosition), reasonInteraction());
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

    toggleCaptionsButtonState(active) {
        const captionsButton = this.elements.captionsButton;
        if (!captionsButton) {
            return;
        }

        toggleClass(captionsButton.element(), 'jw-off', !active);
    }
}

