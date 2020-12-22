import type { ImplementedProvider, ProviderEvents, SeekRange } from '../../../../../src/js/providers/default';
import type Events from '../../../../../src/js/utils/backbone.events';
import type { InternalPlayerState } from '../../../../../src/js/events/events';
import type PlaylistItem from '../../../../../src/js/playlist/item';
import type { PlaylistItemSource } from '../../../../../src/js/playlist/source';
import type { QualityLevel } from '../../../../../src/js/providers/data-normalizer';

const jwplayer = window.jwplayer;
const PROVIDER_NAME = 'headless-video-element';

// Provider events not implemented in the example:
// "bandwidthEstimate" (We're letting the browser handle network activity here)
// "metadataCueParsed" and "meta" events (emsg, id3, program-date-time...) (See html5.ts)

// The ImplementedProvider interface matches internal providers
// These changes reflect the interface required for any provider registered with jwplayer
interface CustomProvider extends Omit<ImplementedProvider,
    'prototype'|'seeking'|'stallTime'|'instreamMode'|'renderNatively'|'supports'|'video'|
    'getCurrentTime'|'getDuration'|'getSeekRange'|'getLiveLatency'|'getTargetLatency'|'setCurrentSubtitleTrack'|'setControls'|
    'getBandwidthEstimate'|'isLive'> {
    attachMedia(): void;
    detachMedia(): void;
}

interface VideoElementProvider {
    // These methods are added in the constructor
    // See src/js/utils/backbone.events.ts
    on: CustomProvider['on'];
    once: CustomProvider['once'];
    off: CustomProvider['off'];
    trigger: CustomProvider['trigger'];
    // These 'DefaultProvider' methods are added to the prototype
    // See src/js/providers/default.ts and src/js/providers/providers-register.ts
    sendMediaType: (sources: Array<PlaylistItemSource>) => void;
    setState: (state: InternalPlayerState) => void;
}

type PlayerConfig = {
    // Select an adaptation based on last bandwidthEstimate event from previous session
    bandwidthEstimate: number | null,
    // The user made a manual adaptation selection which had a bitrate of this value in the previous session
    bitrateSelection: number | null
}

class VideoElementProvider implements CustomProvider {

    private static video?: HTMLVideoElement;

    public name: string;
    public state: InternalPlayerState;
    public supportsPlaybackRate: boolean;
    public container: HTMLDivElement | null;

    private item: PlaylistItem;
    private videoElement: HTMLVideoElement;
    private config: { [key: string]: any };
    private seeking: boolean;
    private seekFromTime: number | null;
    private seekToTime: number | null;
    private stallTime: number | null;
    private visualQuality: ProviderEvents['visualQuality'];
    private readonly listenerDictionary: { [key: string]: any };
    private audioTracksChangeHandler: (this: VideoElementProvider) => void;
    private subtitleTracksChangeHandler: (this: VideoElementProvider) => void;
    private currentQuality: number;
    private currentAudioTrack: number;
    private currentSubtitleTrack: number;
    private subtitleTracksDispatched: boolean;

    static supports(source: PlaylistItemSource): boolean {
        if (source.type === 'custom-type') {
            return true;
        }
        const video = VideoElementProvider.video = VideoElementProvider.video || document.createElement('video');
        const mimeType = source.mimeType || {
            aac: 'audio/mp4',
            mp4: 'video/mp4',
            f4v: 'video/mp4',
            m4v: 'video/mp4',
            mov: 'video/mp4',
            mp3: 'audio/mpeg',
            mpeg: 'audio/mpeg',
            ogv: 'video/ogg',
            ogg: 'video/ogg',
            oga: 'video/ogg',
            vorbis: 'video/ogg',
            webm: 'video/webm',
            f4a: 'video/aac',
            m3u8: 'application/vnd.apple.mpegurl',
            m3u: 'application/vnd.apple.mpegurl',
            hls: 'application/vnd.apple.mpegurl'
        }[source.type];
        return !!(video && video.canPlayType && video.canPlayType(mimeType));
    }

    static getName(): { name: string } {
        return {
            name: PROVIDER_NAME
        };
    }

    static isLive(duration) {
        return duration === Infinity;
    }

    static isDvr(seekableDuration, minDvrWindow) {
        return seekableDuration !== Infinity && Math.abs(seekableDuration) >= minDvrWindow;
    }

    constructor(playerId: string, config: PlayerConfig, mediaElement: HTMLVideoElement) {
        // Add event listener methods used by the player to this instance
        // See src/js/utils/backbone.events.ts
        const backboneEvents: Events = jwplayer(playerId).Events;
        Object.assign(this, backboneEvents);

        // This video element comes from a pool managed by the player for dealing with autoplay policy
        // and ads playback, but you could also use or create your own.
        this.videoElement = mediaElement;
        this.audioTracksChangeHandler = this.audioTracksChange.bind(this);
        this.subtitleTracksChangeHandler = this.subtitleTracksChange.bind(this);
        this.currentQuality = -1;
        this.currentAudioTrack = -1;
        this.currentSubtitleTrack = -1;
        this.subtitleTracksDispatched = false;
        this.name = PROVIDER_NAME;
        this.state = 'idle';
        this.supportsPlaybackRate = true;
        this.item = null;
        this.container = null;
        this.config = config;
        this.seeking = false;
        this.seekFromTime = null;
        this.seekToTime = null;
        this.stallTime = null;
        this.visualQuality = {
            reason: 'initial choice',
            mode: 'auto',
            bitrate: 0,
            level: {
                width: 0,
                height: 0,
                index: 0,
                label: ''
            }
        };

        // Enable to use element controls rather than JW's
        // window.jwplayer(playerId).setControls(false);
        // this.videoElement.setAttribute('controls', '');

        // Update state and trigger jwplayer events in response to changes on the video element
        const videoEventCallbacks = {
            click(this: VideoElementProvider, evt: Event) {
                this.trigger('click', evt);
            },
            loadedmetadata(this: VideoElementProvider) {
                this.trigger('meta', {
                    metadataType: 'media',
                    duration: this.getDuration(),
                    height: this.videoElement.videoHeight,
                    width: this.videoElement.videoWidth,
                    seekRange: this.getSeekRange()
                });
            },
            loadeddata(this: VideoElementProvider) {
                if (this.videoElement.getStartDate) {
                    // Get 'program-date-time' from this.videoElement.getStartDate() in Safari
                }
                this.dispatchAudioTracks();
                this.dispatchSubtitleTracks();
            },
            durationchange(this: VideoElementProvider) {
                this.listenerDictionary.progress.call(this);
            },
            canplay(this: VideoElementProvider) {
                const mediaType = (this.videoElement.videoHeight === 0) ? 'audio' : 'video';
                this.trigger('mediaType', { mediaType });
                this.trigger('bufferFull');
            },
            play(this: VideoElementProvider) {
                if (!this.videoElement.paused && this.state !== 'playing') {
                    this.setState('loading');
                }
            },
            playing(this: VideoElementProvider) {
                this.trigger('providerFirstFrame');
                this.setState('playing');
            },
            pause(this: VideoElementProvider) {
                if (this.state === 'complete' ||
                    this.videoElement.ended ||
                    this.videoElement.error ||
                    this.videoElement.currentTime === this.videoElement.duration) {
                    return;
                }
                this.setState('paused');
            },
            timeupdate(this: VideoElementProvider) {
                const duration = this.getDuration();
                if (isNaN(duration)) {
                    return;
                }
                const currentTime = this.videoElement.currentTime;
                if (!this.seeking && !this.videoElement.paused &&
                    (this.state === 'stalled' || this.state === 'loading') &&
                    this.stallTime !== currentTime) {
                    this.stallTime = -1;
                    this.listenerDictionary.playing.call(this);
                }
                const position = this.getCurrentTime();
                const seekRange = this.getSeekRange();
                const timeEvent: ProviderEvents['time'] = {
                    position,
                    duration,
                    currentTime,
                    seekRange,
                    metadata: {
                        currentTime
                    }
                };
                const latency = this.getLiveLatency();
                if (latency !== null) {
                    timeEvent.latency = latency;
                }

                if (this.seekToTime === null) {
                    this.seekFromTime = currentTime;
                }
                // only emit time events when playing or seeking
                if (this.state === 'playing' || this.seeking) {
                    this.trigger('time', timeEvent);
                }
            },
            ratechange(this: VideoElementProvider) {
                this.trigger('ratechange', { playbackRate: this.videoElement.playbackRate });
            },
            seeking(this: VideoElementProvider) {
                const offset = this.seekToTime !== null ? this.timeToPosition(this.seekToTime) : this.getCurrentTime();
                const position = this.timeToPosition(this.seekFromTime || 0);
                this.seekFromTime = this.seekToTime;
                this.seekToTime = null;
                this.seeking = true;
                this.trigger('seek', {
                    position,
                    offset
                });
            },
            seeked(this: VideoElementProvider) {
                if (!this.seeking) {
                    return;
                }
                this.seeking = false;
                this.trigger('seeked');
            },
            progress(this: VideoElementProvider) {
                const duration = this.getDuration();
                const buffered = this.videoElement.buffered;
                if (duration <= 0 || duration === Infinity || !buffered || buffered.length === 0) {
                    return;
                }
                const bufferPercent = 100 * Math.min(Math.max(buffered.end(buffered.length - 1) / duration, 0), 1);
                this.trigger('bufferChange', {
                    bufferPercent,
                    position: this.getCurrentTime(),
                    duration,
                    currentTime: this.videoElement.currentTime,
                    seekRange: this.getSeekRange()
                });
            },
            waiting(this: VideoElementProvider) {
                if (this.seeking) {
                    this.setState('loading');
                } else if (this.state === 'playing') {
                    if (this.atEdgeOfLiveStream()) {
                        this.setPlaybackRate(1);
                    }
                    this.stallTime = this.videoElement.currentTime;
                    this.setState('stalled');
                }
            },
            resize(this: VideoElementProvider) {
                const { videoElement } = this;
                const { videoWidth, videoHeight } = videoElement;
                // Trigger 'visualQuality' when videoWidth or videoHeight changes
                const level = this.visualQuality.level;
                if (level.width !== videoWidth || level.height !== videoHeight) {
                    const visualQuality: ProviderEvents['visualQuality'] = {
                        level: {
                            width: videoWidth,
                            height: videoHeight,
                            index: 0,
                            label: ''
                        },
                        bitrate: 0,
                        mode: 'auto', // 'manual' for manual quality selection
                        reason: 'auto', // 'initial choice' for first resize after loading new item
                    };
                    this.visualQuality = visualQuality;
                    this.trigger('visualQuality', visualQuality);
                }
            },
            volumechange(this: VideoElementProvider) {
                this.trigger('volume', {
                    volume: Math.round(this.videoElement.volume * 100)
                });

                this.trigger('mute', {
                    mute: this.videoElement.muted
                });
            },
            ended(this: VideoElementProvider) {
                if (this.state !== 'idle' && this.state !== 'complete') {
                    this.trigger('complete');
                }
            },
            error(this: VideoElementProvider, sourceError) {
                this.videoElement.removeAttribute('src');
                this.videoElement.load();
                const error = {
                    code: 290000, // Unknown Provider Error
                    sourceError
                };
                this.trigger('mediaError', error);
            }
        };

        this.listenerDictionary = {};
        Object.keys(videoEventCallbacks).forEach(eventName => {
            this.listenerDictionary[eventName] = videoEventCallbacks[eventName].bind(this);
        });
    }

    getName(): { name: string } {
        return VideoElementProvider.getName();
    }

    attachMedia(): void {
        this.seeking = false;
        this.seekFromTime = null;
        this.seekToTime = null;
        // Reset video element settings
        this.videoElement.loop = false;
        // Add video element event listeners
        const listenerDictionary = this.listenerDictionary;
        Object.keys(listenerDictionary).forEach(eventName => {
            this.videoElement.removeEventListener(eventName, listenerDictionary[eventName]);
            this.videoElement.addEventListener(eventName, listenerDictionary[eventName]);
        });
        const audioTracks = this.videoElement.audioTracks;
        if (audioTracks) {
            audioTracks.removeEventListener('change', this.audioTracksChangeHandler);
            audioTracks.addEventListener('change', this.audioTracksChangeHandler);
        }
        const textTracks = this.videoElement.textTracks;
        if (textTracks) {
            textTracks.removeEventListener('change', this.subtitleTracksChangeHandler);
            textTracks.addEventListener('change', this.subtitleTracksChangeHandler);
        }
    }

    detachMedia(): void {
        if (!this.videoElement) {
            return;
        }
        const listenerDictionary = this.listenerDictionary;
        Object.keys(listenerDictionary).forEach(eventName => {
            this.videoElement.removeEventListener(eventName, listenerDictionary[eventName]);
        });
        const audioTracks = this.videoElement.audioTracks;
        if (audioTracks) {
            audioTracks.removeEventListener('change', this.audioTracksChangeHandler);
        }
        const textTracks = this.videoElement.textTracks;
        if (textTracks) {
            textTracks.removeEventListener('change', this.subtitleTracksChangeHandler);
        }
    }

    init(item: PlaylistItem): void {
        this.item = item;
        this.state = 'idle';
        this.currentQuality = -1;
        this.currentAudioTrack = -1;
        this.currentSubtitleTrack = -1;
        this.subtitleTracksDispatched = false;
        this.attachMedia();
    }

    preload(item: PlaylistItem): void {
        this.item = item;
        if (item.image) {
            this.videoElement.setAttribute('poster', item.image);
        }
        // Up to you to pick from available adaptations once they are known. This is just a quick hack to pick
        // from a list of mp4 source, or the one HLS source in Safari.
        this.currentQuality = Math.floor(item.sources.length / 3);
        this.setVideoSource(item.sources[this.currentQuality]);
        this.videoElement.load();
    }

    load(item: PlaylistItem): void {
        this.item = item;
        const previousSource = this.videoElement.src;
        this.currentQuality = this.currentQuality < 0 ? Math.floor(item.sources.length / 3) : this.currentQuality;
        this.setVideoSource(item.sources[this.currentQuality]);
        const sourceChanged = previousSource !== this.videoElement.src;
        if (sourceChanged) {
            // Do not call load if src was not set. load() will cancel any active play promise.
            if (previousSource) {
                this.videoElement.load();
            }
        } else if (item.starttime === 0 && this.videoElement.currentTime > 0) {
            // Load event is from the same video as before
            // restart video without dispatching seek event
            this.seek(item.starttime);
        }

        // Check if we have already seeked the mediaElement before _completeLoad has been called
        if (item.starttime > 0 && this.videoElement.currentTime !== item.starttime) {
            this.seek(item.starttime);
        }

        // This should be triggered when adaptation sets are known
        // In this case we can't provide manual quality selection so just report a single level
        const levels = this.getQualityLevels();

        this.trigger('levels', {
            levels,
            currentQuality: this.currentQuality
        });
    }

    volume(vol: number): void {
        this.videoElement.volume = Math.min(Math.max(0, vol / 100), 1);
    }

    mute(state: string): void {
        this.videoElement.muted = !!state;
    }

    resize(width: number, height: number, stretching: string): void {
        const { videoWidth, videoHeight } = this.videoElement;
        if (!width || !height || !videoWidth || !videoHeight) {
            return;
        }
        this.videoElement.style.objectFit = '';
        if (stretching === 'uniform') {
            // Snap video to edges when the difference in aspect ratio is less than 9% and perceivable
            const playerAspectRatio = width / height;
            const videoAspectRatio = videoWidth / videoHeight;
            const edgeMatch = Math.abs(playerAspectRatio - videoAspectRatio);
            if (edgeMatch < 0.09 && edgeMatch > 0.0025) {
                this.videoElement.style.objectFit = 'fill';
            }
        }
    }

    getContainer(): HTMLDivElement | null {
        return this.container;
    }

    setContainer(element: HTMLDivElement): void {
        this.container = element;
        if (element && this.videoElement.parentNode !== element) {
            element.appendChild(this.videoElement);
        }
    }

    removeFromContainer(): void {
        const { container, videoElement } = this;
        this.container = null;
        if (container && container === videoElement.parentNode) {
            container.removeChild(videoElement);
        }
    }

    public remove(): void {
        const container = this.container;
        const video = this.videoElement;
        this.stop();
        this.destroy();
        if (container) {
            container.removeChild(video);
        }
    }

    public stop(): void {
        this.seeking = false;
        if (this.videoElement) {
            this.videoElement.removeAttribute('preload');
            this.videoElement.removeAttribute('src');
            this.videoElement.load();
        }
        this.setState('idle');
    }

    public destroy(): void {
        this.off();
        this.detachMedia();
        this.item = null;
        this.seeking = false;
        this.container = null;
        // @ts-ignore
        this.config = null;
        // @ts-ignore
        this.videoElement = null;
        // @ts-ignore
        this.audioTracksChangeHandler = null;
        // @ts-ignore
        this.subtitleTracksChangeHandler = null;
    }

    public supportsFullscreen(): boolean {
        return true;
    }

    public setVisibility(state): void {
        state = !!state;
        if (this.container) {
            this.container.style.opacity = state ? '1' : '0';
        }
    }

    public play(): Promise<void> {
        return this.videoElement.play();
    }

    public pause(): void {
        this.videoElement.pause();
    }

    public seek(toPosition: number) {
        const seekRange = this.getSeekRange();
        if (toPosition < 0) {
            this.seekToTime = toPosition + seekRange.end;
        } else {
            this.seekToTime = toPosition;
        }
        this.seeking = true;
        this.seekFromTime = this.videoElement.currentTime;
        this.videoElement.currentTime = this.seekToTime;
    }

    public getPlaybackRate(): number {
        return this.videoElement.playbackRate;
    }

    public setPlaybackRate(playbackRate: number) {
        this.videoElement.playbackRate = this.videoElement.defaultPlaybackRate = playbackRate;
    }

    public getCurrentQuality(): number {
        return this.currentQuality;
    }

    public setCurrentQuality(currentQuality: number): void {
        // Implement based on availability of manual bitrate selection
        if (currentQuality > -1 && this.currentQuality !== currentQuality &&
            this.item.sources && currentQuality < this.item.sources.length) {
            this.currentQuality = currentQuality;
            const levels = this.getQualityLevels();
            this.trigger('levelsChanged', {
                currentQuality,
                levels
            });
            const playing = !this.videoElement.paused;
            const currentTime = this.videoElement.currentTime;
            this.setVideoSource(this.item.sources[currentQuality]);
            this.videoElement.currentTime = currentTime;
            if (playing) {
                this.videoElement.play();
            }
        }
    }

    public getQualityLevels(): QualityLevel[] {
        return this.item.sources.map(source => ({
            bitrate: source.bitrate || 0,
            label: source.label || `${source.height}p`,
            width: source.width,
            height: source.height
        }));
    }

    public setCurrentAudioTrack(currentTrack: number): void {
        if (currentTrack > -1 && this.videoElement) {
            const audioTracks = this.videoElement.audioTracks;
            if (currentTrack === this.currentAudioTrack || !audioTracks || currentTrack >= audioTracks.length) {
                return;
            }
            this.currentAudioTrack = currentTrack;
            audioTracks[currentTrack].enabled = true;
            const tracksArray = [].slice.call(audioTracks);
            const tracks = tracksArray.map((track: AudioTrack) => ({
                name: track.label || track.language,
                language: track.language
            }));
            this.trigger('audioTrackChanged', { currentTrack, tracks });
        }
    }

    public setSubtitlesTrack(oneIndexedTrackIndex: number) {
        this.dispatchSubtitleTracks();
        const currentTrack = oneIndexedTrackIndex - 1;
        if (currentTrack > -1 && this.videoElement && this.videoElement.textTracks) {
            const textTracks = this.videoElement.textTracks;
            const tracks = [].slice.call(textTracks).filter((track: TextTrack) => track.kind === 'subtitles');
            if (currentTrack === this.currentSubtitleTrack || currentTrack >= tracks.length) {
                return;
            }
            this.currentSubtitleTrack = currentTrack;
            tracks.forEach(track => track.mode = 'disabled');
            tracks[currentTrack].mode = 'showing';
            // Here's an annoying bug where currentTrack is required to be one-indexed even though it should be 0
            // This event is required for captions functionality, unless you want external changes made
            // to the video textTracks to be reflected in JW Player.
            this.trigger('subtitlesTrackChanged', { currentTrack: oneIndexedTrackIndex, tracks });
        }
    }

    public getCurrentAudioTrack(): number {
        return 0;
    }
    public getAudioTracks(): { name: string, language: string }[] {
        return [];
    }

    public getFullscreen(): boolean {
        // Only return true if the video element itself is fullscreen (not the app/page/player)
        return false;
    }

    public setFullscreen(isFullscreen: boolean): void {
        // Request for the video element to go fullscreen, because the player is unable (iOS)
    }

    private getCurrentTime(): number {
        const currentTime = this.videoElement.currentTime;
        const seekRange = this.getSeekRange();
        if (VideoElementProvider.isLive(this.videoElement.duration)) {
            if (VideoElementProvider.isDvr(seekRange.end - seekRange.start, Math.max(this.config.minDvrWindow, 30))) {
                return currentTime - seekRange.end;
            }
        }
        return currentTime;
    }

    private getDuration(): number {
        let duration = this.videoElement.duration;
        // Don't sent time event on Android before real duration is known
        if (isNaN(duration)) {
            return 0;
        }
        const end = this.getSeekableEnd();
        if (VideoElementProvider.isLive(this.videoElement.duration) && end) {
            const seekableDuration = end - this.getSeekableStart();
            if (VideoElementProvider.isDvr(seekableDuration, Math.max(this.config.minDvrWindow, 30))) {
                // Player interprets negative duration as DVR
                duration = -seekableDuration;
            }
        }
        return duration;
    }

    private getSeekRange(): SeekRange {
        const seekRange: SeekRange = {
            start: 0,
            end: 0
        };
        const seekable = this.videoElement.seekable;
        if (seekable.length) {
            seekRange.end = this.getSeekableEnd();
            seekRange.start = this.getSeekableStart();
        } else if (isFinite(this.videoElement.duration)) {
            seekRange.end = this.videoElement.duration;
        }
        return seekRange;
    }

    private getSeekableStart(): number {
        let start = Infinity;
        ['buffered', 'seekable'].forEach(range => {
            const timeRange = this.videoElement[range];
            let index = timeRange ? timeRange.length : 0;
            while (index--) {
                const rangeStart = Math.min(start, timeRange.start(index));
                if (isFinite(rangeStart)) {
                    start = rangeStart;
                }
            }
        });
        return start;
    }

    private getSeekableEnd(): number {
        let end = 0;
        ['buffered', 'seekable'].forEach(range => {
            const timeRange = this.videoElement[range];
            let index = timeRange ? timeRange.length : 0;
            while (index--) {
                const rangeEnd = Math.max(end, timeRange.end(index));
                if (isFinite(rangeEnd)) {
                    end = rangeEnd;
                }
            }
        });
        return end;
    }

    private timeToPosition(time: number): number {
        if (VideoElementProvider.isLive(this.videoElement.duration)) {
            const seekRange = this.getSeekRange();
            if (VideoElementProvider.isDvr(seekRange.end - seekRange.start, Math.max(this.config.minDvrWindow, 30))) {
                return Math.min(0, time - seekRange.end);
            }
        }
        return time;
    }

    private atEdgeOfLiveStream(): boolean {
        if (!VideoElementProvider.isLive(this.videoElement.duration)) {
            return false;
        }
        // currentTime doesn't always get to the end of the buffered range
        const timeFudge = 2;
        const buffered = this.videoElement.buffered;
        const endOfRange = (buffered && buffered.length) ? buffered.end(buffered.length - 1) : 0;
        return (endOfRange - this.videoElement.currentTime) <= timeFudge;
    }

    private getLiveLatency(): number | null {
        let latency: number | null = null;
        const end = this.getSeekableEnd();
        if (VideoElementProvider.isLive(this.videoElement.duration) && end) {
            latency = end - this.videoElement.currentTime;
        }
        return latency;
    }

    private setVideoSource(source: PlaylistItemSource): void {
        const preload = source.preload || 'metadata';
        if (this.videoElement.getAttribute('preload') !== preload) {
            this.videoElement.setAttribute('preload', preload);
        }
        const sourceElement = document.createElement('source');
        sourceElement.src = source.file;
        const sourceChanged = (this.videoElement.src !== sourceElement.src);
        if (sourceChanged) {
            this.videoElement.src = source.file;
        }
    }

    private dispatchAudioTracks(): void {
        const audioTracks = this.videoElement.audioTracks;
        if (audioTracks && audioTracks.length) {
            const tracksArray = [].slice.call(audioTracks);
            let currentTrack = tracksArray.findIndex((track: AudioTrack) => track.enabled);
            if (currentTrack === -1) {
                currentTrack = 0;
                audioTracks[0].enabled = true;
            }
            const tracks = tracksArray.map((track: AudioTrack) => ({
                name: track.label || track.language,
                language: track.language
            }));
            audioTracks.removeEventListener('change', this.audioTracksChangeHandler);
            audioTracks.addEventListener('change', this.audioTracksChangeHandler);
            this.trigger('audioTracks', { currentTrack, tracks });
        }
    }

    private audioTracksChange(): void {
        const tracksArray = [].slice.call(this.videoElement.audioTracks);
        const currentTrack = tracksArray.findIndex((track: AudioTrack) => track.enabled);
        this.setCurrentAudioTrack(currentTrack);
    }

    private dispatchSubtitleTracks(): void {
        if (this.subtitleTracksDispatched) {
            return;
        }
        const textTracks = this.videoElement.textTracks;
        if (textTracks && textTracks.length) {
            this.subtitleTracksDispatched = true;
            const tracks = [].slice.call(textTracks).filter((track: TextTrack) => track.kind === 'subtitles');
            textTracks.removeEventListener('change', this.subtitleTracksChangeHandler);
            textTracks.addEventListener('change', this.subtitleTracksChangeHandler);
            this.trigger('subtitlesTracks', { tracks });
        }
    }

    private subtitleTracksChange(): void {
        const textTracks = this.videoElement.textTracks;
        const tracks = [].slice.call(textTracks).filter((track: TextTrack) => track.kind === 'subtitles');
        const currentTrack = tracks.findIndex((track: TextTrack) => track.mode === 'showing');
        this.setSubtitlesTrack(currentTrack + 1);
    }
}

jwplayer.api.registerProvider(VideoElementProvider);
