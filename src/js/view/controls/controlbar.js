import PLAY_ICON from 'assets/SVG/play.svg';
import PAUSE_ICON from 'assets/SVG/pause.svg';
import REWIND_ICON from 'assets/SVG/rewind-10.svg';
import NEXT_ICON from 'assets/SVG/next.svg';
import VOLUME_ICON_0 from 'assets/SVG/volume-0.svg';
import VOLUME_ICON_50 from 'assets/SVG/volume-50.svg';
import VOLUME_ICON_100 from 'assets/SVG/volume-100.svg';
import CAPTIONS_ON_ICON from 'assets/SVG/captions-on.svg';
import CAPTIONS_OFF_ICON from 'assets/SVG/captions-off.svg';
import PLAYBACK_RATE_ICON from 'assets/SVG/playback-rate.svg';
import AUDIO_TRACKS_ICON from 'assets/SVG/audio-tracks.svg';
import AIRPLAY_ON_ICON from 'assets/SVG/airplay-on.svg';
import AIRPLAY_OFF_ICON from 'assets/SVG/airplay-off.svg';
import FULLSCREEN_EXIT_ICON from 'assets/SVG/fullscreen-not.svg';
import FULLSCREEN_ENTER_ICON from 'assets/SVG/fullscreen.svg';
import SETTINGS_ICON from 'assets/SVG/settings.svg';
import DVR_ICON from 'assets/SVG/dvr.svg';
import LIVE_ICON from 'assets/SVG/live.svg';
import QUALITY_ICON from 'assets/SVG/quality-100.svg';
import { Browser, OS } from 'environment/environment';
import { dvrSeekLimit } from 'view/constants';
import CustomButton from 'view/controls/components/custom-button';
import utils from 'utils/helpers';
import _ from 'utils/underscore';
import Events from 'utils/backbone.events';
import UI from 'utils/ui';
import ariaLabel from 'utils/aria';
import TimeSlider from 'view/controls/components/timeslider';
import Menu from 'view/controls/components/menu';
import SelectionDisplayMenu from 'view/controls/components/selection-display-menu';
import VolumeTooltip from 'view/controls/components/volumetooltip';
import button from 'view/controls/components/button';

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

function menu(name, ariaText, svgIcons) {
    return new Menu(name, ariaText, null, svgIcons);
}

function createCastButton(castToggle, localization) {
    if (!Browser.chrome || OS.iOS) {
        return button('jw-icon-airplay jw-off', castToggle, localization.airplay, [AIRPLAY_OFF_ICON,
            AIRPLAY_ON_ICON]);
    }

    const ariaText = localization.cast;

    const castButton = document.createElement('button', 'google-cast-button');
    castButton.className = 'jw-button-color';
    ariaLabel(castButton, ariaText);

    const element = document.createElement('div');
    element.className = 'jw-reset jw-icon jw-icon-inline jw-icon-cast';
    element.style.display = 'none';
    element.style.cursor = 'pointer';
    element.appendChild(castButton);

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
        this._localization = _model.get('localization');

        this.nextUpToolTip = null;

        const timeSlider = new TimeSlider(_model, _api);
        let volumeTooltip;
        let muteButton;

        const play = this._localization.play;
        const next = this._localization.next;
        const vol = this._localization.volume;
        const rewind = this._localization.rewind;

        // Do not initialize volume slider or tooltip on mobile
        if (!this._isMobile) {
            volumeTooltip = new VolumeTooltip(_model, 'jw-icon-volume', vol, [VOLUME_ICON_0, VOLUME_ICON_50,
                VOLUME_ICON_100]);
        }
        // Do not show the volume toggle in the mobile SDKs or <iOS10
        if (!_model.get('sdkplatform') && !(OS.iOS && OS.version.major < 10)) {
            muteButton = button('jw-icon-volume', () => {
                _api.setMute();
            }, vol);
        }

        const nextButton = button('jw-icon-next', () => {
            _api.next();
        }, next, [NEXT_ICON]);

        if (_model.get('nextUpDisplay')) {
            new UI(nextButton.element(), { useHover: true, directSelect: true })
                .on('over', function () {
                    const nextUpToolTip = this.nextUpToolTip;
                    if (nextUpToolTip) {
                        nextUpToolTip.toggle(true, 'hover');
                    }
                }, this)
                .on('out', function () {
                    const nextUpToolTip = this.nextUpToolTip;
                    if (nextUpToolTip) {
                        if (nextUpToolTip.nextUpSticky) {
                            return;
                        }
                        nextUpToolTip.toggle(false);
                    }
                }, this);
        }

        const elements = this.elements = {
            alt: text('jw-text-alt', 'status'),
            play: button('jw-icon-playback', () => {
                _api.play(null, reasonInteraction());
            }, play, [PLAY_ICON, PAUSE_ICON]),
            rewind: button('jw-icon-rewind', () => {
                this.rewind();
            }, rewind, [REWIND_ICON]),
            live: button('jw-icon-live', () => {
                this.goToLiveEdge();
            }, this._localization.liveBroadcast, [LIVE_ICON, DVR_ICON]),
            next: nextButton,
            elapsed: textIcon('jw-text-elapsed', 'timer'),
            countdown: textIcon('jw-text-countdown', 'timer'),
            time: timeSlider,
            duration: textIcon('jw-text-duration', 'timer'),
            hd: menu('jw-icon-hd', this._localization.hd, [QUALITY_ICON]),
            cc: menu('jw-icon-cc', this._localization.cc, [CAPTIONS_ON_ICON, CAPTIONS_OFF_ICON]),
            audiotracks: menu('jw-icon-audio-tracks', this._localization.audioTracks, [AUDIO_TRACKS_ICON]),
            playbackrates: new SelectionDisplayMenu(
                'jw-icon-playback-rate',
                this._localization.playbackRates,
                PLAYBACK_RATE_ICON
            ),
            mute: muteButton,
            volumetooltip: volumeTooltip,
            cast: createCastButton(() => {
                _api.castToggle();
            }, this._localization),
            // TODO: instantiate with proper constructor when John Bartos' menu is merged
            settings: button('jw-icon-settings', () => {}, this._localization.settings, [SETTINGS_ICON]),
            fullscreen: button('jw-icon-fullscreen', () => {
                _api.setFullscreen();
            }, this._localization.fullscreen, [FULLSCREEN_ENTER_ICON, FULLSCREEN_EXIT_ICON]),
            spacer: div('jw-spacer'),
            buttonContainer: div('jw-button-container')
        };

        // Filter out undefined elements
        const buttonLayout = [
            elements.play,
            elements.rewind,
            elements.volumetooltip,
            elements.mute,
            elements.alt,
            elements.elapsed,
            elements.countdown,
            elements.live,
            elements.duration,
            elements.spacer,
            elements.next,
            elements.hd,
            elements.cc,
            elements.audiotracks,
            elements.playbackrates,
            elements.cast,
            elements.settings,
            elements.fullscreen
        ].filter(e => e);

        const layout = [
            elements.time,
            elements.buttonContainer
        ].filter(e => e);

        const menus = this.menus = [
            elements.hd,
            elements.cc,
            elements.audiotracks,
            elements.playbackrates,
            elements.volumetooltip
        ].filter(e => e);

        this.el = document.createElement('div');
        this.el.className = 'jw-controlbar jw-background-color jw-reset';

        appendChildren(elements.buttonContainer, buttonLayout);
        appendChildren(this.el, layout);

        const logo = _model.get('logo');
        if (logo && logo.position === 'control-bar') {
            this.addLogo(logo);
        }

        // Initial State
        elements.play.show();
        // TODO: update when John Bartos' menu is merged
        elements.settings.show();
        elements.fullscreen.show();
        if (elements.mute) {
            elements.mute.show();
        }

        // Listen for model changes
        _model.change('volume', this.onVolume, this);
        _model.change('mute', this.onMute, this);
        _model.change('playlistItem', this.onPlaylistItem, this);
        _model.change('mediaModel', this.onMediaModel, this);
        _model.change('castAvailable', this.onCastAvailable, this);
        _model.change('castActive', this.onCastActive, this);
        _model.change('duration', this.onDuration, this);
        _model.change('position', this.onElapsed, this);
        _model.change('fullscreen', this.onFullscreen, this);
        _model.change('captionsList', this.onCaptionsList, this);
        _model.change('captionsIndex', this.onCaptionsIndex, this);
        _model.change('streamType', this.onStreamTypeChange, this);
        _model.change('nextUp', this.onNextUp, this);
        _model.change('cues', this.addCues, this);
        _model.change('altText', this.setAltText, this);
        _model.change('customButtons', this.updateButtons, this);
        _model.change('state', () => {
            // Check for change of position to counter race condition where state is updated before the current position
            _model.once('change:position', this.checkDvrLiveEdge, this);
        }, this);
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

        if (elements.cast.button) {
            new UI(elements.cast.button).on('click tap', function () {
                this._model.set('castClicked', true);
            }, this);
        }

        elements.hd.on('select', function (value) {
            this._model.getVideo().setCurrentQuality(value);
        }, this);
        elements.hd.on('toggleValue', function () {
            this._model.getVideo().setCurrentQuality((this._model.getVideo().getCurrentQuality() === 0) ? 1 : 0);
        }, this);

        elements.cc.on('select', function (value) {
            this._api.setCurrentCaptions(value);
        }, this);
        elements.cc.on('toggleValue', function () {
            const index = this._model.get('captionsIndex');
            this._api.setCurrentCaptions(index ? 0 : 1);
        }, this);

        elements.audiotracks.on('select', function (value) {
            this._model.getVideo().setCurrentAudioTrack(value);
        }, this);
      
        this._model.mediaController.on('seeked', function () {
            this.checkDvrLiveEdge();
        }, this);

        let playbackRateControls = _model.get('playbackRateControls');
        if (playbackRateControls) {
            let playbackRates = _model.get('playbackRates');
            let selectedIndex = playbackRates.indexOf(this._model.get('playbackRate'));
            let playbackRateLabels = playbackRates.map((playbackRate) => {
                return {
                    label: playbackRate + 'x',
                    rate: playbackRate
                };
            });

            elements.playbackrates.setup(
                playbackRateLabels,
                selectedIndex,
                { defaultIndex: playbackRates.indexOf(1), isToggle: false }
            );

            _model.change('streamType provider', this.togglePlaybackRateControls, this);
            _model.change('playbackRate', this.onPlaybackRate, this);

            elements.playbackrates.on('select', function (index) {
                this._model.setPlaybackRate(playbackRates[index]);
            }, this);

            elements.playbackrates.on('toggleValue', function () {
                const index = playbackRates.indexOf(this._model.get('playbackRate'));
                this._model.setPlaybackRate(playbackRates[index ? 0 : 1]);
            }, this);
        }

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
    }

    onCaptionsList(model, tracks) {
        const index = model.get('captionsIndex');
        this.elements.cc.setup(tracks, index, { isToggle: true });
    }

    onCaptionsIndex(model, index) {
        this.elements.cc.selectItem(index);
    }

    togglePlaybackRateControls(model) {
        const showPlaybackRateControls =
            model.getVideo().supportsPlaybackRate &&
            model.get('streamType') !== 'LIVE' &&
            model.get('playbackRateControls') &&
            model.get('playbackRates').length > 1;

        utils.toggleClass(this.elements.playbackrates.el, 'jw-hidden', !showPlaybackRateControls);
    }

    onPlaybackRate(model, value) {
        this.elements.playbackrates.selectItem(model.get('playbackRates').indexOf(value));
    }

    onPlaylistItem() {
        this.elements.audiotracks.setup();
    }

    onMediaModel(model, mediaModel) {
        mediaModel.on('change:levels', function (levelsChangeModel, levels) {
            this.elements.hd.setup(levels, levelsChangeModel.get('currentLevel'));
        }, this);
        mediaModel.on('change:currentLevel', function (currentLevelChangeModel, level) {
            this.elements.hd.selectItem(level);
        }, this);
        mediaModel.on('change:audioTracks', function (audioTracksChangeModel, audioTracks) {
            const list = _.map(audioTracks, function (track) {
                return { label: track.name };
            });
            this.elements.audiotracks.setup(list, audioTracksChangeModel.get('currentAudioTrack'),
                { isToggle: false });
        }, this);
        mediaModel.on('change:currentAudioTrack', function (currentAudioTrackChangeModel, currentAudioTrack) {
            this.elements.audiotracks.selectItem(currentAudioTrack);
        }, this);
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
            elapsedTime = countdownTime = '-' + utils.timeFormat(-duration);
        } else {
            elapsedTime = utils.timeFormat(val);
            countdownTime = utils.timeFormat(duration - val);
        }
        this.elements.elapsed.textContent = elapsedTime;
        this.elements.countdown.textContent = countdownTime;
    }

    onDuration(model, val) {
        let totalTime;
        if (model.get('streamType') === 'DVR') {
            totalTime = 'Live';
        } else {
            totalTime = utils.timeFormat(val);
        }
        this.elements.duration.textContent = totalTime;
    }

    onFullscreen(model, val) {
        utils.toggleClass(this.elements.fullscreen.element(), 'jw-off', val);
    }
              
    checkDvrLiveEdge() {
        if (this._model.get('streamType') === 'DVR') {
            const currentPosition = this._model.get('position');
            utils.toggleClass(this.elements.live.element(), 'jw-dvr-live', currentPosition >= dvrSeekLimit);
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

    onNextUp(model, nextUp) {
        this.elements.next.toggle(!!nextUp);
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

    updateButtons(model, newButtons = [], oldButtons = []) {
        const buttonContainer = this.elements.buttonContainer;
        this.removeButtons(buttonContainer, oldButtons);

        for (let i = newButtons.length - 1; i >= 0; i--) {
            const newButton = new CustomButton(
                newButtons[i].img,
                newButtons[i].tooltip,
                newButtons[i].callback,
                newButtons[i].id,
                newButtons[i].btnClass
            );

            let firstButton = buttonContainer.querySelector('.jw-spacer').nextSibling;
            if (firstButton && firstButton.getAttribute('button') === 'logo') {
                firstButton = firstButton.nextSibling;
            }

            buttonContainer.insertBefore(
                newButton.element(),
                firstButton
            );
        }
    }

    removeButtons(buttonContainer, oldButtons = []) {
        const toRemove = {};
        const buttonElements = _.clone(buttonContainer.children);

        for (let i = 0; i < oldButtons.length; i++) {
            const oldButton = oldButtons[i];
            toRemove[oldButton.id] = oldButton;
        }

        for (let i = 0; i < buttonElements.length; i++) {
            const buttonElement = buttonElements[i];
            if (!buttonElement) {
                return;
            }

            const id = buttonElement.getAttribute('button');

            if (toRemove[id]) {
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
            .change('duration', timeSlider.onDuration, timeSlider);
    }

    syncPlaybackTime(model) {
        // When resuming playback mode, trigger a change so that the slider immediately resumes it's original position
        const timeSlider = this.elements.time;
        if (!timeSlider) {
            return;
        }

        timeSlider.onPosition(model, model.get('position'));
        timeSlider.onDuration(model, model.get('duration'));
    }
}

