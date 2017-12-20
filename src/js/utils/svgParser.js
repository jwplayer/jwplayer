const parser = new DOMParser();

export default function svgParse(svgXml) {
    return parser.parseFromString(svgXml, 'image/svg+xml').documentElement;
}
