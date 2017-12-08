import MediaElementPool from 'program/media-element-pool';
const mediaPool = MediaElementPool();
export default function AdMediaPool(adElement) {
    let elements = [adElement];

    return Object.assign({}, mediaPool, {
        prime() {
            elements[0].load();
        },
        recycle() {},
        getPrimedElement() {
            return elements[0];
        }
    });
}
