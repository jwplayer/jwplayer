import ApiSettings from 'api/api-settings';

export function tryCatch(fn, ctx, args = []) {
    // In debug mode, allow `fn` to throw exceptions
    if (ApiSettings.debug) {
        return fn.apply(ctx || this, args);
    }

    // else catch exceptions and return a `JWError`
    try {
        return fn.apply(ctx || this, args);
    } catch (e) {
        return new JwError(fn.name, e);
    }
}

export function JwError(name, error) {
    this.name = name;
    this.message = error.message || error.toString();
    this.error = error;
}
