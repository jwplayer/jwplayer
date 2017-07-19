import { PLAYBACK_RATE_ICON } from 'assets/svg-markup';

define([
    'utils/helpers',
    'utils/underscore',
    'utils/backbone.events',
    'utils/constants',
    'utils/ui',
    'utils/aria',
    'view/controls/components/slider',
    'view/controls/components/timeslider',
    'view/controls/components/menu',
    'view/controls/components/selection-display-menu',
    'view/controls/components/volumetooltip',
    'view/controls/components/button',
], function(utils, _, Events, Constants, UI, ariaLabel, Slider, TimeSlider, Menu, SelectionDisplayMenu, VolumeTooltip,
            button) {
    function text(name, role) {
        const element = document.createElement('span');
        element.className = 'jw-text jw-reset ' + name;
        if (role) {
            element.setAttribute('role', role);
        }
        return element;
    }

    function menu(name, ariaText) {
        return new Menu(name, ariaText);
    }

    function createCastButton(castToggle, localization) {
        if (!utils.isChrome() || utils.isIOS()) {
            return button('jw-icon-airplay jw-off', castToggle, localization.airplay);
        }

        const ariaText = localization.cast;

        const castButton = document.createElement('button', 'google-cast-button');
        castButton.className = 'jw-button-color jw-icon-inline';
        ariaLabel(castButton, ariaText);

        const element = document.createElement('div');
        element.className = 'jw-reset jw-icon-cast';
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

    function buildGroup(group, elements) {
        const elem = document.createElement('div');
        elem.className = 'jw-group jw-controlbar-' + group + '-group jw-reset';

        _.each(elements, function(e) {
            if (e.element) {
                e = e.element();
            }
            elem.appendChild(e);
        });

        return elem;
    }

    return class Controlbar {
        constructor(_api, _model) {
            _.extend(this, Events);
            this._api = _api;
            this._model = _model;
            this._isMobile = utils.isMobile();
            this._localization = _model.get('localization');

            this.nextUpToolTip = null;

            const timeSlider = new TimeSlider(_model, _api);
            let volumeSlider;
            let volumeTooltip;
            let muteButton;

            const play = this._localization.play;
            const next = this._localization.next;
            const vol = this._localization.volume;
            const rewind = this._localization.rewind;

            // Do not initialize volume slider or tooltip on mobile
            if (!this._isMobile) {
                volumeSlider = new Slider('jw-slider-volume', 'horizontal');// , vol);
                volumeSlider.setup();
                volumeTooltip = new VolumeTooltip(_model, 'jw-icon-volume', vol);
            }
            // Do not show the volume toggle in the mobile SDKs or <iOS10
            if (!_model.get('sdkplatform') && !(utils.isIOS(8) || utils.isIOS(9))) {
                muteButton = button('jw-icon-volume', _api.setMute, vol);
            }

            const nextButton = button('jw-icon-next', _api.next.bind(this), next);

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

            this.elements = {
                alt: text('jw-text-alt', 'status'),
                play: button('jw-icon-playback', _api.play.bind(this, reasonInteraction()), play),
                rewind: button('jw-icon-rewind', this.rewind.bind(this), rewind),
                next: nextButton,
                elapsed: text('jw-text-elapsed', 'timer'),
                countdown: text('jw-text-countdown', 'timer'),
                time: timeSlider,
                duration: text('jw-text-duration', 'timer'),
                durationLeft: text('jw-text-duration', 'timer'),
                hd: menu('jw-icon-hd', this._localization.hd),
                cc: menu('jw-icon-cc', this._localization.cc),
                audiotracks: menu('jw-icon-audio-tracks', this._localization.audioTracks),
                playbackrates: new SelectionDisplayMenu(
                    'jw-icon-playback-rate',
                    this._localization.playbackRates,
                    PLAYBACK_RATE_ICON
                ),
                mute: muteButton,
                volume: volumeSlider,
                volumetooltip: volumeTooltip,
                cast: createCastButton(_api.castToggle, this._localization),
                fullscreen: button('jw-icon-fullscreen', _api.setFullscreen, this._localization.fullscreen)
            };

            this.layout = {
                left: [
                    this.elements.play,
                    this.elements.rewind,
                    this.elements.elapsed,
                    this.elements.durationLeft,
                    this.elements.countdown
                ],
                center: [
                    this.elements.time,
                    this.elements.alt
                ],
                right: [
                    this.elements.duration,
                    this.elements.next,
                    this.elements.hd,
                    this.elements.cc,
                    this.elements.audiotracks,
                    this.elements.playbackrates,
                    this.elements.mute,
                    this.elements.cast,
                    this.elements.volume,
                    this.elements.volumetooltip,
                    this.elements.fullscreen
                ]
            };

            this.menus = _.compact([
                this.elements.hd,
                this.elements.cc,
                this.elements.audiotracks,
                this.elements.playbackrates,
                this.elements.volumetooltip
            ]);

            // Remove undefined layout elements.  They are invalid for the current platform.
            // (e.g. volume and volumetooltip on mobile)
            this.layout.left = _.compact(this.layout.left);
            this.layout.center = _.compact(this.layout.center);
            this.layout.right = _.compact(this.layout.right);

            this.el = document.createElement('div');
            this.el.className = 'jw-controlbar jw-background-color jw-reset';

            this.elements.left = buildGroup('left', this.layout.left);
            this.elements.center = buildGroup('center', this.layout.center);
            this.elements.right = buildGroup('right', this.layout.right);

            this.el.appendChild(this.elements.left);
            this.el.appendChild(this.elements.center);
            this.el.appendChild(this.elements.right);

            // Initial State
            this.elements.play.show();
            this.elements.fullscreen.show();
            if (this.elements.mute) {
                this.elements.mute.show();
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

            // Event listeners

            // Volume sliders do not exist on mobile so don't assign listeners to them.
            if (this.elements.volume) {
                this.elements.volume.on('update', function (pct) {
                    var val = pct.percentage;
                    this._api.setVolume(val);
                }, this);
            }
            if (this.elements.volumetooltip) {
                this.elements.volumetooltip.on('update', function(pct) {
                    const val = pct.percentage;
                    this._api.setVolume(val);
                }, this);
                this.elements.volumetooltip.on('toggleValue', function() {
                    this._api.setMute();
                }, this);
            }

            if (this.elements.cast.button) {
                new UI(this.elements.cast.button).on('click tap', function () {
                    this._model.set('castClicked', true);
                }, this);
            }

            this.elements.hd.on('select', function(value) {
                this._model.getVideo().setCurrentQuality(value);
            }, this);
            this.elements.hd.on('toggleValue', function() {
                this._model.getVideo().setCurrentQuality((this._model.getVideo().getCurrentQuality() === 0) ? 1 : 0);
            }, this);

            this.elements.cc.on('select', function(value) {
                this._api.setCurrentCaptions(value);
            }, this);
            this.elements.cc.on('toggleValue', function() {
                const index = this._model.get('captionsIndex');
                this._api.setCurrentCaptions(index ? 0 : 1);
            }, this);

            this.elements.audiotracks.on('select', function(value) {
                this._model.getVideo().setCurrentAudioTrack(value);
            }, this);

            let playbackRateControls = _model.get('playbackRateControls');
            if (playbackRateControls) {
                let selectedIndex = playbackRateControls.indexOf(this._model.get('playbackRate'));
                let playbackRateLabels = playbackRateControls.map((playbackRate) => {
                    return {
                        label: playbackRate + 'x',
                        rate: playbackRate
                    };
                });

                this.elements.playbackrates.setup(
                    playbackRateLabels,
                    selectedIndex,
                    { defaultIndex: playbackRateControls.indexOf(1), isToggle: false }
                );

                _model.change('streamType provider', this.togglePlaybackRateControls, this);
                _model.change('playbackRate', this.onPlaybackRate, this);

                this.elements.playbackrates.on('select', function (index) {
                    this._model.setPlaybackRate(playbackRateControls[index]);
                }, this);

                this.elements.playbackrates.on('toggleValue', function () {
                    const index = playbackRateControls.indexOf(this._model.get('playbackRate'));
                    this._model.setPlaybackRate(playbackRateControls[index ? 0 : 1]);
                }, this);
            }

            new UI(this.elements.duration).on('click tap', function() {
                if (this._model.get('streamType') === 'DVR') {
                    // Seek to "Live" position within live buffer, but not before current position
                    const currentPosition = this._model.get('position');
                    this._api.seek(Math.max(Constants.dvrSeekLimit, currentPosition), reasonInteraction());
                }
            }, this);

            new UI(this.elements.durationLeft).on('click tap', function() {
                if (this._model.get('streamType') === 'DVR') {
                    // Seek to "Live" position within live buffer, but not before current position
                    const currentPosition = this._model.get('position');
                    this._api.seek(Math.max(Constants.dvrSeekLimit, currentPosition));
                }
            }, this);

            // When the control bar is interacted with, trigger a user action event
            new UI(this.el).on('click tap drag', function() {
                this.trigger('userAction');
            }, this);

            _.each(this.menus, function(ele) {
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
                model.get('playbackRateControls').length > 1;

            utils.toggleClass(this.elements.playbackrates.el, 'jw-hidden', !showPlaybackRateControls);
        }

        onPlaybackRate(model, value) {
            this.elements.playbackrates.selectItem(model.get('playbackRateControls').indexOf(value));
        }

        onPlaylistItem() {
            this.elements.audiotracks.setup();
        }

        onMediaModel(model, mediaModel) {
            mediaModel.on('change:levels', function(levelsChangeModel, levels) {
                this.elements.hd.setup(levels, levelsChangeModel.get('currentLevel'));
            }, this);
            mediaModel.on('change:currentLevel', function(currentLevelChangeModel, level) {
                this.elements.hd.selectItem(level);
            }, this);
            mediaModel.on('change:audioTracks', function(audioTracksChangeModel, audioTracks) {
                const list = _.map(audioTracks, function(track) {
                    return { label: track.name };
                });
                this.elements.audiotracks.setup(list, audioTracksChangeModel.get('currentAudioTrack'),
                    { isToggle: false });
            }, this);
            mediaModel.on('change:currentAudioTrack', function(currentAudioTrackChangeModel, currentAudioTrack) {
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
            this.elements.durationLeft.textContent = totalTime;
        }

        onFullscreen(model, val) {
            utils.toggleClass(this.elements.fullscreen.element(), 'jw-off', val);
        }

        element() {
            return this.el;
        }

        setAltText(model, altText) {
            this.elements.alt.textContent = altText;
        }

        addCues(model, cues) {
            if (this.elements.time) {
                _.each(cues, function(ele) {
                    this.elements.time.addCue(ele);
                }, this);
                this.elements.time.drawCues();
            }
        }

        // Close menus if it has no event.  Otherwise close all but the event's target.
        closeMenus(evt) {
            _.each(this.menus, function(ele) {
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
            if (streamType === 'DVR') {
                this.elements.duration.textContent = 'Live';
                this.elements.durationLeft.textContent = 'Live';
            }
            const duration = model.get('duration');
            this.onDuration(model, duration);
        }

        onNextUp(model, nextUp) {
            this.elements.next.toggle(!!nextUp);
        }
    };
});
