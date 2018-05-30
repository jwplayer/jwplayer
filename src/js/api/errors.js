import { isValidNumber } from 'utils/underscore';
/**
 * @type {ErrorCode} Base code for a setup failure.
 **/
export const SETUP_ERROR_UNKNOWN = 100000;

/**
 * @type {ErrorCode} Setup failed because it took longer than 30 seconds.
 */
export const SETUP_ERROR_TIMEOUT = 100001;

/**
 * @enum {ErrorCode} Setup failed because no license key was found.
 */
export const SETUP_ERROR_LICENSE_MISSING = 100011;

/**
 * @enum {ErrorCode} Setup failed because the license key was invalid.
 */
export const SETUP_ERROR_LICENSE_INVALID = 100012;

/**
 * @enum {ErrorCode} Setup failed because the license key expired.
 */
export const SETUP_ERROR_LICENSE_EXPIRED = 100013;

/**
 * @enum {ErrorCode} Setup failed because a core module failed to load.
 */
export const SETUP_ERROR_LOADING_CORE_JS = 101000;

/**
 * @enum {ErrorCode} Setup failed because the playlist failed to load.
 */
export const SETUP_ERROR_LOADING_PLAYLIST = 102000;

/**
 * @enum {ErrorCode} Playback stopped because the playlist failed to load.
 */
export const ERROR_LOADING_PLAYLIST = 202000;

/**
 * @enum {ErrorCode} Setup failed because the initial provider failed to load.
 */
export const SETUP_ERROR_LOADING_PROVIDER = 104000;

/**
 * @enum {ErrorCode} Between playlist items, the required provider could not be loaded be.
 */
export const ERROR_LOADING_PLAYLIST_ITEM = 203000;

/**
 * @enum {ErrorCode} Using the load API, the required provider could not be loaded.
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
 * Class used to create "setupError" and "error" event instances.
 * @class PlayerError
 * @param {message} string - The error message.
 * @param {code} [ErrorCode] - The error code.
 * @param {sourceError} [Error] - The lower level error, caught by the player, which resulted in this error.
 */
export class PlayerError {
    constructor(message, code, sourceError = null) {
        this.code = isValidNumber(code) ? code : 0;
        this.message = message;
        this.sourceError = sourceError;
    }

    static logMessage(code) {
        const suffix = code % 1000;
        const prefix = Math.floor((code - suffix) / 1000);
        let codeStr = code;

        if (suffix >= 400 && suffix < 600) {
            codeStr = `${prefix}400-${prefix}599`;
        }
        return `JW Player Error ${code}. For more information see https://developer.jwplayer.com/jw-player/docs/developer-guide/api/errors-reference#${codeStr}`;
    }

    static compose(code, superCode) {
        return (code || 0) + superCode;
    }
}
