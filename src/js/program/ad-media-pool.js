import MediaElementPool from 'program/media-element-pool';
const mediaPool = MediaElementPool();
export default function AdMediaPool(adElement) {
    let elements = [adElement];

    return Object.assign({}, mediaPool, {
        prime() {},
        recycle() {},
        getPrimedElement() {
            return elements[0];
        },
        changePrimedElement(newElement) {
            elements[0] = newElement;
        }
    });
}
