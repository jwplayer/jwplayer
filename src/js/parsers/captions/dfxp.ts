import { seconds, trim } from 'utils/strings';
import { PlayerError } from 'api/errors';
import type { CaptionEntryData } from './captions.types';

// Component that loads and parses an DFXP file

type ParagraphNodes = HTMLCollectionOf<Element & { text?: string }>;

export default function Dfxp(xmlDoc: XMLDocument): CaptionEntryData[] {
    if (!xmlDoc) {
        parseError(306007);
    }

    const _captions: CaptionEntryData[] = [];
    let paragraphs: ParagraphNodes = xmlDoc.getElementsByTagName('p');
    // Default frameRate is 30
    let frameRate = 30;
    const tt = xmlDoc.getElementsByTagName('tt');
    if (tt && tt[0]) {
        const parsedFrameRate = parseFloat(tt[0].getAttribute('ttp:frameRate') || '');
        if (!isNaN(parsedFrameRate)) {
            frameRate = parsedFrameRate;
        }
    }

    if (!paragraphs) {
        parseError(306005);
    }
    if (!paragraphs.length) {
        paragraphs = xmlDoc.getElementsByTagName('tt:p');
        if (!paragraphs.length) {
            paragraphs = xmlDoc.getElementsByTagName('tts:p');
        }
    }

    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];

        const breaks = p.getElementsByTagName('br');
        for (let j = 0; j < breaks.length; j++) {
            const b = breaks[j];
            if (b && b.parentNode) {
                b.parentNode.replaceChild(xmlDoc.createTextNode('\r\n'), b);
            }
        }

        const rawText = (p.innerHTML || p.textContent || p.text || '');
        const text = trim(rawText).replace(/>\s+</g, '><').replace(/(<\/?)tts?:/g, '$1').replace(/<br.*?\/>/g, '\r\n');
        if (text) {
            const begin = p.getAttribute('begin') || '';
            const dur = p.getAttribute('dur') || '';
            const end = p.getAttribute('end') || '';

            const entry: CaptionEntryData = {
                begin: seconds(begin, frameRate),
                text: text
            };
            if (end) {
                entry.end = seconds(end, frameRate);
            } else if (dur) {
                entry.end = (entry.begin || 0) + seconds(dur, frameRate);
            }
            _captions.push(entry);
        }
    }
    if (!_captions.length) {
        parseError(306005);
    }
    return _captions;
}

function parseError(code: number): void {
    throw new PlayerError(null, code);
}
