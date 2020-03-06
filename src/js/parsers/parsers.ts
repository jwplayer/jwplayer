import { trim } from 'utils/strings';
import type { PageNode } from 'types/generic.type';

export function localName(node: PageNode): string {
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

export function textContent(node: PageNode): string {
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

export function getChildNode(parent: PageNode, index: number): PageNode {
    return parent.childNodes[index] as PageNode;
}

export function numChildren(parent: PageNode): number {
    if (parent.childNodes) {
        return parent.childNodes.length;
    }
    return 0;
}
