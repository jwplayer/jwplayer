import { loadFile } from 'controller/tracks-loader';
import { createId, createLabel } from 'controller/tracks-helper';
import Events from 'utils/backbone.events';
import { ERROR } from 'events/events';


/** Displays closed captions or subtitles on top of the video. **/
const Captions = function(_model) {

    // Reset and load external captions on playlist item
    _model.on('change:playlistItem', _itemHandler, this);

    // Listen for captions menu index changes from the view
    _model.on('change:captionsIndex', _captionsIndexHandler, this);

    // Listen for item ready to determine which provider is in use
    _model.on('itemReady', _itemReadyHandler, this);

    // Listen for provider subtitle tracks
    //   ignoring provider "subtitlesTrackChanged" since index should be managed here
    _model.mediaController.on('subtitlesTracks', _subtitlesTracksHandler, this);

    function _subtitlesTracksHandler(e) {
        if (!e.tracks.length) {
            return;
        }

        const tracks = e.tracks || [];
        for (let i = 0; i < tracks.length; i++) {
            _addTrack(tracks[i]);
        }

        // To avoid duplicate tracks in the menu when we reuse an _id, regenerate the tracks array
        _tracks = Object.keys(_tracksById).map(id => _tracksById[id]);

        const captionsMenu = _captionsMenu();
        _selectDefaultIndex();
        this.setCaptionsList(captionsMenu);
    }

    let _tracks = [];
    let _tracksById = {};
    let _unknownCount = 0;

    /** Listen to playlist item updates. **/
    function _itemHandler() {
        _tracks = [];
        _tracksById = {};
        _unknownCount = 0;
    }

    function _itemReadyHandler(item) {
        // Clean up in case we're replaying
        _itemHandler(_model, item);

        const tracks = item.tracks;
        const len = tracks && tracks.length;

        // Sideload tracks when not rendering natively
        if (!_model.get('renderCaptionsNatively') && len) {
            for (let i = 0; i < len; i++) {
                /* eslint-disable no-loop-func */
                const track = tracks[i];
                if (_kindSupported(track.kind) && !_tracksById[track._id]) {
                    _addTrack(track);
                    loadFile(track,
                        (vttCues) => {
                            _addVTTCuesToTrack(track, vttCues);
                        },
                        (error) => {
                            this.trigger(ERROR, {
                                message: 'Captions failed to load',
                                reason: error
                            });
                        });
                }
            }
        }

        const captionsMenu = _captionsMenu();
        _selectDefaultIndex();
        this.setCaptionsList(captionsMenu);
    }

    function _kindSupported(kind) {
        return kind === 'subtitles' || kind === 'captions';
    }

    function _addVTTCuesToTrack(track, vttCues) {
        track.data = vttCues;
    }

    function _captionsIndexHandler(model, captionsMenuIndex) {
        let track = null;
        if (captionsMenuIndex !== 0) {
            track = _tracks[captionsMenuIndex - 1];
        }
        model.set('captionsTrack', track);
    }

    function _addTrack(track) {
        track.data = track.data || [];
        track.name = track.label || track.name || track.language;
        track._id = createId(track, _tracks.length);

        if (!track.name) {
            const labelInfo = createLabel(track, _unknownCount);
            track.name = labelInfo.label;
            _unknownCount = labelInfo.unknownCount;
        }

        // During the same playlist we may reu and readd tracks with the same _id; allow the new track to replace the old
        _tracksById[track._id] = track;
        _tracks.push(track);
    }

    function _captionsMenu() {
        const list = [{
            id: 'off',
            label: 'Off'
        }];
        for (let i = 0; i < _tracks.length; i++) {
            list.push({
                id: _tracks[i]._id,
                label: _tracks[i].name || 'Unknown CC'
            });
        }
        return list;
    }

    function _selectDefaultIndex() {
        let captionsMenuIndex = 0;
        const label = _model.get('captionLabel');

        // Because there is no explicit track for "Off"
        //  it is the implied zeroth track
        if (label === 'Off') {
            _model.set('captionsIndex', 0);
            return;
        }

        for (let i = 0; i < _tracks.length; i++) {
            const track = _tracks[i];
            if (label && label === track.name) {
                captionsMenuIndex = i + 1;
                break;
            } else if (track.default || track.defaulttrack || track._id === 'default') {
                captionsMenuIndex = i + 1;
            } else if (track.autoselect) {
                // TODO: auto select track by comparing track.language to system lang
            }
        }
        // set the index without the side effect of storing the Off label in _selectCaptions
        _setCurrentIndex(captionsMenuIndex);
    }

    function _setCurrentIndex (index) {
        if (_tracks.length) {
            _model.setVideoSubtitleTrack(index, _tracks);
        } else {
            _model.set('captionsIndex', index);
        }
    }

    this.getCurrentIndex = function() {
        return _model.get('captionsIndex');
    };

    this.getCaptionsList = function() {
        return _model.get('captionsList');
    };

    this.setCaptionsList = function(captionsMenu) {
        _model.set('captionsList', captionsMenu);
    };

    this.destroy = function() {
        this.off(null, null, this);
    };
};

Object.assign(Captions.prototype, Events);

export default Captions;
