// Normalize width and height ending with 'px' to numbers
export function normalizeSize(val: string): string {
    if (val.slice && val.slice(-2) === 'px') {
        val = val.slice(0, -2);
    }
    return val;
}

// Convert aspectratio from "W:H" to a percentage
export function normalizeAspectRatio(ar: string, width: number | string): string | 0 {
    if (width.toString().indexOf('%') === -1) {
        return 0;
    }
    if (typeof ar !== 'string' || !ar) {
        return 0;
    }
    if (/^\d*\.?\d+%$/.test(ar)) {
        return ar;
    }
    const index = ar.indexOf(':');
    if (index === -1) {
        return 0;
    }
    const w = parseFloat(ar.substr(0, index));
    const h = parseFloat(ar.substr(index + 1));
    if (w <= 0 || h <= 0) {
        return 0;
    }
    return (h / w * 100) + '%';
}
