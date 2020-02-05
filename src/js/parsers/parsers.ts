import { trim } from 'utils/strings';

type PageNode = HTMLElement & {
    baseName: string;
    text: string;
};

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

export function getChildNode(parent: PageNode, index: number): ChildNode {
    return parent.childNodes[index];
}

export function numChildren(parent: PageNode): number {
    if (parent.childNodes) {
        return parent.childNodes.length;
    }
    return 0;
}
