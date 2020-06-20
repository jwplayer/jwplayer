import {
    PLAYER_STATE,
    MEDIA_TYPE,
    InternalPlayerState,
} from 'events/events';
import type * as Event from 'events/events';
import type { TracksMixin, SimpleAudioTrack } from 'providers/tracks-mixin';
import type { VideoActionsInt } from 'providers/video-actions-mixin';
import type { VideoAttachedInt } from 'providers/video-attached-mixin';
import type { VideoListenerInt } from 'providers/video-listener-mixin';
import type PlaylistItem from 'playlist/item';
import type { QualityLevel } from 'providers/data-normalizer';
import type { PlaylistItemSource } from 'playlist/source';
import type { PlayerError } from 'api/errors';
import type { GenericObject, TextTrackLike } from 'types/generic.type';

const noop: () => void = function(): void { /* noop */ };
const returnFalse: () => boolean = (() => false);
const getNameResult: { name: string } = { name: 'default' };
const returnName: () => { name: string } = (() => getNameResult);

export type SeekRange = {
    start: number;
    end: number;
};

export type ProviderEvents = {
    [Event.PLAYER_STATE]: {
        newstate: InternalPlayerState;
    };
    [Event.MEDIA_TYPE]: {
        mediaType: 'audio' | 'video';
    };
    [Event.BANDWIDTH_ESTIMATE]: {
        bandwidthEstimate: number;
    };
    [Event.MEDIA_SEEK]: {
        position: number; offset: number;
    };
    [Event.MEDIA_META_CUE_PARSED]: {
        metadataType: 'media' | 'id3' | 'emsg' | 'date-range' | 'program-date-time' | 'scte-35' | 'discontinuity';
        metadataTime?: number;
        metadata?: GenericObject;
        programDateTime?: string;
        duration?: number;
        height?: number;
        width?: number;
        seekRange?: SeekRange;
    };
    [Event.MEDIA_META]: {
        metadataType: 'media' | 'id3' | 'emsg' | 'date-range' | 'program-date-time' | 'scte-35' | 'discontinuity';
        metadataTime?: number;
        metadata?: GenericObject;
        programDateTime?: string;
        duration?: number;
        height?: number;
        width?: number;
        seekRange?: SeekRange;
        drm?: 'widevine' | 'playready' | 'clearkey' | null;
    };
    [Event.MEDIA_VISUAL_QUALITY]: {
        reason: 'auto';
        mode: 'auto' | 'manual';
        bitrate: number;
        level: {
            width: number;
            height: number;
            index: number;
            label: string;
        };
    };
    [Event.MEDIA_LEVELS]: {
        levels: {
            label: string;
        }[];
        currentQuality: number;
    };
    [Event.MEDIA_LEVEL_CHANGED]: {
        levels: {
            label: string;
        }[];
        currentQuality: number;
    };
    [Event.MEDIA_BUFFER]: {
        bufferPercent: number;
        position: number;
        duration: number;
        currentTime: number;
        seekRange: SeekRange;
    };
    [Event.MEDIA_TIME]: {
        position: number;
        duration: number;
        currentTime: number;
        seekRange: SeekRange;
        latency?: number;
        metadata: {
            currentTime: number;
            mpegts?: number;
        };
    };
    [Event.MEDIA_RATE_CHANGE]: {
        playbackRate: number;
    };
    [Event.AUDIO_TRACKS]: {
        currentTrack: number;
        tracks: SimpleAudioTrack[];
    };
    [Event.AUDIO_TRACK_CHANGED]: {
        currentTrack: number;
        tracks: SimpleAudioTrack[];
    };
    [Event.SUBTITLES_TRACKS]: {
        tracks: TextTrackLike[];
    };
    [Event.SUBTITLES_TRACK_CHANGED]: {
        currentTrack: number;
        tracks: TextTrackLike[];
    };
    [Event.MEDIA_VOLUME]: {
        volume: number;
    };
    [Event.MEDIA_MUTE]: {
        mute: boolean;
    };
    [Event.NATIVE_FULLSCREEN]: {
        target: EventTarget | null;
        jwstate: boolean;
    };
    [Event.CLICK]: Event;
    [Event.WARNING]: PlayerError;
    [Event.MEDIA_ERROR]: PlayerError;
}

type ProviderEventNotifications = {
    [Event.MEDIA_SEEKED]: void;
    [Event.PROVIDER_FIRST_FRAME]: void;
    [Event.MEDIA_BUFFER_FULL]: void;
    [Event.MEDIA_COMPLETE]: void;
}

interface InternalProvider {
    state?: string;
    video: HTMLVideoElement;
    instreamMode: boolean;
    supportsPlaybackRate: boolean;
    seeking: boolean;
    stallTime: number;
    renderNatively: boolean;

    supports: () => boolean;
    play: () => Promise<void>;
    pause: () => void;

    init: (item: PlaylistItem) => void;
    preload: (item: PlaylistItem) => void;
    load: (item: PlaylistItem) => void;
    stop: () => void;
    destroy: () => void; // frees memory
    isLive: () => boolean;
    setCurrentSubtitleTrack?: (trackID: number) => void;
    getBandwidthEstimate: () => number | null;

    setPlaybackRate: (rate: number) => void;
    getName: () => { name: string };
    getCurrentTime: () => number;

    seek: (seekPos: number) => void;

    setVisibility: (isVisible: boolean) => void;

    setFullscreen: (isFullscreen: boolean) => void;
    getFullscreen: () => boolean;
    supportsFullscreen: () => boolean;

    getQualityLevels: () => QualityLevel[];
    getCurrentQuality: () => number;
    setCurrentQuality: (qualityLevel: number) => void;

    getCurrentAudioTrack: () => number;
    setCurrentAudioTrack: (at: number) => void;

    getAudioTracks: () => SimpleAudioTrack[];

    getSeekRange: () => SeekRange;

    getPlaybackRate: () => number;
    getLiveLatency: () => number | null;
    setControls: () => void;
    setState: (state: InternalPlayerState) => void;

    sendMediaType: (sources: Array<PlaylistItemSource>) => void;

    getDuration: () => number;
}

export interface ImplementedProvider extends InternalProvider {
    volume(vol: number): void;
    mute(state: string): void;
    resize(width: number, height: number, stretching: string): void;

    getContainer(): HTMLElement | null;
    setContainer(element: HTMLElement): void;

    remove(): void;

    attachMedia: () => void;
    detachMedia: () => void;

    on<E extends keyof ProviderEvents>(name: E, callback: Function, context?: any): ImplementedProvider;
    once<E extends keyof ProviderEvents>(name: E, callback: Function, context?: any): ImplementedProvider;
    off<E extends keyof ProviderEvents>(name?: E | null, callback?: Function | null, context?: any): ImplementedProvider;
    trigger<E extends keyof ProviderEvents>(evt: E, obj: ProviderEvents[E]): ImplementedProvider;
    trigger<E extends keyof ProviderEventNotifications>(evt: E): ImplementedProvider;

    prototype: Omit<ImplementedProvider, 'prototype'>;
}

export type ProviderWithMixins = TracksMixin & VideoActionsInt & VideoAttachedInt & VideoListenerInt & ImplementedProvider & {
    drmUsed?: 'widevine' | 'playready' | 'clearkey' | null;
    // Providers can implement this method to add the invoked return value on "time" events `metadata.mpegts` property.
    getPtsOffset?(): number;
};

interface DefaultProvider {
    state?: string;
    supports: () => boolean;
    play: () => void;
    pause: () => void;
    preload: () => void;
    load: () => void;
    stop: () => void;
    volume: () => void;
    mute: () => void;
    seek: () => void;
    resize: () => void;
    remove: () => void; // removes from page
    destroy: () => void; // frees memory

    setVisibility: () => void;
    setFullscreen: () => void;
    getFullscreen: () => boolean;
    supportsFullscreen: () => boolean;

    // If setContainer has been set; this returns the element.
    //  It's value is used to determine if we should remove the <video> element when setting a new provider.
    getContainer: () => void;

    // Sets the parent element; causing provider to append <video> into it
    setContainer: () => void;

    getName: () => { name: string };

    getQualityLevels: () => void;
    getCurrentQuality: () => void;
    setCurrentQuality: () => void;

    getAudioTracks: () => void;

    getCurrentAudioTrack: () => void;
    setCurrentAudioTrack: () => void;

    getSeekRange: () => SeekRange;

    setPlaybackRate: () => void;
    getPlaybackRate: () => number;
    getBandwidthEstimate: () => number | null;
    getLiveLatency: () => number | null;
    setControls: () => void;

    attachMedia: () => void;
    detachMedia: () => void;
    init: () => void;

    setState: (state: InternalPlayerState) => void;

    sendMediaType: (sources: Array<PlaylistItemSource>) => void;

    getDuration: () => number;

    trigger: () => void;
}

/** Audio Track information for tracks returned by {@link Api#getAudioTracks jwplayer().getAudioTracks()}
 * @typedef {object} AudioTrackOption
 * @property autoselect
 * @property defaulttrack
 * @property groupid
 * @property {string} language
 * @property {string} name
 */

/**
 * @typedef {option} QualityOption
 * @property {string} label
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [bitrate]
 */

const DefaultProvider: DefaultProvider = {
    // This function is required to determine if a provider can work on a given source
    supports: returnFalse,

    // Basic playback features
    play: noop,
    pause: noop,
    preload: noop,
    load: noop,
    stop: noop,
    volume: noop,
    mute: noop,
    seek: noop,
    resize: noop,
    remove: noop, // removes from page
    destroy: noop, // frees memory

    setVisibility: noop,
    setFullscreen: noop,
    getFullscreen: returnFalse,
    supportsFullscreen: returnFalse,

    // If setContainer has been set, this returns the element.
    //  It's value is used to determine if we should remove the <video> element when setting a new provider.
    getContainer: noop,

    // Sets the parent element, causing provider to append <video> into it
    setContainer: noop,

    getName: returnName,

    getQualityLevels: noop,
    getCurrentQuality: noop,
    setCurrentQuality: noop,

    getAudioTracks: noop,

    getCurrentAudioTrack: noop,
    setCurrentAudioTrack: noop,

    getSeekRange: function(): SeekRange {
        return {
            start: 0,
            end: this.getDuration()
        };
    },

    setPlaybackRate: noop,
    getPlaybackRate: function(): number {
        return 1;
    },
    getBandwidthEstimate(): number | null {
        return null;
    },
    getLiveLatency(): number | null {
        return null;
    },

    // TODO: Deprecate provider.setControls(bool) with Flash. It's used to toggle the cursor when the swf is in focus.
    setControls: noop,

    attachMedia: noop,
    detachMedia: noop,
    init: noop,

    setState: function(this: ImplementedProvider, newstate: InternalPlayerState): void {
        this.state = newstate;

        this.trigger(PLAYER_STATE, {
            newstate
        });
    },

    sendMediaType: function(this: ImplementedProvider, sources: Array<PlaylistItemSource>): void {
        const { type, mimeType } = sources[0];

        const isAudioFile = (type === 'aac' || type === 'mp3' || type === 'mpeg' ||
            (mimeType && mimeType.indexOf('audio/') === 0));

        this.trigger(MEDIA_TYPE, {
            mediaType: isAudioFile ? 'audio' : 'video'
        });
    },

    getDuration: function(): number {
        return 0;
    },

    trigger: noop
};

export default DefaultProvider;
