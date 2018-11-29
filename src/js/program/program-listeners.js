import { isValidNumber, isNumber } from 'utils/underscore';
import { PLAYER_STATE, STATE_IDLE, MEDIA_VOLUME, MEDIA_MUTE,
    MEDIA_TYPE, AUDIO_TRACKS, AUDIO_TRACK_CHANGED,
    MEDIA_RATE_CHANGE, MEDIA_BUFFER, MEDIA_TIME, MEDIA_LEVELS, MEDIA_LEVEL_CHANGED, MEDIA_ERROR,
    MEDIA_BEFORECOMPLETE, MEDIA_COMPLETE, MEDIA_META, MEDIA_SEEK, MEDIA_SEEKED,
    NATIVE_FULLSCREEN, MEDIA_VISUAL_QUALITY, BANDWIDTH_ESTIMATE, WARNING } from 'events/events';

export function ProviderListener(mediaController) {
    return function (type, data) {
        const { mediaModel } = mediaController;
        const event = Object.assign({}, data, {
            type: type
        });

        switch (type) {
            case MEDIA_TYPE:
                if (mediaModel.get(MEDIA_TYPE) === data.mediaType) {
                    return;
                }
                mediaModel.set(MEDIA_TYPE, data.mediaType);
                break;
            case MEDIA_VISUAL_QUALITY:
                mediaModel.set(MEDIA_VISUAL_QUALITY, Object.assign({}, data));
                return;
            case MEDIA_MUTE:
                // Only forward and queue mute changes
                if (data[type] === mediaController.model.getMute()) {
                    return;
                }
                break;
            case PLAYER_STATE: {
                if (data.newstate === STATE_IDLE) {
                    mediaController.thenPlayPromise.cancel();
                    mediaModel.srcReset();
                }
                // Always fire change:mediaState to keep player model in sync
                const previousState = mediaModel.attributes.mediaState;
                mediaModel.attributes.mediaState = data.newstate;
                mediaModel.trigger('change:mediaState', mediaModel, data.newstate, previousState);
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
                    type = WARNING;
                    event.code += 100000;
                }
                break;
            case MEDIA_META: {
                if (!event.metadataType) {
                    event.metadataType = 'unknown';
                }
                const duration = data.duration;
                if (isValidNumber(duration)) {
                    mediaModel.set('seekRange', data.seekRange);
                    mediaModel.set('duration', duration);
                }
                break;
            }
            case MEDIA_BUFFER:
                mediaModel.set('buffer', data.bufferPercent);
                /* falls through to update duration while media is loaded */
            case MEDIA_TIME: {
                mediaModel.set('seekRange', data.seekRange);
                mediaModel.set('position', data.position);
                mediaModel.set('currentTime', data.currentTime);
                const duration = data.duration;
                if (isValidNumber(duration)) {
                    mediaModel.set('duration', duration);
                }
                if (type === MEDIA_TIME && isNumber(mediaController.item.starttime)) {
                    delete mediaController.item.starttime;
                }
                break;
            }
            case MEDIA_LEVELS:
                mediaModel.set(MEDIA_LEVELS, data.levels);
                /* falls through to update current level */
            case MEDIA_LEVEL_CHANGED: {
                const { currentQuality, levels } = data;
                if (currentQuality > -1 && levels.length > 1) {
                    mediaModel.set('currentLevel', parseInt(currentQuality));
                }
                break;
            }
            case AUDIO_TRACKS:
                mediaModel.set(AUDIO_TRACKS, data.tracks);
                /* falls through to update current track */
            case AUDIO_TRACK_CHANGED: {
                const { currentTrack, tracks } = data;

                if (currentTrack > -1 && tracks.length > 0 && currentTrack < tracks.length) {
                    mediaModel.set('currentAudioTrack', parseInt(currentTrack));
                }
                break;
            }
            default:
                break;
        }

        mediaController.trigger(type, event);
    };
}

export function MediaControllerListener(model, programController) {
    return function (type, data) {
        switch (type) {
            case PLAYER_STATE:
                // This "return" is important because
                //  we are choosing to not propagate model event.
                //  Instead letting the master controller do so
                return;
            case 'flashThrottle':
            case 'flashBlocked':
                model.set(type, data.value);
                return;
            case MEDIA_VOLUME:
                model.set(type, data[type]);
                return;
            case MEDIA_MUTE:
                model.set(type, data[type]);
                return;
            case MEDIA_RATE_CHANGE:
                model.set('playbackRate', data.playbackRate);
                return;
            case MEDIA_META: {
                Object.assign(model.get('itemMeta'), data.metadata);
                break;
            }
            case MEDIA_LEVEL_CHANGED:
                model.persistQualityLevel(data.currentQuality, data.levels);
                break;
            case 'subtitlesTrackChanged':
                model.persistVideoSubtitleTrack(data.currentTrack, data.tracks);
                break;
            case MEDIA_TIME:
            case MEDIA_SEEK:
            case MEDIA_SEEKED:
            case NATIVE_FULLSCREEN:
            case 'subtitlesTracks':
            case 'subtitlesTracksData':
                model.trigger(type, data);
                break;
            case BANDWIDTH_ESTIMATE: {
                model.persistBandwidthEstimate(data.bandwidthEstimate);
                return;
            }
            default:
        }

        programController.trigger(type, data);
    };
}
