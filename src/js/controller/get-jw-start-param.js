/**
 * Get the value of a jw_start query parameter given a query parameter string.
 * NOTE: This was added for ie 11 support, once we drop ie 11 we should use
 * URL and URLSearchParams.
 *
 * @param {string} search
 *                 The query parameter string
 *
 * @return {number} the jw_start value or -1 if there isn't one.
 */
const getJwStartQueryParam = function(search) {
    // search for jw_start query parameter
    const params = (search || '').replace(/^\?/, '').split('&');
    let jwStartIndex = -1;

    for (let i = 0; i < params.length; i++) {
        if ((/^jw_start=/).test(params[i])) {
            jwStartIndex = i;
            break;
        }
    }

    // no jw_start query parameter
    if (jwStartIndex === -1) {
        return -1;
    }

    const value = parseFloat(params[jwStartIndex].replace('jw_start=', ''));

    // only return valid parsed values
    if (typeof value !== 'number' || isNaN(value) || value < 0) {
        return -1;
    }

    return value;
};

export default getJwStartQueryParam;
