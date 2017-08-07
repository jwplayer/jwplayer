import { trim } from 'utils/strings';

export function localName(node) {
    let name = '';
    if (node) {
        if (node.localName) {
            name = node.localName;
        } else if (node.baseName) {
            name = node.baseName;
        }
    }
    return name;
}

export function textContent(node) {
    let text = '';
    if (node) {
        if (node.textContent) {
            text = trim(node.textContent);
        } else if (node.text) {
            text = trim(node.text);
        }
    }

    return text;
}

export function getChildNode(parent, index) {
    return parent.childNodes[index];
}

export function numChildren(parent) {
    if (parent.childNodes) {
        return parent.childNodes.length;
    }
    return 0;
}
