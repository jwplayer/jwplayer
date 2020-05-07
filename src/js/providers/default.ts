import { PLAYER_STATE, MEDIA_TYPE } from 'events/events';
import type { GenericObject } from 'types/generic.type';
import type { TracksMixin, SimpleAudioTrack } from 'providers/tracks-mixin';
import type { VideoActionsInt } from 'providers/video-actions-mixin';
import type { VideoAttachedInt } from 'providers/video-attached-mixin';
import type Events from 'utils/backbone.events';
import type PlaylistItem from 'playlist/item';
import type { QualityLevel } from './data-normalizer';
import type { PlaylistItemSource } from 'playlist/source';

const noop: () => void = function(): void { /* noop */ };
const returnFalse: () => boolean = (() => false);
const getNameResult: { name: string } = { name: 'default' };
const returnName: () => { name: string } = (() => getNameResult);

export type SeekRange = {
    start: number;
    end: number;
};

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
    setState: (state: string) => void;

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

    on(name: string, callback: Function, context?: any): ImplementedProvider;
    off(name: string | null, callback?: Function | null, context?: any): ImplementedProvider;
    trigger(evt: string, obj: GenericObject): void;

    prototype: Omit<ImplementedProvider, 'prototype'>;
}

export type ProviderWithMixins = InternalProvider & TracksMixin & VideoActionsInt & VideoAttachedInt & Events;

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

    setState: (state: string) => void;

    sendMediaType: (sources: Array<PlaylistItemSource>) => void;

    getDuration: () => number;

    trigger: (evt: string, obj: GenericObject) => void;
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

    setState: function(newstate: string): void {
        this.state = newstate;

        this.trigger(PLAYER_STATE, {
            newstate
        });
    },

    sendMediaType: function(this: DefaultProvider, sources: Array<PlaylistItemSource>): void {
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
