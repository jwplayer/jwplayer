import { isValidNumber, isNumber } from 'utils/underscore';
import {
    PLAYER_STATE, STATE_IDLE, MEDIA_VOLUME, MEDIA_MUTE,
    MEDIA_TYPE, AUDIO_TRACKS, AUDIO_TRACK_CHANGED,
    MEDIA_RATE_CHANGE, MEDIA_BUFFER, MEDIA_TIME, MEDIA_LEVELS, MEDIA_LEVEL_CHANGED, MEDIA_ERROR,
    MEDIA_BEFORECOMPLETE, MEDIA_COMPLETE, MEDIA_META, MEDIA_SEEK, MEDIA_SEEKED,
    NATIVE_FULLSCREEN, MEDIA_VISUAL_QUALITY, BANDWIDTH_ESTIMATE, WARNING, SUBTITLES_TRACKS, SUBTITLES_TRACK_CHANGED
} from 'events/events';
import type Model from 'controller/model';
import type { MediaModel } from 'controller/model';
import type ProgramController from 'program/program-controller';
import type MediaController from 'program/media-controller';
import type { AllProviderEventsListener, AllProviderEvents, ProviderEvents } from 'providers/default';
import type { PlayerError } from 'api/errors';

export function ProviderListener(mediaController: MediaController): AllProviderEventsListener {
    return function<E extends keyof AllProviderEvents>(type: E, data: AllProviderEvents[E]): void {
        const mediaModel: MediaModel = mediaController.mediaModel;
        const event: AllProviderEvents[E] & { type: E } = Object.assign({}, data, {
            type: type
        });

        switch (type) {
            case MEDIA_TYPE:
                if (mediaModel.get(MEDIA_TYPE) === (event as ProviderEvents['mediaType']).mediaType) {
                    return;
                }
                mediaModel.set(MEDIA_TYPE, (event as ProviderEvents['mediaType']).mediaType);
                break;
            case MEDIA_VISUAL_QUALITY:
                mediaModel.set(MEDIA_VISUAL_QUALITY, Object.assign({}, data));
                return;
            case MEDIA_MUTE:
                // Only forward and queue mute changes
                if (data[MEDIA_MUTE] === mediaController.model.getMute()) {
                    return;
                }
                break;
            case PLAYER_STATE: {
                const { newstate } = data as ProviderEvents['state'];
                if (newstate === STATE_IDLE) {
                    mediaController.thenPlayPromise.cancel();
                    mediaModel.srcReset();
                }
                // Always fire change:mediaState to keep player model in sync
                const previousState = mediaModel.attributes.mediaState;
                mediaModel.attributes.mediaState = newstate;
                mediaModel.trigger('change:mediaState', mediaModel, newstate, previousState);
                break;
            }
            case MEDIA_COMPLETE:
                mediaController.beforeComplete = true;
                mediaController.trigger(MEDIA_BEFORECOMPLETE, event);
                if (mediaController.attached && !mediaController.background) {
                    mediaController._playbackComplete();
                }
                return;
            case MEDIA_ERROR:
                if (mediaModel.get('setup')) {
                    mediaController.thenPlayPromise.cancel();
                    mediaModel.srcReset();
                } else {
                    // A MEDIA_ERROR received before setup is a preload error
                    // We stop propagation here allow the player to try loading once more when playback is initiated
                    // MEDIA_ERROR codes are in the 200,000 range; adding 100,000 puts it in the 300,000 warning range.
                    type = WARNING as E;
                    (event as PlayerError).code += 100000;
                }
                break;
            case MEDIA_META: {
                const { duration, metadataType, seekRange } = data as ProviderEvents['meta'];
                if (!metadataType) {
                    (event as ProviderEvents['meta']).metadataType = 'unknown';
                }
                if (isValidNumber(duration)) {
                    mediaModel.set('seekRange', seekRange);
                    mediaModel.set('duration', duration);
                }
                break;
            }
            case MEDIA_BUFFER:
                mediaModel.set('buffer', (data as ProviderEvents['bufferChange']).bufferPercent);
                /* falls through to update duration while media is loaded */
            case MEDIA_TIME: {
                const timeData = data as ProviderEvents['time'] | ProviderEvents['bufferChange'];
                mediaModel.set('seekRange', timeData.seekRange);
                mediaModel.set('position', timeData.position);
                mediaModel.set('currentTime', timeData.currentTime);
                const duration = timeData.duration;
                if (isValidNumber(duration)) {
                    mediaModel.set('duration', duration);
                }
                if (type === MEDIA_TIME && isNumber(mediaController.item.starttime)) {
                    delete mediaController.item.starttime;
                }
                break;
            }
            case MEDIA_SEEKED: {
                // After seeking, if the video tag is in a paused state, update the player state to "paused"
                const { mediaElement } = mediaController;
                if (mediaElement && mediaElement.paused) {
                    mediaModel.set('mediaState', 'paused');
                }
                break;
            }
            case MEDIA_LEVELS:
                mediaModel.set(MEDIA_LEVELS, (data as ProviderEvents['levels']).levels);
                /* falls through to update current level */
            case MEDIA_LEVEL_CHANGED: {
                const { currentQuality, levels } = data as ProviderEvents['levelsChanged'];
                if (currentQuality > -1 && levels.length > 1) {
                    mediaModel.set('currentLevel', parseInt(currentQuality as any));
                }
                break;
            }
            case AUDIO_TRACKS:
                mediaModel.set(AUDIO_TRACKS, (data as ProviderEvents['audioTracks']).tracks);
                /* falls through to update current track */
            case AUDIO_TRACK_CHANGED: {
                const { currentTrack, tracks } = data as ProviderEvents['audioTrackChanged'];

                if (currentTrack > -1 && tracks.length > 0 && currentTrack < tracks.length) {
                    mediaModel.set('currentAudioTrack', parseInt(currentTrack as any));
                }
                break;
            }
            default:
                break;
        }

        mediaController.trigger(type, event);
    };
}

type AllMediaEventsListener = <E extends keyof AllProviderEventsListener>(type: E, data: AllProviderEventsListener[E] & { type: E }) => void;

export function MediaControllerListener(model: Model): AllMediaEventsListener {
    return function<E extends keyof AllProviderEventsListener>(this: ProgramController, type: E, event: AllProviderEventsListener[E] & { type: E }): void {
        switch (type) {
            case PLAYER_STATE:
                // This "return" is important because
                //  we are choosing to not propagate model event.
                //  Instead letting the master controller do so
                return;
            case 'flashThrottle':
            case 'flashBlocked':
                model.set(type, (event as ProviderEvents['flashBlocked']).value);
                return;
            case MEDIA_VOLUME:
                model.set(MEDIA_VOLUME, event[MEDIA_VOLUME]);
                return;
            case MEDIA_MUTE:
                model.set(MEDIA_MUTE, event[MEDIA_MUTE]);
                return;
            case MEDIA_RATE_CHANGE:
                model.set('playbackRate', (event as ProviderEvents['ratechange']).playbackRate);
                return;
            case MEDIA_META: {
                Object.assign(model.get('itemMeta'), (event as ProviderEvents['meta']).metadata);
                break;
            }
            case MEDIA_LEVEL_CHANGED:
                model.persistQualityLevel((event as ProviderEvents['levelsChanged']).currentQuality,
                    (event as ProviderEvents['levelsChanged']).levels);
                break;
            case SUBTITLES_TRACK_CHANGED:
                model.persistVideoSubtitleTrack((event as ProviderEvents['subtitlesTrackChanged']).currentTrack,
                    (event as ProviderEvents['subtitlesTrackChanged']).tracks);
                break;
            case MEDIA_TIME:
            case MEDIA_SEEK:
            case MEDIA_SEEKED:
            case NATIVE_FULLSCREEN:
            case SUBTITLES_TRACKS:
            case 'subtitlesTracksData':
                model.trigger(type, event);
                break;
            case BANDWIDTH_ESTIMATE: {
                model.persistBandwidthEstimate((event as ProviderEvents['bandwidthEstimate']).bandwidthEstimate);
                return;
            }
            default:
        }

        this.trigger(type, event);
    };
}
