import ApiSettings from 'api/api-settings';

interface JWErrorInt {
    name: string;
    message: string;
    error: Error;
}

export function tryCatch(this: any, fn: Function, ctx: any, args: any[] = []): any | JWErrorInt {
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

export function JwError(this: JWErrorInt, name: string, error: Error): void {
    this.name = name;
    this.message = error.message || error.toString();
    this.error = error;
}
