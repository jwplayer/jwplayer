import { OS } from 'environment/environment';
import SimpleModel from 'model/simplemodel';
import { INITIAL_PLAYER_STATE, INITIAL_MEDIA_STATE, DEFAULT_MIN_DVR_WINDOW, DEFAULT_DVR_SEEK_LIMIT } from 'model/player-model';
import { InternalPlayerState, STATE_IDLE } from 'events/events';
import { isValidNumber, isNumber } from 'utils/underscore';
import { seconds } from 'utils/strings';
import Providers from 'providers/providers';
import type { StreamType } from 'providers/utils/stream-type';
import type { GenericObject, TextTrackLike, Localization } from 'types/generic.type';
import type { QualityLevel } from 'providers/data-normalizer';
import type PlaylistItem from 'playlist/item';
import type { ImplementedProvider, SeekRange } from 'providers/default';
import type { SimpleAudioTrack } from 'providers/tracks-mixin';
import type { Cue } from 'view/controls/components/chapters.mixin';

type AutoStart = boolean | 'viewable';
export type PauseReason = 'external' | 'interaction' | 'viewable';
export type PlayReason = 'autostart' | 'external' | 'interaction' | 'playlist' | 'related-auto' | 'related-interaction';
export type FloatConfig = {
    dismissable?: boolean;
    mode?: string;
};

export type PlayerModelAttributes = {
    _abZoomThumbnail?: boolean;
    __ab_truncated?: boolean;
    _destroyed: boolean;
    advertising: GenericObject;
    aspectratio: string | null;
    audioMode: boolean;
    autostart: AutoStart;
    autostartMuted: boolean;
    bandwidthEstimate: number;
    bitrateSelection: number | null;
    captionLabel: string;
    captionsIndex: number;
    captionsTrack: TextTrackLike;
    containerHeight: number;
    containerWidth: number;
    controlsEnabled: boolean;
    cues: Cue[];
    defaultPlaybackRate: number;
    displaytitle: string;
    displaydescription: string;
    dvrSeekLimit: number;
    displayPlaybackLabel: boolean;
    enableShortcuts: boolean;
    flashBlocked: boolean;
    flashThrottle?: boolean;
    floating?: FloatConfig;
    fullscreen: boolean;
    height: number | string;
    id: string;
    inDom: boolean;
    instreamMode: boolean;
    isFloating?: boolean;
    item: number;
    itemMeta: GenericObject;
    itemReady: boolean;
    localization: Localization;
    logo?: {
        file: string;
        hide?: boolean;
        link?: string;
        margin?: number;
        position?: string;
    };
    logoWidth: number;
    mediaModel: MediaModel;
    minDvrWindow: number;
    mute: boolean;
    nextUp: PlaylistItem;
    nextUpDisplay: boolean;
    pauseReason: PauseReason;
    playbackRate: number;
    playlist: PlaylistItem[];
    playlistItem: PlaylistItem | null;
    playOnViewable: boolean;
    playReason: PlayReason;
    playRejected: boolean;
    provider?: {
        name: string;
    };
    qualityLabel: string;
    renderCaptionsNatively: boolean;
    scrubbing: boolean;
    sharing: GenericObject;
    skipButton: boolean;
    state: InternalPlayerState;
    streamType: StreamType;
    supportsPlaybackRate: boolean;
    viewable?: number;
    volume: number;
    width: number | string;
}

interface Model {
    readonly attributes: Partial<PlayerModelAttributes>;
    addAttributes(attributes: Partial<PlayerModelAttributes>): void;
    get<K extends keyof PlayerModelAttributes>(attr: K): PlayerModelAttributes[K];
    set<K extends keyof PlayerModelAttributes>(attr: K, val: PlayerModelAttributes[K]): void;
}

// Represents the state of the player
class Model extends SimpleModel {
    private _provider: ImplementedProvider | null;
    private providerController: Providers | null;

    // These properties are assigned as attribute getters
    public mediaModel!: MediaModel;

    constructor() {
        super();
        this.providerController = null;
        this._provider = null;
        this.addAttributes({
            mediaModel: new MediaModel(),
            minDvrWindow: DEFAULT_MIN_DVR_WINDOW,
            dvrSeekLimit: DEFAULT_DVR_SEEK_LIMIT
        });
    }

    setup(config?: GenericObject): Model {
        config = config || {};
        this._normalizeConfig(config);
        Object.assign(this.attributes, config, INITIAL_PLAYER_STATE);
        this.providerController = new Providers(this.getConfiguration());
        this.setAutoStart();
        return this;
    }

    getConfiguration(): GenericObject {
        const config = this.clone();
        const mediaModelAttributes = config.mediaModel.attributes;
        Object.keys(INITIAL_MEDIA_STATE).forEach(key => {
            config[key] = mediaModelAttributes[key];
        });
        config.instreamMode = !!config.instream;
        delete config.instream;
        delete config.mediaModel;
        return config;
    }

    persistQualityLevel(quality: number, levels: Array<QualityLevel>): void {
        const currentLevel = levels[quality] || {};
        const { label } = currentLevel;
        // Default to null if bitrate is bad, or when the quality to persist is "auto" (bitrate is undefined in this case)
        const bitrate = isValidNumber(currentLevel.bitrate) ? currentLevel.bitrate : null;
        this.set('bitrateSelection', bitrate);
        this.set('qualityLabel', label);
    }

    setActiveItem(index: number): void {
        const item = this.get('playlist')[index];
        this.resetItem(item);
        (this.attributes as PlayerModelAttributes).playlistItem = null;
        this.set('item', index);
        this.set('minDvrWindow', item.minDvrWindow);
        this.set('dvrSeekLimit', item.dvrSeekLimit || DEFAULT_DVR_SEEK_LIMIT);
        this.set('playlistItem', item);
    }

    setMediaModel(mediaModel?: MediaModel): void {
        if (this.mediaModel && this.mediaModel !== mediaModel) {
            this.mediaModel.off();
        }

        mediaModel = mediaModel || new MediaModel();
        this.mediaModel = mediaModel;
        syncPlayerWithMediaModel(mediaModel);
    }

    destroy(): void {
        (this.attributes as PlayerModelAttributes)._destroyed = true;
        this.off();
        if (this._provider) {
            this._provider.off(null, null, this);
            this._provider.destroy();
        }
    }

    getVideo(): ImplementedProvider | null {
        return this._provider;
    }

    setFullscreen(state: boolean): void {
        state = !!state;
        if (state !== this.get('fullscreen')) {
            this.set('fullscreen', state);
        }
    }

    getProviders(): Providers | null {
        return this.providerController;
    }

    setVolume(volume?: number): void {
        if (!isValidNumber(volume)) {
            return;
        }
        const vol = Math.min(Math.max(0, volume), 100);
        this.set('volume', vol);
        const mute = (vol === 0);
        if (mute !== (this.getMute())) {
            this.setMute(mute);
        }
    }

    getMute(): boolean {
        return this.get('autostartMuted') || this.get('mute');
    }

    setMute(mute: boolean): void {
        if (mute === undefined) {
            mute = !(this.getMute());
        }
        this.set('mute', !!mute);
        if (!mute) {
            const volume = Math.max(10, this.get('volume'));
            this.set('autostartMuted', false);
            this.setVolume(volume);
        }
    }

    setStreamType(streamType: StreamType): void {
        this.set('streamType', streamType);
        if (streamType === 'LIVE') {
            this.setPlaybackRate(1);
        }
    }

    setProvider(provider: ImplementedProvider): void {
        this._provider = provider;
        syncProviderProperties(this, provider);
    }

    resetProvider(): void {
        this._provider = null;
        this.set('provider', undefined);
    }

    setPlaybackRate(playbackRate?: number): void {
        if (!isNumber(playbackRate)) {
            return;
        }

        // Clamp the rate between 0.25x and 4x
        playbackRate = Math.max(Math.min(playbackRate, 4), 0.25);

        if (this.get('streamType') === 'LIVE') {
            playbackRate = 1;
        }

        this.set('defaultPlaybackRate', playbackRate);

        if (this._provider && this._provider.setPlaybackRate) {
            this._provider.setPlaybackRate(playbackRate);
        }
    }

    persistCaptionsTrack(): void {
        const track = this.get('captionsTrack');

        if (track) {
            // update preference if an option was selected
            this.set('captionLabel', track.name);
        } else {
            this.set('captionLabel', 'Off');
        }
    }


    setVideoSubtitleTrack(trackIndex: number, tracks: Array<TextTrackLike>): void {
        this.set('captionsIndex', trackIndex);
        /*
         * Tracks could have changed even if the index hasn't.
         * Need to ensure track has data for captionsrenderer.
         */
        if (trackIndex && tracks && trackIndex <= tracks.length && tracks[trackIndex - 1].data) {
            this.set('captionsTrack', tracks[trackIndex - 1]);
        }
    }

    persistVideoSubtitleTrack(trackIndex: number, tracks: Array<TextTrackLike>): void {
        this.setVideoSubtitleTrack(trackIndex, tracks);
        this.persistCaptionsTrack();
    }

    // Mobile players always wait to become viewable.
    // Desktop players must have autostart set to viewable
    setAutoStart(autoStart?: AutoStart): void {
        if (autoStart !== undefined) {
            this.set('autostart', autoStart);
        }

        const autoStartOnMobile = !!(OS.mobile && this.get('autostart'));
        this.set('playOnViewable', autoStartOnMobile || this.get('autostart') === 'viewable');
    }

    resetItem(item: PlaylistItem): void {
        const position = item ? seconds(item.starttime) : 0;
        const duration = item ? seconds(item.duration) : 0;
        const mediaModel = this.mediaModel;
        this.set('playRejected', false);
        (this.attributes as PlayerModelAttributes).itemMeta = {};
        mediaModel.set('position', position);
        mediaModel.set('currentTime', 0);
        mediaModel.set('duration', duration);
    }

    persistBandwidthEstimate(bwEstimate?: number): void {
        if (!isValidNumber(bwEstimate)) {
            return;
        }
        this.set('bandwidthEstimate', bwEstimate);
    }

    _normalizeConfig(cfg: GenericObject): void {
        const floating = cfg.floating;

        if (floating && !!floating.disabled) {
            delete cfg.floating;
        }
    }
}

const syncProviderProperties = (model: Model, provider: ImplementedProvider) => {
    model.set('provider', provider.getName());
    if (model.get('instreamMode') === true) {
        provider.instreamMode = true;
    }

    if (provider.getName().name.indexOf('flash') === -1) {
        model.set('flashThrottle', undefined);
        model.set('flashBlocked', false);
    }

    // Attempt setting the playback rate to be the user selected value
    model.setPlaybackRate(model.get('defaultPlaybackRate'));

    // Set playbackRate because provider support for playbackRate may have changed and not sent an update
    model.set('supportsPlaybackRate', provider.supportsPlaybackRate);
    model.set('playbackRate', provider.getPlaybackRate());
    model.set('renderCaptionsNatively', provider.renderNatively);
};

function syncPlayerWithMediaModel(mediaModel: MediaModel): void {
    // Sync player state with mediaModel state
    const mediaState: InternalPlayerState = mediaModel.get('mediaState');
    mediaModel.trigger('change:mediaState', mediaModel, mediaState, mediaState);
}

export type MediaModelAttributes = {
    audioTracks?: SimpleAudioTrack[];
    buffer: number;
    currentAudioTrack?: number;
    currentLevel?: number;
    currentTime: number;
    duration: number;
    levels?: { label: string }[];
    mediaState: InternalPlayerState;
    mediaType?: 'video' | 'audio';
    position: number;
    preloaded: boolean;
    seekRange?: SeekRange;
    setup: boolean;
    started: boolean;
    visualQuality: GenericObject | null;
}

interface MediaModel {
    readonly attributes: Partial<MediaModelAttributes>;
    addAttributes(attributes: Partial<MediaModelAttributes>): void;
    get<K extends keyof MediaModelAttributes>(attr: K): MediaModelAttributes[K];
    set<K extends keyof MediaModelAttributes>(attr: K, val: MediaModelAttributes[K]): void;
}


// Represents the state of the provider/media element
class MediaModel extends SimpleModel {

    constructor() {
        super();
        this.addAttributes({
            mediaState: STATE_IDLE
        });
    }

    srcReset(): void {
        Object.assign(this.attributes, {
            setup: false,
            started: false,
            preloaded: false,
            visualQuality: null,
            buffer: 0,
            currentTime: 0
        });
    }
}

export { MediaModel };
export default Model;
