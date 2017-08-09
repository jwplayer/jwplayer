export default function(element, ariaLabel) {
    if (!element || !ariaLabel) {
        return;
    }

    element.setAttribute('aria-label', ariaLabel);
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
}
