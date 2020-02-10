import { seconds, trim } from 'utils/strings';
import { CaptionEntryData } from './captions';

// Component that loads and parses an SRT file

export default function Srt(data: string): CaptionEntryData[] {
    // Trim whitespace and split the list by returns.
    const _captions: CaptionEntryData[] = [];
    data = trim(data);
    let list = data.split('\r\n\r\n');
    if (list.length === 1) {
        list = data.split('\n\n');
    }

    for (let i = 0; i < list.length; i++) {
        if (list[i] === 'WEBVTT') {
            continue;
        }
        // Parse each entry
        const entry = _entry(list[i]);
        if (entry.text) {
            _captions.push(entry);
        }
    }

    return _captions;
}


/* Parse a single captions entry. */
function _entry(data: string): CaptionEntryData {
    const entry: CaptionEntryData = {};
    let array = data.split('\r\n');
    if (array.length === 1) {
        array = data.split('\n');
    }
    let idx = 1;
    if (array[0].indexOf(' --> ') > 0) {
        idx = 0;
    }
    if (array.length > idx + 1 && array[idx + 1]) {
        // This line contains the start and end.
        const line = array[idx];
        const index = line.indexOf(' --> ');
        if (index > 0) {
            entry.begin = seconds(line.substr(0, index));
            entry.end = seconds(line.substr(index + 5));
            // Remaining lines contain the text
            entry.text = array.slice(idx + 1).join('\r\n');
        }
    }
    return entry;
}
