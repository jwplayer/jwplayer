import { sanitizeElementAttributes, sanitizeScriptNodes } from 'utils/dom';

let parser;

export default function svgParse(svgXml) {
    if (!parser) {
        parser = new DOMParser();
    }

    return sanitizeElementAttributes(sanitizeScriptNodes(parser.parseFromString(svgXml, 'image/svg+xml').documentElement));
}
