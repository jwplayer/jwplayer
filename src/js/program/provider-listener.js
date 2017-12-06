import { _isNaN, _isNumber } from 'utils/underscore';
import { PLAYER_STATE, STATE_IDLE, MEDIA_VOLUME, MEDIA_MUTE,
    MEDIA_TYPE, PROVIDER_CHANGED, AUDIO_TRACKS, AUDIO_TRACK_CHANGED,
    MEDIA_RATE_CHANGE, MEDIA_BUFFER, MEDIA_TIME, MEDIA_LEVELS, MEDIA_LEVEL_CHANGED, MEDIA_ERROR,
    MEDIA_BEFORECOMPLETE, MEDIA_COMPLETE, MEDIA_META, MEDIA_SEEK, MEDIA_SEEKED,
    NATIVE_FULLSCREEN } from 'events/events';

export default function ProviderListener(mediaController) {
    return function (type, data) {
        const { provider, mediaModel, model, attached } = mediaController;
        const event = Object.assign({}, data, {
            type: type
        });

        switch (type) {
            case 'flashThrottle': {
                const throttled = (data.state !== 'resume');
                model.set('flashThrottle', throttled);
                model.set('flashBlocked', throttled);
            }
                break;
            case 'flashBlocked':
                model.set('flashBlocked', true);
                return;
            case 'flashUnblocked':
                model.set('flashBlocked', false);
                return;
            case MEDIA_VOLUME:
                model.set(type, data[type]);
                return;
            case MEDIA_MUTE:
                if (!model.get('autostartMuted')) {
                    // Don't persist mute state with muted autostart
                    model.set(type, data[type]);
                }
                return;
            case MEDIA_RATE_CHANGE: {
                const rate = data.playbackRate;
                // Check if its a generally usable rate.  Shaka changes rate to 0 when pause or buffering.
                if (rate > 0) {
                    model.set('playbackRate', rate);
                }
            }
                return;
            case MEDIA_TYPE:
                if (mediaModel.get(MEDIA_TYPE) !== data.mediaType) {
                    mediaModel.set(MEDIA_TYPE, data.mediaType);
                    mediaController.trigger(type, event);
                }
                return;
            case PLAYER_STATE: {
                if (data.newstate === STATE_IDLE) {
                    mediaController.thenPlayPromise.cancel();
                    mediaModel.srcReset();
                }
                // Always fire change:mediaState to keep player model in sync
                const previousState = mediaModel.attributes.mediaState;
                mediaModel.attributes.mediaState = data.newstate;
                mediaModel.trigger('change:mediaState', mediaModel, data.newstate, previousState);
            }
                // This "return" is important because
                //  we are choosing to not propagate model event.
                //  Instead letting the master controller do so
                return;
            case MEDIA_ERROR:
                mediaController.thenPlayPromise.cancel();
                mediaModel.srcReset();
                break;
            case MEDIA_BUFFER:
                mediaModel.set('buffer', data.bufferPercent);
            /* falls through */
            case MEDIA_META: {
                const duration = data.duration;
                if (_isNumber(duration) && !_isNaN(duration)) {
                    mediaModel.set('duration', duration);
                }
                Object.assign(model.get('itemMeta'), data.metadata);
                break;
            }
            case MEDIA_TIME: {
                mediaModel.set('position', data.position);
                const duration = data.duration;
                if (_isNumber(duration) && !_isNaN(duration)) {
                    mediaModel.set('duration', duration);
                }
                model.trigger(type, data);
                break;
            }
            case PROVIDER_CHANGED:
                model.set('provider', provider.getName());
                break;
            case MEDIA_LEVELS:
                model.setQualityLevel(data.currentQuality, data.levels);
                mediaModel.set(MEDIA_LEVELS, data.levels);
                break;
            case MEDIA_LEVEL_CHANGED:
                model.setQualityLevel(data.currentQuality, data.levels);
                model.persistQualityLevel(data.currentQuality, data.levels);
                break;
            case MEDIA_COMPLETE:
                mediaController.beforeComplete = true;
                mediaController.trigger(MEDIA_BEFORECOMPLETE, event);
                if (attached) {
                    mediaController._playbackComplete();
                }
                return;
            case AUDIO_TRACKS:
                model.setCurrentAudioTrack(data.currentTrack, data.tracks);
                mediaModel.set(AUDIO_TRACKS, data.tracks);
                break;
            case AUDIO_TRACK_CHANGED:
                model.setCurrentAudioTrack(data.currentTrack, data.tracks);
                break;
            case 'subtitlesTrackChanged':
                model.persistVideoSubtitleTrack(data.currentTrack, data.tracks);
                break;
            case 'visualQuality':
                mediaModel.set('visualQuality', Object.assign({}, data));
                break;
            case MEDIA_SEEK:
            case MEDIA_SEEKED:
            case NATIVE_FULLSCREEN:
            case 'subtitlesTracks':
            case 'subtitlesTracksData':
                model.trigger(type, data);
                break;
            default:
                break;
        }

        mediaController.trigger(type, event);
    };
}
