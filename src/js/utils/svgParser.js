import { sanitizeElementAttributes } from 'utils/dom';

let parser;

export default function svgParse(svgXml) {
    if (!parser) {
        parser = new DOMParser();
    }

    return sanitizeElementAttributes(parser.parseFromString(svgXml, 'image/svg+xml').documentElement);
}
