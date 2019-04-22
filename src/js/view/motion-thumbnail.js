export default (thumbnailUrl) => {
    let element;
    if (thumbnailUrl) {
        if (thumbnailUrl.slice(thumbnailUrl.length - 3, thumbnailUrl.length) === 'mp4') {
            element = `video muted playsinline onmouseover="this.play()" onmouseleave="this.pause(); this.currenttime = 0;"`;
        } else {
            element = `img`;
        }
        return `<${element} class="jw-motion-thumbnail jw-reset" src="${thumbnailUrl}">`;
    }
    return '';
};
