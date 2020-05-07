import { loadFile, cancelXhr } from 'controller/tracks-loader';
import { createId, createLabel } from 'controller/tracks-helper';
import { parseID3 } from 'providers/utils/id3Parser';
import { Browser } from 'environment/environment';
import { MEDIA_META_CUE_PARSED, MEDIA_META, WARNING } from 'events/events';
import { findWhere, each, filter } from 'utils/underscore';
import type { GenericObject, TextTrackLike, MetadataEvent } from 'types/generic.type';
import type { ProviderWithMixins } from './default';
import type { PlaylistItemTrack } from 'playlist/track';

type TrackCue = (VTTCue | DataCue | TextTrackCue) & {
    value?: any;
}

type TrackCueParsed = TrackCue & {
    _parsed?: boolean;
}

type TracksRecord = Record<string, TextTrackLike>;
type TrackCuesRecord = Record<string, TrackCue[]>;
type TrackCueRecord = Record<string, TrackCue>;
type LoadedTrackCuesRecord = Record<string, LoadedTrackCues>;
type CachedCuesRecord = Record<string, Record<string, number>>;

type LoadedTrackCues = {
    cues: TrackCue[];
    loaded: boolean;
}

type AddCueData = {
    type: 'captions' | 'metadata' | 'thumbnails' | 'chapters';
    cue: TrackCue;
    track?: string;
}

type FlashCuesData = {
    name: string;
    source?: 'mpegts';
    captions?: FlashCue[];
}

type FlashCue = {
    begin: number;
    end: number;
    text: string;
    trackid: string;
    useDTS?: boolean;
}

export type SimpleAudioTrack = {
    name: string;
    language: string;
}

// Used across all providers for loading tracks and handling browser track-related events
export interface TracksMixin {
    _itemTracks: GenericObject[] | null;
    _textTracks: TextTrackLike[] | null;
    _currentTextTrackIndex: number;
    _tracksById: TracksRecord | null;
    _cuesByTrackId: LoadedTrackCuesRecord | null;
    _cachedVTTCues: CachedCuesRecord | null;
    _metaCuesByTextTime: TrackCueRecord | null;
    _unknownCount: number;
    _activeCues: TrackCuesRecord | null;
    _cues: TrackCuesRecord | null;
    textTrackChangeHandler: ((this: TracksMixin) => void) | null;
    addTrackHandler: ((this: TracksMixin, e: TrackEvent) => void) | null;
    renderNatively: boolean;
    cueChangeHandler: ((this: ProviderWithMixins, e: Event) => void) | null;
    _initTextTracks: () => void;
    addTracksListener: (tracks: TextTrackList | AudioTrackList, eventType: keyof TextTrackListEventMap, handler: (e?: any) => any) => void;
    removeTracksListener: (tracks: TextTrackList | AudioTrackList, eventType: keyof TextTrackListEventMap, handler: ((e?: any) => any) | null) => void;
    clearTracks: () => void;
    clearMetaCues: () => void;
    clearCueData: (trackId: string) => void;
    disableTextTrack: () => void;
    enableTextTrack: () => void;
    getCurrentTextTrack: () => TextTrackLike | void;
    getSubtitlesTrack: () => number;
    addTextTracks: (tracksArray: PlaylistItemTrack[]) => TextTrackLike[];
    addTrackListeners: (tracks: TextTrackList) => void;
    setTextTracks: (tracks: TextTrackList | null) => void;
    setupSideloadedTracks: (itemTracks: PlaylistItemTrack[]) => void;
    setSubtitlesTrack: (menuIndex: number) => void;
    addCuesToTrack: (cueData: FlashCuesData) => void;
    addCaptionsCue: (cueData: FlashCue) => void;
    createCue: (start: number, end: number | undefined, content: string) => VTTCue | TextTrackCue;
    addVTTCue: (cueData: AddCueData, cacheKey?: string) => TrackCue | null;
    addVTTCuesToTrack: (track: TextTrackLike, vttCues: TrackCue[]) => void;
    parseNativeID3Cues: (cues: TextTrackCueList, previousCues: TrackCue[]) => void;
    triggerActiveCues: (currentActiveCues: TrackCue[], previousActiveCues: TrackCue[]) => void;
    ensureMetaTracksActive: () => void;
    _cacheVTTCue: (track: TextTrackLike, vttCue: TrackCue, cacheKey?: string) => boolean;
    _addTrackToList: (track: TextTrackLike) => void;
    _createTrack: (itemTrack: PlaylistItemTrack) => TextTrackLike;
    _clearSideloadedTextTracks(): void;
}

const Tracks: TracksMixin = {
    _itemTracks: null,
    _textTracks: null,
    _currentTextTrackIndex: -1,
    _tracksById: null,
    _cuesByTrackId: null,
    _cachedVTTCues: null,
    _metaCuesByTextTime: null,
    _unknownCount: 0,
    _activeCues: null,
    _cues: null,
    textTrackChangeHandler: null,
    addTrackHandler: null,
    cueChangeHandler: null,
    renderNatively: false,
    _initTextTracks(): void {
        this._textTracks = [];
        this._tracksById = {};
        this._metaCuesByTextTime = {};
        this._cuesByTrackId = {};
        this._cachedVTTCues = {};
        this._cues = {};
        this._activeCues = {};
        this._unknownCount = 0;
    },
    addTracksListener(this: ProviderWithMixins, tracks: TextTrackList | AudioTrackList, eventType: keyof TextTrackListEventMap, handler: (e?: any) => any): void {
        if (!tracks) {
            return;
        }
        // Always remove existing listener
        this.removeTracksListener(tracks, eventType, handler);

        if (this.instreamMode) {
            return;
        }

        if (tracks.addEventListener) {
            tracks.addEventListener(eventType, handler);
        } else {
            tracks['on' + eventType] = handler;
        }
    },
    removeTracksListener(tracks: TextTrackList | AudioTrackList, eventType: keyof TextTrackListEventMap, handler: ((e?: any) => any) | null): void {
        if (!tracks) {
            return;
        }
        if (tracks.removeEventListener && handler) {
            tracks.removeEventListener(eventType, handler);
        } else {
            tracks['on' + eventType] = null;
        }
    },
    clearTracks(this: ProviderWithMixins): void {
        cancelXhr(this._itemTracks);

        const { _tracksById } = this;
        if (_tracksById) {
            Object.keys(_tracksById).forEach(trackId => {
                if (trackId.indexOf('nativemetadata') === 0) {
                    const metadataTrack = _tracksById[trackId];
                    if (this.cueChangeHandler) {
                        metadataTrack.removeEventListener('cuechange', this.cueChangeHandler);
                    }
                    _removeCues(this.renderNatively, [metadataTrack], true);
                }
            });
        }
        this._itemTracks = null;
        this._textTracks = null;
        this._tracksById = null;
        this._cuesByTrackId = null;
        this._metaCuesByTextTime = null;
        this._unknownCount = 0;
        this._currentTextTrackIndex = -1;
        this._activeCues = {};
        this._cues = {};
        if (this.renderNatively) {
            const tracks = this.video.textTracks;
            if (this.textTrackChangeHandler) {
                // Removing listener first to ensure that removing cues does not trigger it unnecessarily
                this.removeTracksListener(tracks, 'change', this.textTrackChangeHandler);
            }
            _removeCues(this.renderNatively, tracks, true);
        }
    },
    clearMetaCues(): void {
        const { _tracksById, _cachedVTTCues } = this;
        if (_tracksById && _cachedVTTCues) {
            Object.keys(_tracksById).forEach(trackId => {
                if (trackId.indexOf('nativemetadata') === 0) {
                    const metadataTrack = _tracksById[trackId];
                    _removeCues(this.renderNatively, [metadataTrack], false);
                    metadataTrack.mode = 'hidden';
                    metadataTrack.inuse = true;
                    if (metadataTrack._id) {
                        _cachedVTTCues[metadataTrack._id] = {};
                    }
                }
            });
        }
    },
    clearCueData(trackId: string): void {
        // Clear track cues to prevent duplicates
        const _cachedVTTCues = this._cachedVTTCues;
        if (_cachedVTTCues && _cachedVTTCues[trackId]) {
            _cachedVTTCues[trackId] = {};
            if (this._tracksById) {
                this._tracksById[trackId].data = [];
            }
        }
    },
    disableTextTrack(): void {
        const track = this.getCurrentTextTrack();
        if (track) {
            // FF does not remove the active cue from the dom when the track is hidden, so we must disable it
            track.mode = 'disabled';
            const trackId = track._id;
            if (trackId && trackId.indexOf('nativecaptions') === 0) {
                track.mode = 'hidden';
            }
        }
    },
    enableTextTrack(): void {
        const track = this.getCurrentTextTrack();
        if (track) {
            track.mode = 'showing';
        }
    },
    getCurrentTextTrack(): TextTrackLike | void {
        if (this._textTracks) {
            return this._textTracks[this._currentTextTrackIndex];
        }
    },
    getSubtitlesTrack(): number {
        return this._currentTextTrackIndex;
    },
    addTextTracks(this: ProviderWithMixins, tracksArray: PlaylistItemTrack[]): TextTrackLike[] {
        const textTracks: TextTrackLike[] = [];
        if (!tracksArray) {
            return textTracks;
        }

        if (!this._textTracks) {
            this._initTextTracks();
        }

        tracksArray.forEach(itemTrack => {
            // only add valid and supported kinds https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
            if (itemTrack.kind && !_kindSupported(itemTrack.kind)) {
                return;
            }
            const textTrackAny = this._createTrack(itemTrack);
            this._addTrackToList(textTrackAny);
            textTracks.push(textTrackAny);
            if (itemTrack.file) {
                itemTrack.data = [];
                loadFile(itemTrack,
                    (vttCues) => {
                        textTrackAny.sideloaded = true;
                        this.addVTTCuesToTrack(textTrackAny, vttCues);
                    },
                    error => {
                        this.trigger(WARNING, error);
                    });
            }
        });

        if (this._textTracks && this._textTracks.length) {
            this.trigger('subtitlesTracks', { tracks: this._textTracks });
        }
        return textTracks;
    },
    setTextTracks(this: ProviderWithMixins, tracks: TextTrackList | null): void {
        this._currentTextTrackIndex = -1;
        if (!tracks) {
            return;
        }
        if (!this._textTracks) {
            this._initTextTracks();
        } else {
            const _tracksById = this._tracksById as TracksRecord;
            this._activeCues = {};
            this._cues = {};
            // Remove the 608 captions track that was mutated by the browser
            this._unknownCount = 0;
            this._textTracks = this._textTracks.filter((track) => {
                const trackId = track._id as string;
                if (this.renderNatively && trackId && trackId.indexOf('nativecaptions') === 0) {
                    delete _tracksById[trackId];
                    return false;
                } else if (track.name && track.name.indexOf('Unknown') === 0) {
                    this._unknownCount++;
                }
                if (trackId.indexOf('nativemetadata') === 0 && track.inBandMetadataTrackDispatchType === 'com.apple.streaming') {
                    // Remove the ID3 track from the cache
                    delete _tracksById[trackId];
                }
                return true;
            }, this);
        }

        // filter for 'subtitles' or 'captions' tracks
        if (tracks.length) {
            let i = 0;
            const len = tracks.length;
            const _tracksById = this._tracksById as TracksRecord;
            const _cuesByTrackId = this._cuesByTrackId as LoadedTrackCuesRecord;

            for (i; i < len; i++) {
                const track = tracks[i] as TextTrackLike;
                let trackId: string = track._id || '';
                if (!trackId) {
                    if (track.kind === 'captions' || track.kind === 'metadata') {
                        trackId = track._id = 'native' + track.kind + i;
                        if (!track.label && track.kind === 'captions') {
                            // track label is read only in Safari
                            // 'captions' tracks without a label need a name in order for the cc menu to work
                            const labelInfo = createLabel(track, this._unknownCount);
                            track.name = labelInfo.label;
                            this._unknownCount = labelInfo.unknownCount;
                        }
                    } else {
                        trackId = track._id = createId(track, this._textTracks ? this._textTracks.length : 0) as string;
                    }
                    if (_tracksById[trackId]) {
                        // tracks without unique ids must not be marked as "inuse"
                        continue;
                    }
                    track.inuse = true;
                }
                if (!track.inuse || _tracksById[trackId]) {
                    continue;
                }
                // setup TextTrack
                if (track.kind === 'metadata') {
                    // track mode needs to be "hidden", not "showing", so that cues don't display as captions in Firefox
                    track.mode = 'hidden';
                    const handler = this.cueChangeHandler = this.cueChangeHandler || cueChangeHandler.bind(this);
                    track.removeEventListener('cuechange', handler);
                    track.addEventListener('cuechange', handler);
                    _tracksById[trackId] = track;
                } else if (_kindSupported(track.kind)) {
                    const mode = track.mode;
                    let cue;

                    // By setting the track mode to 'hidden', we can determine if the track has cues
                    track.mode = 'hidden';

                    if (!track.cues.length && track.embedded) {
                        // There's no method to remove tracks added via: video.addTextTrack.
                        // This ensures the 608 captions track isn't added to the CC menu until it has cues
                        continue;
                    }

                    if (mode !== 'disabled' || trackId.indexOf('nativecaptions') !== 0) {
                        track.mode = mode;
                    }

                    // Parsed cues may not have been added to this track yet
                    if (_cuesByTrackId[trackId] && !_cuesByTrackId[trackId].loaded) {
                        const cues = _cuesByTrackId[trackId].cues;
                        while ((cue = cues.shift())) {
                            _addCueToTrack(this.renderNatively, track, cue);
                        }
                        track.mode = mode;
                        _cuesByTrackId[trackId].loaded = true;
                    }

                    this._addTrackToList(track);
                }
            }
        }

        if (this.renderNatively) {
            this.addTrackListeners(tracks as TextTrackList);
        }

        if (this._textTracks && this._textTracks.length) {
            this.trigger('subtitlesTracks', { tracks: this._textTracks });
        }
    },
    addTrackListeners(tracks: TextTrackList): void {
        // Only bind and set this.textTrackChangeHandler once so that removeEventListener works
        let handler = this.textTrackChangeHandler = this.textTrackChangeHandler || textTrackChangeHandler.bind(this);
        this.removeTracksListener(tracks, 'change', handler);
        this.addTracksListener(tracks, 'change', handler);

        if (Browser.edge || Browser.firefox) {
            // Listen for TextTracks added to the videotag after the onloadeddata event in Edge and Firefox,
            // NOT Safari! Handling this event in Safari 12 and lower results in captions not rendering after
            // instream or live restart (JW8-10815, JW8-11006)
            handler = this.addTrackHandler = this.addTrackHandler || addTrackHandler.bind(this);
            this.removeTracksListener(tracks, 'addtrack', handler);
            this.addTracksListener(tracks, 'addtrack', handler);
        }
    },
    setupSideloadedTracks(itemTracks: PlaylistItemTrack[]): void {
        // Add tracks if we're starting playback or resuming after a midroll
        if (!this.renderNatively) {
            return;
        }
        // Determine if the tracks are the same and the embedded + sideloaded count = # of tracks in the controlbar
        const alreadyLoaded = itemTracks === this._itemTracks;
        if (!alreadyLoaded) {
            cancelXhr(this._itemTracks);
        }

        this._itemTracks = itemTracks;

        if (!itemTracks) {
            return;
        }

        if (!alreadyLoaded) {
            this.disableTextTrack();
            this._clearSideloadedTextTracks();
            this.addTextTracks(itemTracks);
        }
    },
    setSubtitlesTrack(this: ProviderWithMixins, menuIndex: number): void {
        if (!this.renderNatively) {
            if (this.setCurrentSubtitleTrack) {
                this.setCurrentSubtitleTrack(menuIndex - 1);
            }
            return;
        }

        if (!this._textTracks) {
            return;
        }

        // 0 = 'Off'
        if (menuIndex === 0) {
            this._textTracks.forEach((track: TextTrackLike) => {
                track.mode = track.embedded ? 'hidden' : 'disabled';
            });
        }

        // Track index is 1 less than controlbar index to account for 'Off' = 0.
        // Prevent unnecessary track change events
        if (this._currentTextTrackIndex === menuIndex - 1) {
            return;
        }

        // Turn off current track
        this.disableTextTrack();

        // Set the provider's index to the model's index, then show the selected track if it exists
        this._currentTextTrackIndex = menuIndex - 1;

        const track = this.getCurrentTextTrack();
        if (track) {
            track.mode = 'showing';
        }

        // Update the model index since the track change may have come from a browser event
        this.trigger('subtitlesTrackChanged', {
            currentTrack: this._currentTextTrackIndex + 1,
            tracks: this._textTracks
        });
    },
    addCuesToTrack(cueData: FlashCuesData): void {
        // convert cues coming from the flash provider into VTTCues, then append them to track
        const track = (this._tracksById as TracksRecord)[cueData.name];
        if (!track || !this._metaCuesByTextTime) {
            return;
        }

        track.source = cueData.source;
        const cues = cueData.captions || [];
        const vttCues: TrackCue[] = [];
        let sort = false;

        for (let i = 0; i < cues.length; i++) {
            const cue = cues[i];
            const cueId = cueData.name + '_' + cue.begin + '_' + cue.end;
            if (!this._metaCuesByTextTime[cueId]) {
                const vttCue = this.createCue(cue.begin, cue.end, cue.text);
                this._metaCuesByTextTime[cueId] = vttCue;
                vttCues.push(vttCue);
                sort = true;
            }
        }
        if (sort) {
            vttCues.sort(function(a: any, b: any): number {
                return a.start - b.start;
            });
        }
        track.data = track.data || [];
        Array.prototype.push.apply(track.data, vttCues);
    },
    addCaptionsCue(this: ProviderWithMixins, cueData: FlashCuesData & FlashCue): void {
        if (!cueData.text || !cueData.begin || !cueData.end || !this._metaCuesByTextTime) {
            return;
        }
        const trackId = cueData.trackid.toString();
        let track: TextTrackLike | PlaylistItemTrack | null = this._tracksById && this._tracksById[trackId];
        if (!track) {
            track = {
                kind: 'captions',
                _id: trackId,
                data: [],
                'default': false
            };
            this.addTextTracks([track]);
            this.trigger('subtitlesTracks', { tracks: this._textTracks });
        }

        let cueId;

        if (cueData.useDTS) {
            // There may not be any 608 captions when the track is first created
            // Need to set the source so position is determined from metadata
            if (!track.source) {
                track.source = cueData.source || 'mpegts';
            }

        }
        cueId = cueData.begin + '_' + cueData.text;

        const existingCue = this._metaCuesByTextTime[cueId];
        if (!existingCue) {
            const vttCue = this.createCue(cueData.begin, cueData.end, cueData.text);
            this._metaCuesByTextTime[cueId] = vttCue;
            track.data = track.data || [];
            track.data.push(vttCue);
        }
    },
    createCue(start: number, end: number | undefined, content: string): VTTCue | TextTrackCue {
        const MetaCue = window.VTTCue || window.TextTrackCue;
        // Set a minimum duration for the cue
        // VTTCues must have a duration for "cuechange" to be dispatched
        const cueEnd = Math.max(end || 0, start + 0.25);
        return new MetaCue(start, cueEnd, content);
    },
    addVTTCue(this: ProviderWithMixins, cueData: AddCueData, cacheKey?: string): TrackCue | null {
        if (!this._tracksById) {
            this._initTextTracks();
        }

        const trackId = cueData.track ? cueData.track : 'native' + cueData.type;
        let track = (this._tracksById as TracksRecord)[trackId];
        const label = cueData.type === 'captions' ? 'Unknown CC' : 'ID3 Metadata';
        const vttCue = cueData.cue;

        if (!track) {
            const itemTrack: PlaylistItemTrack = {
                kind: cueData.type,
                _id: trackId,
                label: label,
                'default': false
            };
            if (this.renderNatively || itemTrack.kind === 'metadata') {
                track = this._createTrack(itemTrack);
                track.embedded = true;
                this.setTextTracks(this.video.textTracks);
            } else {
                track = this.addTextTracks([itemTrack])[0];
            }
        }
        if (this._cacheVTTCue(track, vttCue, cacheKey)) {
            const useTrackCueHelper = this.renderNatively || track.kind === 'metadata';
            if (useTrackCueHelper) {
                _addCueToTrack(useTrackCueHelper, track, vttCue);
            } else {
                track.data.push(vttCue);
            }
            return vttCue;
        }
        return null;
    },
    addVTTCuesToTrack(track: TextTrackLike, vttCues: TrackCue[]): void {
        if (!this.renderNatively) {
            return;
        }

        const trackId = track._id as string;
        const _tracksById = this._tracksById as TracksRecord;
        let _cuesByTrackId = this._cuesByTrackId as LoadedTrackCuesRecord;

        const textTrack = _tracksById[trackId];
        // the track may not be on the video tag yet
        if (!textTrack) {

            if (!_cuesByTrackId) {
                _cuesByTrackId = this._cuesByTrackId = {};
            }
            _cuesByTrackId[trackId] = { cues: vttCues, loaded: false };
            return;
        }
        // Cues already added
        if (_cuesByTrackId[trackId] && _cuesByTrackId[trackId].loaded) {
            return;
        }

        let cue;
        _cuesByTrackId[trackId] = { cues: vttCues, loaded: true };

        while ((cue = vttCues.shift())) {
            _addCueToTrack(this.renderNatively, textTrack, cue);
        }
    },
    parseNativeID3Cues(this: ProviderWithMixins, cues: TextTrackCueList, previousCues: TrackCue[]): void {
        const lastCue = cues[cues.length - 1] as TrackCueParsed;
        if (previousCues && previousCues.length === cues.length &&
            (lastCue._parsed || cuesMatch(previousCues[previousCues.length - 1], lastCue))) {
            return;
        }
        let dataCueSetIndex = -1;
        let startTime = -1;
        const dataCueSets: Array<TrackCueParsed[]> = Array.prototype.reduce.call(cues, (cueSets: Array<TrackCueParsed[]>, cue: TrackCueParsed) => {
            if (!cue._parsed && ((cue as DataCue).data || cue.value)) {
                if (cue.startTime !== startTime || cue.endTime === null) {
                    startTime = cue.startTime;
                    cueSets[++dataCueSetIndex] = [];
                }
                cueSets[dataCueSetIndex].push(cue);
            }
            cue._parsed = true;
            return cueSets;
        }, []);
        dataCueSets.forEach((dataCues: TrackCueParsed[]) => {
            const event = getId3CueMetaEvent(dataCues);
            this.trigger(MEDIA_META_CUE_PARSED, event);
        });
    },
    triggerActiveCues(this: ProviderWithMixins, currentActiveCues: TrackCue[], previousActiveCues: TrackCue[]): void {
        const dataCues = currentActiveCues.filter((cue) => {
            // Prevent duplicate meta events for cues that were active in the previous "cuechange" event
            if (previousActiveCues && previousActiveCues.some(prevCue => cuesMatch(cue, prevCue))) {
                return false;
            }
            if ((cue as DataCue).data || cue.value) {
                return true;
            }
            if (cue.text) {
                const event = getTextCueMetaEvent(cue);
                this.trigger(MEDIA_META, event);
            }
            return false;
        });
        if (dataCues.length) {
            const event = getId3CueMetaEvent(dataCues);
            this.trigger(MEDIA_META, event);
        }
    },
    ensureMetaTracksActive(this: ProviderWithMixins): void {
        // Safari sometimes disables metadata tracks after seeking. It does this without warning,
        // breaking API metadata event functionality.
        // Ensure metadata tracks are enabled in "hidden" mode.
        const tracks = this.video.textTracks;
        const len = tracks.length;
        for (let i = 0; i < len; i++) {
            const track = tracks[i];
            if (track.kind === 'metadata' && track.mode === 'disabled') {
                track.mode = 'hidden';
            }
        }
    },
    _cacheVTTCue(track: TextTrackLike, vttCue: TrackCue, cacheKey?: string): boolean {
        const trackKind = track.kind;
        const trackId = track._id as string;
        const _cachedVTTCues = this._cachedVTTCues as CachedCuesRecord;
        if (!_cachedVTTCues[trackId]) {
            _cachedVTTCues[trackId] = {};
        }
        const cachedCues = _cachedVTTCues[trackId];
        let cacheKeyTime;

        switch (trackKind) {
            case 'captions':
            case 'subtitles': {
                // VTTCues should have unique start and end times, even in cases where there are multiple
                // active cues. This is safer than ensuring text is unique, which may be violated on seek.
                // Captions within .05s of each other are treated as unique to account for
                // quality switches where start/end times are slightly different.
                cacheKeyTime = cacheKey || Math.floor(vttCue.startTime * 20);
                const cacheLine = '_' + ((vttCue as VTTCue).line || 'auto');
                const cacheValue = Math.floor(vttCue.endTime * 20);
                const cueExists = cachedCues[cacheKeyTime + cacheLine] || cachedCues[(cacheKeyTime + 1) + cacheLine] || cachedCues[(cacheKeyTime - 1) + cacheLine];

                if (cueExists && Math.abs(cueExists - cacheValue) <= 1) {
                    return false;
                }

                cachedCues[cacheKeyTime + cacheLine] = cacheValue;
                return true;
            }
            case 'metadata': {
                const text = (vttCue as DataCue).data ? new Uint8Array((vttCue as DataCue).data).join('') : vttCue.text;
                cacheKeyTime = cacheKey || vttCue.startTime + text;
                if (cachedCues[cacheKeyTime]) {
                    return false;
                }

                cachedCues[cacheKeyTime] = vttCue.endTime;
                return true;
            }
            default:
                return false;
        }
    },
    _addTrackToList(track: TextTrackLike): void {
        (this._textTracks as TextTrackLike[]).push(track);
        (this._tracksById as TracksRecord)[track._id as string] = track;
    },
    _createTrack(this: ProviderWithMixins, itemTrack: PlaylistItemTrack): TextTrackLike {
        let track;
        const labelInfo = createLabel(itemTrack, this._unknownCount);
        const label = labelInfo.label;
        this._unknownCount = labelInfo.unknownCount;

        if (this.renderNatively || itemTrack.kind === 'metadata') {
            const tracks = this.video.textTracks;
            // TextTrack label is read only, so we'll need to create a new track if we don't
            // already have one with the same label
            track = findWhere(tracks, { label: label });

            if (!track) {
                track = this.video.addTextTrack(itemTrack.kind as TextTrackKind, label, itemTrack.language || '');
            }

            track.default = itemTrack.default;
            track.mode = 'disabled';
            track.inuse = true;
        } else {
            track = itemTrack;
            track.data = track.data || [];
        }

        if (!track._id) {
            track._id = createId(itemTrack, this._textTracks ? this._textTracks.length : 0);
        }

        return track;
    },
    _clearSideloadedTextTracks(): void {
        // Clear VTT textTracks
        if (!this._textTracks) {
            return;
        }
        const nonSideloadedTracks = this._textTracks.filter((track) => {
            return track.embedded || track.groupid === 'subs';
        });
        this._initTextTracks();
        const _tracksById = this._tracksById as TracksRecord;
        nonSideloadedTracks.forEach((track) => {
            _tracksById[track._id as string] = track;
        });
        this._textTracks = nonSideloadedTracks;
    }
};

function textTrackChangeHandler(this: ProviderWithMixins): void {
    const textTracks = this.video.textTracks;
    const inUseTracks = filter(textTracks, function (track: TextTrackLike): boolean {
        return (track.inuse || !track._id) && _kindSupported(track.kind);
    });
    if (!this._textTracks || _tracksModified.call(this, inUseTracks)) {
        this.setTextTracks(textTracks);
        return;
    }
    // If a caption/subtitle track is showing, find its index
    let selectedTextTrackIndex = -1;
    for (let i = 0; i < this._textTracks.length; i++) {
        if (this._textTracks[i].mode === 'showing') {
            selectedTextTrackIndex = i;
            break;
        }
    }

    // Notifying the model when the index changes keeps the current index in sync in iOS Fullscreen mode
    if (selectedTextTrackIndex !== this._currentTextTrackIndex) {
        this.setSubtitlesTrack(selectedTextTrackIndex + 1);
    }
}

function _tracksModified(this: TracksMixin, inUseTracks: TextTrackLike[]): boolean {
    const _textTracks = this._textTracks as TextTrackLike[];
    const _tracksById = this._tracksById as TracksRecord;

    // Need to add new textTracks coming from the video tag
    if (inUseTracks.length > _textTracks.length) {
        return true;
    }

    // Tracks may have changed in Safari after an ad
    for (let i = 0; i < inUseTracks.length; i++) {
        const track = inUseTracks[i];
        if (!track._id || !_tracksById[track._id]) {
            return true;
        }
    }

    return false;
}

// Used in MS Edge to get tracks from the videotag as they're added
function addTrackHandler(this: ProviderWithMixins, e: TrackEvent): void {
    const track = e.track as TextTrackLike;
    if (track && track._id) {
        return;
    }
    this.setTextTracks(this.video.textTracks);
}

function cueChangeHandler(this: ProviderWithMixins, e: Event): void {
    const track = e.target as TextTrackLike;
    const { activeCues, cues } = track;
    const trackId = track._id as string;
    const _cues = this._cues as TrackCuesRecord;
    const _activeCues = this._activeCues as TrackCuesRecord;

    if (cues && cues.length) {
        const previousCues = _cues[trackId];
        _cues[trackId] = Array.prototype.slice.call(cues);
        this.parseNativeID3Cues(cues, previousCues);
    } else {
        delete _cues[trackId];
    }

    if (activeCues && activeCues.length) {
        const previousActiveCues = _activeCues[trackId];
        const currentActiveCues = _activeCues[trackId] = Array.prototype.slice.call(activeCues);
        this.triggerActiveCues(currentActiveCues, previousActiveCues);
    } else {
        delete _activeCues[trackId];
    }
}

// ////////////////////
// //// PRIVATE METHODS
// ////////////////////

function _addCueToTrack(renderNatively: boolean, track: TextTrackLike, vttCue: TrackCue): void {
    // IE/Edge will throw an exception if cues are not inserted in time order: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/13183203/
    if (Browser.ie) {
        let cue = vttCue;
        if (renderNatively || track.kind === 'metadata') {
            // There's no support for the VTTCue interface in IE/Edge.
            // We need to convert VTTCue to TextTrackCue before adding them to the TextTrack
            // This unfortunately removes positioning properties from the cues
            cue = new window.TextTrackCue(vttCue.startTime, vttCue.endTime, vttCue.text);
        }
        insertCueInOrder(track, cue);
    } else {
        try {
            track.addCue(vttCue);
        } catch (error) {
            console.error(error);
        }
    }
}

function insertCueInOrder(track: TextTrackLike, vttCue: TrackCue): void {
    const temp: TrackCue[] = [];
    // If the track mode is 'disabled', track.cues will be null; set it to hidden so that we can access.
    const mode = track.mode;
    track.mode = 'hidden';
    const cues = track.cues;
    for (let i = cues.length - 1; i >= 0; i--) {
        if (cues[i].startTime > vttCue.startTime) {
            temp.unshift(cues[i]);
            track.removeCue(cues[i]);
        } else {
            break;
        }
    }
    try {
        track.addCue(vttCue);
        temp.forEach(cue => track.addCue(cue));
    } catch (error) {
        console.error(error);
    }
    // Restore the original track state
    track.mode = mode;
}

function _removeCues(renderNatively: boolean, tracks: TextTrackList | TextTrack[], removeCustomAttributes: boolean): void {
    if (tracks && tracks.length) {
        each(tracks, function(track: TextTrackLike): void {
            const trackId = track._id || '';
            if (removeCustomAttributes) {
                track._id = undefined;
            }
            // Let IE, Edge and Safari handle cleanup of non-sideloaded text tracks for native rendering
            if ((Browser.ie || Browser.safari) && renderNatively && /^(native|subtitle|cc)/.test(trackId)) {
                return;
            }
            // Cues are inaccessible if the track is disabled. While hidden,
            // we can remove cues while the track is in a non-visible state
            // Set to disabled before hidden to ensure active cues disappear
            if (!Browser.ie || track.mode !== 'disabled') {
                // Avoid setting the track to disabled if it is already so. This prevents an exception when trying
                // to set the mode on Edge
                track.mode = 'disabled';
                track.mode = 'hidden';
            }
            for (let i = track.cues.length; i--;) {
                track.removeCue(track.cues[i]);
            }
            if (!track.embedded) {
                track.mode = 'disabled';
            }
            track.inuse = false;
        });
    }
}

function _kindSupported(kind: string): boolean {
    return kind === 'subtitles' || kind === 'captions';
}

function getTextCueMetaEvent(cue: TrackCue): MetadataEvent {
    let metadata;
    try {
        metadata = JSON.parse(cue.text);
    } catch (e) {
        metadata = {
            text: cue.text
        };
    }
    const event: MetadataEvent = {
        metadata
    };
    event.metadataTime = cue.startTime;
    if (metadata.programDateTime) {
        event.programDateTime = metadata.programDateTime;
    }
    if (metadata.metadataType) {
        event.metadataType = metadata.metadataType;
        delete metadata.metadataType;
    }
    return event;
}

function getId3CueMetaEvent(dataCues: TrackCueParsed[]): MetadataEvent {
    const metadata = parseID3(dataCues);
    const metadataTime = dataCues[0].startTime;
    return {
        metadataType: 'id3',
        metadataTime,
        metadata
    };
}

function cuesMatch(cue1: TrackCue, cue2: TrackCue): boolean {
    return cue1.startTime === cue2.startTime &&
        cue1.endTime === cue2.endTime &&
        cue1.text === cue2.text &&
        (cue1 as DataCue).data === (cue2 as DataCue).data &&
        JSON.stringify(cue1.value) === JSON.stringify(cue2.value);
}

export default Tracks;
