export default (thumbnailUrl) => {
    let element;
    if (thumbnailUrl) {
        let itemClass = 'jw-motion-thumbnail-gif';
        if (thumbnailUrl.slice(thumbnailUrl.length - 3, thumbnailUrl.length) !== 'gif') {
            itemClass = 'jw-motion-thumbnail-video';
            element = `video muted playsinline onmouseover="this.play()" onmouseleave="this.pause(); this.currenttime = 0;"`;
        } else {
            element = `img`;
        }
        return `<${element} class="jw-motion-thumbnail jw-reset ${itemClass}" src="${thumbnailUrl}"></${element}>`;
    }
    return '';
};
