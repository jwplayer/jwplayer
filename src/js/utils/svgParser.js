let parser;

export default function svgParse(svgXml) {
    if (!parser) {
        parser = new DOMParser();
    }

    return parser.parseFromString(svgXml, 'image/svg+xml').documentElement;
}
