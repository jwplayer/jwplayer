define([
    'utils/helpers',
    'utils/underscore',
    'utils/backbone.events',
    'utils/constants',
    'utils/ui',
    'view/components/slider',
    'view/components/timeslider',
    'view/components/menu',
    'view/components/volumetooltip',
    'view/components/button',
    'utils/stream-time',
], function(utils, _, Events, Constants, UI, Slider, TimeSlider, Menu, VolumeTooltip, button, streamTimeUtils) {

    function text(name, role) {
        var element = document.createElement('span');
        element.className = 'jw-text jw-reset ' + name;
        if (role) {
            element.setAttribute('role', role);
        }
        return element;
    }

    function menu(name, ariaText) {
        return new Menu(name, ariaText);
    }

    function castButton(castToggle, localization) {
        if (!utils.isChrome() || utils.isIOS()) {
            return button('jw-icon-airplay jw-off', castToggle, localization.airplay);
        }

        var castButton = document.createElement('button', 'google-cast-button');
        var element = document.createElement('div');
        var ariaText = localization.cast;

        castButton.className = 'jw-button-color jw-icon-inline';
        element.className = 'jw-reset jw-icon-cast';
        element.style.display = 'none';
        element.style.cursor = 'pointer';
        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', '0');
        if (ariaText) {
            element.setAttribute('aria-label', ariaText);
        }
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
        return {reason: 'interaction'};
    }

    function buildGroup(group, elements) {
        var elem = document.createElement('div');
        elem.className = 'jw-group jw-controlbar-' + group+'-group jw-reset';

        _.each(elements, function(e) {
            if (e.element) {
                e = e.element();
            }
            elem.appendChild(e);
        });

        return elem;
    }

    function Controlbar(_api, _model) {
        this._api = _api;
        this._model = _model;
        this._isMobile = utils.isMobile();
        this._localization = this._model.get('localization');
        this.setup();
    }

    _.extend(Controlbar.prototype, Events, {

        setup : function() {
            this.build();
            this.initialize();
        },

        build : function() {
            var timeSlider = new TimeSlider(this._model, this._api),
                volumeSlider,
                volumeTooltip,
                muteButton;

            var play = this._localization.play;
            var next = this._localization.next;
            var vol = this._localization.volume;
            var rewind = this._localization.rewind;

            // Do not initialize volume slider or tooltip on mobile
            if (!this._isMobile) {
                volumeSlider = new Slider('jw-slider-volume', 'horizontal');//, vol);
                volumeTooltip = new VolumeTooltip(this._model, 'jw-icon-volume', vol);
            }
            // Do not show the volume toggle in the mobile SDKs or <iOS10
            if (!this._model.get('sdkplatform') && !(utils.isIOS(8) || utils.isIOS(9))) {
                muteButton = button('jw-icon-volume', this._api.setMute, vol);
            }

            this.elements = {
                alt: text('jw-text-alt', 'status'),
                play: button('jw-icon-playback', this._api.play.bind(this, reasonInteraction()), play),
                rewind: button('jw-icon-rewind', this.rewind.bind(this), rewind),
                next: button('jw-icon-next', null, next), // the click/tap event listener is in the nextup tooltip
                elapsed: text('jw-text-elapsed', 'timer'),
                countdown: text('jw-text-countdown', 'timer'),
                time: timeSlider,
                duration: text('jw-text-duration', 'timer'),
                durationLeft: text('jw-text-duration', 'timer'),
                hd: menu('jw-icon-hd', this._localization.hd),
                cc: menu('jw-icon-cc', this._localization.cc),
                audiotracks: menu('jw-icon-audio-tracks', this._localization.audioTracks),
                mute: muteButton,
                volume: volumeSlider,
                volumetooltip: volumeTooltip,
                cast: castButton(this._api.castToggle, this._localization),
                fullscreen: button('jw-icon-fullscreen', this._api.setFullscreen, this._localization.fullscreen)
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

        },

        initialize : function() {
            // Initial State
            this.elements.play.show();
            this.elements.fullscreen.show();
            if(this.elements.mute){
                this.elements.mute.show();
            }
            this.onVolume(this._model, this._model.get('volume'));
            this.onPlaylistItem();
            this.onMediaModel(this._model, this._model.get('mediaModel'));
            this.onCastAvailable(this._model, this._model.get('castAvailable'));
            this.onCastActive(this._model, this._model.get('castActive'));
            this.onCaptionsList(this._model, this._model.get('captionsList'));

            // Listen for model changes
            this._model.on('change:volume', this.onVolume, this);
            this._model.on('change:mute', this.onMute, this);
            this._model.on('change:playlistItem', this.onPlaylistItem, this);
            this._model.on('change:mediaModel', this.onMediaModel, this);
            this._model.on('change:castAvailable', this.onCastAvailable, this);
            this._model.on('change:castActive', this.onCastActive, this);
            this._model.on('change:duration', this.onDuration, this);
            this._model.on('change:durationLeft', this.onDuration, this);
            this._model.on('change:position', this.onElapsed, this);
            this._model.on('change:fullscreen', this.onFullscreen, this);
            this._model.on('change:captionsList', this.onCaptionsList, this);
            this._model.on('change:captionsIndex', this.onCaptionsIndex, this);
            this._model.on('change:streamType', this.onStreamTypeChange, this);

            // Event listeners

            // Volume sliders do not exist on mobile so don't assign listeners to them.
            if(this.elements.volume) {
                this.elements.volume.on('update', function (pct) {
                    var val = pct.percentage;
                    this._api.setVolume(val);
                }, this);
            }
            if(this.elements.volumetooltip) {
                this.elements.volumetooltip.on('update', function(pct) {
                    var val = pct.percentage;
                    this._api.setVolume(val);
                }, this);
                this.elements.volumetooltip.on('toggleValue', function(){
                    this._api.setMute();
                }, this);
            }

            if (this.elements.cast.button) {
                new UI(this.elements.cast.button).on('click tap', function () {
                    this._model.set('castClicked', true);
                }, this);
            }

            this.elements.hd.on('select', function(value){
                this._model.getVideo().setCurrentQuality(value);
            }, this);
            this.elements.hd.on('toggleValue', function(){
                this._model.getVideo().setCurrentQuality((this._model.getVideo().getCurrentQuality() === 0) ? 1 : 0);
            }, this);

            this.elements.cc.on('select', function(value) {
                this._api.setCurrentCaptions(value);
            }, this);
            this.elements.cc.on('toggleValue', function() {
                var index = this._model.get('captionsIndex');
                this._api.setCurrentCaptions(index ? 0 : 1);
            }, this);

            this.elements.audiotracks.on('select', function(value){
                this._model.getVideo().setCurrentAudioTrack(value);
            }, this);

            new UI(this.elements.duration).on('click tap', function(){
                if (this._model.get('streamType') === 'DVR') {
                    this._api.seek(this._model.get('seekableEnd'), reasonInteraction());
                }
            }, this);

            new UI(this.elements.durationLeft).on('click tap', function(){
                if (this._model.get('streamType') === 'DVR') {
                    this._api.seek(this._model.get('seekableEnd'), reasonInteraction());
                }
            }, this);

            // When the control bar is interacted with, trigger a user action event
            new UI(this.el).on('click tap drag', function(){ this.trigger('userAction'); }, this);

            _.each(this.menus, function(ele){
                ele.on('open-tooltip', this.closeMenus, this);
            }, this);
        },

        onCaptionsList: function(model, tracks) {
            var index = model.get('captionsIndex');
            this.elements.cc.setup(tracks, index, {isToggle: true});
        },
        onCaptionsIndex: function(model, index) {
            this.elements.cc.selectItem(index);
        },
        onPlaylistItem : function() {
            this.elements.time.updateBuffer(0);
            this.elements.time.render(0);
            this.elements.duration.innerHTML = '00:00';
            this.elements.durationLeft.innerHTML = '00:00';
            this.elements.elapsed.innerHTML = '00:00';
            this.elements.countdown.innerHTML = '00:00';

            this.elements.audiotracks.setup();
        },

        onMediaModel : function(model, mediaModel) {
            mediaModel.on('change:levels', function(model, levels) {
                this.elements.hd.setup(levels, model.get('currentLevel'));
            }, this);
            mediaModel.on('change:currentLevel', function(model, level) {
                this.elements.hd.selectItem(level);
            }, this);
            mediaModel.on('change:audioTracks', function(model, audioTracks) {
                var list = _.map(audioTracks, function(track) { return { label : track.name }; });
                this.elements.audiotracks.setup(list, model.get('currentAudioTrack'), {toggle: false});
            }, this);
            mediaModel.on('change:currentAudioTrack', function(model, currentAudioTrack) {
                this.elements.audiotracks.selectItem(currentAudioTrack);
            }, this);
        },
        onVolume : function(model, pct) {
            this.renderVolume(model.get('mute'), pct);
        },
        onMute : function(model, muted) {
            this.renderVolume(muted, model.get('volume'));
        },
        renderVolume : function(muted, vol) {
            // mute, volume, and volumetooltip do not exist on mobile devices.
            if(this.elements.mute) {
                utils.toggleClass(this.elements.mute.element(), 'jw-off', muted);
            }
            if(this.elements.volume) {
                this.elements.volume.render(muted ? 0 : vol);
            }
            if(this.elements.volumetooltip){
                this.elements.volumetooltip.volumeSlider.render(muted ? 0 : vol);
                utils.toggleClass(this.elements.volumetooltip.element(), 'jw-off', muted);
            }
        },
        onCastAvailable: function(model, val) {
            this.elements.cast.toggle(val);
        },
        onCastActive: function(model, val) {
            this.elements.fullscreen.toggle(!val);
            if (this.elements.cast.button) {
                utils.toggleClass(this.elements.cast.button, 'jw-off', !val);
            }
        },
        onElapsed: function(model, val) {
            var elapsedTime,
                countdownTime;
            if (model.get('streamType') === 'DVR') {
                elapsedTime = countdownTime = '-' + utils.timeFormat(model.get('seekableRange'), true);
            } else {
                elapsedTime = utils.timeFormat(val);
                countdownTime = utils.timeFormat(model.get('duration') - val);
            }
            this.elements.elapsed.innerHTML = elapsedTime;
            this.elements.countdown.innerHTML = countdownTime;
        },
        onDuration : function(model, val) {
            var totalTime;
            if (model.get('streamType') === 'DVR') {
                totalTime = 'Live';
            } else {
                totalTime = utils.timeFormat(val);
            }
            this.elements.duration.innerHTML = totalTime;
            this.elements.durationLeft.innerHTML = totalTime;
        },
        onFullscreen : function(model, val) {
            utils.toggleClass(this.elements.fullscreen.element(), 'jw-off', val);
        },

        element: function() {
            return this.el;
        },
        setAltText : function(altText) {
            this.elements.alt.innerHTML = altText;
        },
        addCues : function(cues) {
            if (this.elements.time) {
                _.each(cues, function(ele){
                    this.elements.time.addCue(ele);
                }, this);
                this.elements.time.drawCues();
            }
        },
        // Close menus if it has no event.  Otherwise close all but the event's target.
        closeMenus : function(evt) {
            _.each(this.menus, function(ele){
                if(!evt || evt.target !== ele.el) {
                    ele.closeTooltip(evt);
                }
            });
        },
        hideComponents : function() {
            this.closeMenus();
        },
        rewind : function() {
            var seekPos = Math.max(this._model.get('position') - 10, this._model.get('seekableStart'));
            this._api.seek(seekPos, reasonInteraction());
        },
        onStreamTypeChange : function(model) {
            // Hide rewind button when in LIVE mode
            var streamType = model.get('streamType');
            this.elements.rewind.toggle(streamType !== 'LIVE');
            if (streamType === 'DVR') {
                this.elements.duration.innerHTML = 'Live';
                this.elements.durationLeft.innerHTML = 'Live';
            }
        }
    });

    return Controlbar;
});
