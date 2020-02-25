export default function(element: HTMLElement, ariaLabel: string): void {
    if (!element || !ariaLabel) {
        return;
    }

    element.setAttribute('aria-label', ariaLabel);
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
}
