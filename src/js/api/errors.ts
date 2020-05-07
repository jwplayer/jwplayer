import { isValidNumber } from 'utils/underscore';

export type ErrorCode = number;

export type ErrorKey = string;

/** @module */

/**
 * @enum {ErrorCode} Base code for a setup failure.
 **/
export const SETUP_ERROR_UNKNOWN = 100000;

/**
 * @enum {ErrorCode} Setup failed because it took longer than 30 seconds.
 */
export const SETUP_ERROR_TIMEOUT = 100001;

/**
 * @enum {ErrorCode} Setup failed because the setup promise result was undefined.
 * This could be caused by 3rd party JavaScript interfering with native promises or an incomplete promise polyfill.
 */
export const SETUP_ERROR_PROMISE_API_CONFLICT = 100002;

/**
 * @enum {ErrorCode} Setup failed because a core module failed to load.
 */
export const SETUP_ERROR_LOADING_CORE_JS = 101000;

/**
 * @enum {ErrorCode} Setup failed because the playlist failed to load.
 */
export const SETUP_ERROR_LOADING_PLAYLIST = 102000;

/**
 * @enum {ErrorCode} An exception occurred while completing player setup.
 */
export const ERROR_COMPLETING_SETUP = 200001;

/**
 * @enum {ErrorCode} Playback stopped because the playlist failed to load.
 */
export const ERROR_LOADING_PLAYLIST = 202000;

/**
 * @enum {ErrorCode} Setup failed because the initial provider failed to load.
 */
export const SETUP_ERROR_LOADING_PROVIDER = 104000;

/**
 * @enum {ErrorCode} An error occurred when switching playlist items.
 */
export const ERROR_LOADING_PLAYLIST_ITEM = 203000;

/**
 * @enum {ErrorCode} The current playlist item has no source media.
 */
export const ERROR_PLAYLIST_ITEM_MISSING_SOURCE = 203640;

/**
 * @enum {ErrorCode} Between playlist items, the required provider could not be loaded.
 */
export const ERROR_LOADING_PROVIDER = 204000;

/**
 * @enum {ErrorCode} An error occurred duing Flash setup.
 */
export const FLASH_SETUP_ERROR = 210001;

/**
 * @enum {ErrorCode} An error occurred during Flash playback.
 */
export const FLASH_ERROR = 210000;

/**
 * @enum {ErrorCode} A media error occurred during Flash playback.
 */
export const FLASH_MEDIA_ERROR = 214000;

/**
 * @enum {ErrorCode} The play attempt failed for unknown reasons.
 */
const PLAY_ATTEMPT_FAILED_MISC = 303200;

/**
 * @enum {ErrorCode} The play attempt was interrupted for unknown reasons.
 */
const PLAY_ATTEMPT_FAILED_ABORT = 303210;

/**
 * @enum {ErrorCode} The play attempt was interrupted by a new load request.
 */
const PLAY_ATTEMPT_FAILED_ABORT_LOAD = 303212;

/**
 * @enum {ErrorCode} The play attempt was interrupted by a call to pause().
 */
const PLAY_ATTEMPT_FAILED_ABORT_PAUSE = 303213;

/**
 * @enum {ErrorCode} The play attempt failed because the user didn't interact with the document first.
 */
const PLAY_ATTEMPT_FAILED_NOT_ALLOWED = 303220;

/**
 * @enum {ErrorCode} The play attempt failed because no supported source was found.
 */
const PLAY_ATTEMPT_FAILED_NOT_SUPPORTED = 303230;

/**
 * @enum {ErrorKey}
 */
export const ERROR_LOADING_CAPTIONS = 306000;

/**
 * @enum {ErrorKey}
 */
export const ERROR_LOADING_TRANSLATIONS = 308000;

/**
 * @enum {ErrorKey}
 */
export const ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE = 308640;

/**
 * @enum {ErrorKey}
 */
export const MSG_CANT_PLAY_VIDEO = 'cantPlayVideo';

/**
 * @enum {ErrorKey}
 */
export const MSG_BAD_CONNECTION = 'badConnection';

/**
 * @enum {ErrorKey}
 */
export const MSG_CANT_LOAD_PLAYER = 'cantLoadPlayer';

/**
 * @enum {ErrorKey}
 */
export const MSG_CANT_PLAY_IN_BROWSER = 'cantPlayInBrowser';

/**
 * @enum {ErrorKey}
 */
export const MSG_LIVE_STREAM_DOWN = 'liveStreamDown';

/**
 * @enum {ErrorKey}
 */
export const MSG_PROTECTED_CONTENT = 'protectedContent';

/**
 * @enum {ErrorKey}
 */
export const MSG_TECHNICAL_ERROR = 'technicalError';

/**
 * Class used to create "setupError" and "error" event instances.
 * @class PlayerError
 * @param {message} string - The error message.
 * @param {code} [ErrorCode] - The error code.
 * @param {sourceError} [Error] - The lower level error, caught by the player, which resulted in this error.
 */
export class PlayerError {
    message?: string;
    key?: ErrorKey;
    code: ErrorCode;
    sourceError: PlayerError | Error | MediaError | null;

    constructor(key: ErrorKey | null, code: ErrorCode, sourceError?: PlayerError | Error | MediaError | null) {
        this.code = isValidNumber(code) ? code : 0;
        this.sourceError = sourceError || null;
        if (key) {
            this.key = key;
        }
    }

    static logMessage(code: ErrorCode): string {
        const suffix = code % 1000;
        const prefix = Math.floor((code - suffix) / 1000);
        let codeStr = code.toString();

        if (suffix >= 400 && suffix < 600) {
            codeStr = `${prefix}400-${prefix}599`;
        }

        // Warnings are in the 3xx,xxx range
        const isWarning = code > 299999 && code < 400000;
        return `JW Player ${isWarning ? 'Warning' : 'Error'} ${code}. For more information see https://developer.jwplayer.com/jw-player/docs/developer-guide/api/errors-reference#${codeStr}`;
    }
}

export function convertToPlayerError(key: ErrorKey | null, code: ErrorCode, error: PlayerError | Error): PlayerError {
    if (!(error instanceof PlayerError) || !error.code) {
        // Transform any unhandled error into a PlayerError so emitted events adhere to a uniform structure
        return new PlayerError(key, code, error);
    }
    return error;
}

export function composePlayerError(error: PlayerError | Error, superCode: number): PlayerError {
    const playerError = convertToPlayerError(MSG_TECHNICAL_ERROR, superCode, error);
    playerError.code = (error && (error instanceof PlayerError) && error.code || 0) + superCode;
    return playerError;
}

export function getPlayAttemptFailedErrorCode(error: Error): ErrorCode {
    const { name, message } = error;
    switch (name) {
        case 'AbortError':
            if (/pause/.test(message)) {
                return PLAY_ATTEMPT_FAILED_ABORT_PAUSE;
            } else if (/load/.test(message)) {
                return PLAY_ATTEMPT_FAILED_ABORT_LOAD;
            }
            return PLAY_ATTEMPT_FAILED_ABORT;
        case 'NotAllowedError':
            return PLAY_ATTEMPT_FAILED_NOT_ALLOWED;
        case 'NotSupportedError':
            return PLAY_ATTEMPT_FAILED_NOT_SUPPORTED;
        default:
            return PLAY_ATTEMPT_FAILED_MISC;
    }
}
