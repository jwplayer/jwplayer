define([
    'utils/helpers',
    'utils/underscore',
    'utils/backbone.events',
    'utils/constants',
    'utils/ui',
    'view/components/slider',
    'view/components/timeslider',
    'view/components/menu',
    'view/components/playlist',
    'view/components/volumetooltip',
    'view/components/drawer'
], function(utils, _, Events, Constants, UI, Slider, TimeSlider, Menu, Playlist, VolumeTooltip, Drawer) {

    function button(icon, apiAction) {
        var element = document.createElement('div');
        element.className = 'jw-icon jw-icon-inline jw-button-color jw-reset ' + icon;
        element.style.display = 'none';

        if (apiAction) {
            // Don't send the event to the handler so we don't have unexpected results. (e.g. play)
            new UI(element).on('click tap', function() { apiAction(); });
        }

        return {
            element : function() { return element; },
            toggle : function(m) {
                if (m) {
                    this.show();
                } else {
                    this.hide();
                }
            },
            show : function() { element.style.display = '';},
            hide : function() { element.style.display = 'none';}
        };
    }

    function text(name) {
        var element = document.createElement('span');
        element.className = 'jw-text jw-reset ' + name;
        return element;
    }

    function menu(name) {
        var createdMenu = new Menu(name);

        return createdMenu;
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
        this._compactModeMaxSize = 400;
        this._maxCompactWidth = -1;

        this.setup();
    }

    _.extend(Controlbar.prototype, Events, {

        setup : function() {
            this.build();
            this.initialize();
        },

        build : function() {
            var timeSlider = new TimeSlider(this._model, this._api),
                drawer = new Drawer('jw-icon-more'),
                playlistTooltip,
                volumeSlider,
                volumeTooltip,
                muteButton;

            // Create the playlistTooltip as long as visualplaylist from the config is not false
            if(this._model.get('visualplaylist') !== false) {
                playlistTooltip = new Playlist('jw-icon-playlist');
            }

            // Do not initialize volume sliders on mobile.
            if(!this._isMobile){
                muteButton = button('jw-icon-volume', this._api.setMute);
                volumeSlider = new Slider('jw-slider-volume', 'horizontal');
                volumeTooltip = new VolumeTooltip(this._model, 'jw-icon-volume');
            }

            this.elements = {
                alt: text('jw-text-alt'),
                play: button('jw-icon-playback', this._api.play.bind(this, {reason: 'interaction'})),
                prev: button('jw-icon-prev', this._api.playlistPrev.bind(this, {reason: 'interaction'})),
                next: button('jw-icon-next', this._api.playlistNext.bind(this, {reason: 'interaction'})),
                playlist : playlistTooltip,
                elapsed: text('jw-text-elapsed'),
                time: timeSlider,
                duration: text('jw-text-duration'),
                drawer: drawer,
                hd: menu('jw-icon-hd'),
                cc: menu('jw-icon-cc'),
                audiotracks: menu('jw-icon-audio-tracks'),
                mute: muteButton,
                volume: volumeSlider,
                volumetooltip: volumeTooltip,
                cast: button('jw-icon-cast jw-off', this._api.castToggle),
                fullscreen: button('jw-icon-fullscreen', this._api.setFullscreen)
            };

            this.layout = {
                left: [
                    this.elements.play,
                    this.elements.prev,
                    this.elements.playlist,
                    this.elements.next,
                    this.elements.elapsed
                ],
                center: [
                    this.elements.time,
                    this.elements.alt
                ],
                right: [
                    this.elements.duration,
                    this.elements.hd,
                    this.elements.cc,
                    this.elements.audiotracks,
                    this.elements.drawer,
                    this.elements.mute,
                    this.elements.cast,
                    this.elements.volume,
                    this.elements.volumetooltip,
                    // this.elements.cast, // hidden for jw7.0 release
                    this.elements.fullscreen
                ],
                drawer: [
                    this.elements.hd,
                    this.elements.cc,
                    this.elements.audiotracks
                ]
            };

            this.menus = _.compact([
                this.elements.playlist,
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
            this.layout.drawer = _.compact(this.layout.drawer);

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
            this.onPlaylist(this._model, this._model.get('playlist'));
            this.onPlaylistItem(this._model, this._model.get('playlistItem'));
            this.onMediaModel(this._model, this._model.get('mediaModel'));
            this.onCastAvailable(this._model, this._model.get('castAvailable'));
            this.onCastActive(this._model, this._model.get('castActive'));
            this.onCaptionsList(this._model, this._model.get('captionsList'));

            // Listen for model changes
            this._model.on('change:volume', this.onVolume, this);
            this._model.on('change:mute', this.onMute, this);
            this._model.on('change:playlist', this.onPlaylist, this);
            this._model.on('change:playlistItem', this.onPlaylistItem, this);
            this._model.on('change:mediaModel', this.onMediaModel, this);
            this._model.on('change:castAvailable', this.onCastAvailable, this);
            this._model.on('change:castActive', this.onCastActive, this);
            this._model.on('change:duration', this.onDuration, this);
            this._model.on('change:position', this.onElapsed, this);
            this._model.on('change:fullscreen', this.onFullscreen, this);
            this._model.on('change:captionsList', this.onCaptionsList, this);
            this._model.on('change:captionsIndex', this.onCaptionsIndex, this);
            this._model.on('change:compactUI', this.onCompactUI, this);

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

            if(this.elements.playlist) {
                this.elements.playlist.on('select', function (value) {
                    this._model.once('itemReady', function () {
                        this._api.play({reason: 'interaction'});
                    }, this);
                    this._api.load(value);
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
                if (utils.adaptiveType(this._model.get('duration')) === 'DVR') {
                    // Seek to "Live" position within live buffer, but not before current position
                    var currentPosition = this._model.get('position');
                    this._api.seek(Math.max(Constants.dvrSeekLimit, currentPosition));
                }
            }, this);

            // When the control bar is interacted with, trigger a user action event
            new UI(this.el).on('click tap drag', function(){ this.trigger('userAction'); }, this);

            this.elements.drawer.on('open-drawer close-drawer', function(evt, props){
                utils.toggleClass(this.el, 'jw-drawer-expanded', props.isOpen);
                if(!props.isOpen){
                    this.closeMenus();
                }
            }, this);

            _.each(this.menus, function(ele){
                ele.on('open-tooltip', this.closeMenus, this);
            }, this);
        },

        onCaptionsList: function(model, tracks) {
            var index = model.get('captionsIndex');
            this.elements.cc.setup(tracks, index, {isToggle: true});
            this.clearCompactMode();
        },
        onCaptionsIndex: function(model, index) {
            this.elements.cc.selectItem(index);
        },
        onPlaylist : function(model, playlist) {
            var display = (playlist.length > 1);
            this.elements.next.toggle(display);
            this.elements.prev.toggle(display);
            if(this.elements.playlist) {
                this.elements.playlist.setup(playlist, model.get('item'));
            }
        },
        onPlaylistItem : function(model/*, item*/) {
            this.elements.time.updateBuffer(0);
            this.elements.time.render(0);
            this.elements.duration.innerHTML = '00:00';
            this.elements.elapsed.innerHTML = '00:00';

            this.clearCompactMode();

            var itemIdx = model.get('item');
            if (this.elements.playlist) {
                this.elements.playlist.selectItem(itemIdx);
            }
            this.elements.audiotracks.setup();
        },

        onMediaModel : function(model, mediaModel) {
            mediaModel.on('change:levels', function(model, levels) {
                this.elements.hd.setup(levels, model.get('currentLevel'));
                this.clearCompactMode();
            }, this);
            mediaModel.on('change:currentLevel', function(model, level) {
                this.elements.hd.selectItem(level);
            }, this);
            mediaModel.on('change:audioTracks', function(model, audioTracks) {
                var list = _.map(audioTracks, function(track) { return { label : track.name }; });
                this.elements.audiotracks.setup(list, model.get('currentAudioTrack'), {toggle: false});
                this.clearCompactMode();
            }, this);
            mediaModel.on('change:currentAudioTrack', function(model, currentAudioTrack) {
                this.elements.audiotracks.selectItem(currentAudioTrack);
            }, this);
            mediaModel.on('change:state', function(model, state) {
                if(state === 'complete') {
                    this.elements.drawer.closeTooltip();
                    utils.removeClass(this.el, 'jw-drawer-expanded');
                }
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
        onCastAvailable : function(model, val) {
            this.elements.cast.toggle(val);
            this.clearCompactMode();
        },
        onCastActive : function(model, val) {
            utils.toggleClass(this.elements.cast.element(), 'jw-off', !val);
        },
        onElapsed : function(model, val) {
            var elapsedTime;
            var duration = model.get('duration');
            if (utils.adaptiveType(duration) === 'DVR') {
                elapsedTime = '-' + utils.timeFormat(-duration);
            } else {
                elapsedTime = utils.timeFormat(val);
            }
            this.elements.elapsed.innerHTML = elapsedTime;
        },
        onDuration : function(model, val) {
            var totalTime;
            if (utils.adaptiveType(val) === 'DVR') {
                totalTime = 'Live';
                this.clearCompactMode();
            } else {
                totalTime = utils.timeFormat(val);
            }
            this.elements.duration.innerHTML = totalTime;
        },
        onFullscreen : function(model, val) {
            utils.toggleClass(this.elements.fullscreen.element(), 'jw-off', val);
        },

        element: function() {
            return this.el;
        },

        getVisibleBounds : function (){
            var el = this.el,
                // getComputedStyle for modern browsers, currentStyle is for IE8
                curStyle = (getComputedStyle) ? getComputedStyle(el) : el.currentStyle,
                bounds;

            if(curStyle.display === 'table'){
                return utils.bounds(el);
            } else {
                el.style.visibility = 'hidden';
                el.style.display = 'table';
                bounds = utils.bounds(el);
                el.style.visibility = el.style.display = '';
                return bounds;
            }
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
        closeMenus : function(evt){
            _.each(this.menus, function(ele){
                if(!evt || evt.target !== ele.el) {
                    ele.closeTooltip(evt);
                }
            });
        },
        hideComponents : function(){
            this.closeMenus();
            this.elements.drawer.closeTooltip();
            utils.removeClass(this.el, 'jw-drawer-expanded');
        },
        clearCompactMode : function() {
            this._maxCompactWidth = -1;
            this._model.set('compactUI', false);
            if(this._containerWidth) {
                this.checkCompactMode(this._containerWidth);
            }
        },
        // Sets this._maxCompactWidth so we calculate less per call of isCompactMode
        setCompactModeBounds : function(){
            if(this.element().offsetWidth > 0 ){
                // Use the current center section content (timeslider or alt text) to determine compact mode
                var nonCenterExpandedSize = this.elements.left.offsetWidth + this.elements.right.offsetWidth;
                if(utils.adaptiveType(this._model.get('duration')) === 'LIVE'){
                    this._maxCompactWidth = nonCenterExpandedSize + this.elements.alt.offsetWidth;
                } else {
                    var containerRequiredSize = nonCenterExpandedSize +
                            (this.elements.center.offsetWidth - this.elements.time.el.offsetWidth),
                        timeSliderBreakpoint = 0.20;
                    this._maxCompactWidth = containerRequiredSize / (1-timeSliderBreakpoint);
                }

            }
        },
        checkCompactMode : function(containerWidth) {
            // If we cleared the _maxCompactWidth then try to reset it. This can fail if the controlbar is display: none
            if(this._maxCompactWidth === -1){
                this.setCompactModeBounds();
            }

            this._containerWidth = containerWidth;

            // If the _maxCompactWidth is set (which it may or may not be above)
            if(this._maxCompactWidth !== -1) {

                // If we're in compact mode and we have enough space to exit it, then do so
                if( containerWidth >= this._compactModeMaxSize && containerWidth > this._maxCompactWidth) {
                    this._model.set('compactUI', false);
                }
                // Enter if we're in a small player or our timeslider is too small.
                else if( containerWidth < this._compactModeMaxSize || containerWidth <= this._maxCompactWidth ){
                    this._model.set('compactUI', true);
                }
            }
        },
        onCompactUI : function(model, isCompact) {
            utils.removeClass(this.el, 'jw-drawer-expanded');

            this.elements.drawer.setup(this.layout.drawer, isCompact);

            // If we're not in compact mode or we're not hiding icons, then put them back where they came from.
            if(!isCompact || this.elements.drawer.activeContents.length < 2){
                _.each(this.layout.drawer,function(ele){
                    this.elements.right.insertBefore(ele.el, this.elements.drawer.el);
                }, this);
            }
        }
    });

    return Controlbar;
});