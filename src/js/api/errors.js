import { isValidNumber } from 'utils/underscore';
/**
 * @typedef {number} ErrorCode
 * @module errors
 **/

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
 * Class representing the jwplayer() API.
 * Creates an instance of the player.
 * @class PlayerError
 * @param {message} string - The error message.
 * @param {code} [ErrorCode] - The error code.
 * @param {sourceError} [Error] - The lower level error, caught by the player, which resulted in this error.
 */
export class PlayerError extends Error {
    constructor(message, code, sourceError) {
        super(message);
        this.code = isValidNumber(code) ? code : null;
        this.sourceError = sourceError || null;
    }
}
