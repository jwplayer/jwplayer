import { sanitizeElementAttributes, sanitizeScriptNodes } from 'utils/dom';

let parser: DOMParser;

export default function svgParse(svgXml: string): XMLDocument {
    if (!parser) {
        parser = new DOMParser();
    }

    return sanitizeElementAttributes(sanitizeScriptNodes(parser.parseFromString(svgXml, 'image/svg+xml').documentElement));
}
