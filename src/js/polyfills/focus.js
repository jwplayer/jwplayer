// focus - focusOptions - preventScroll polyfill
(function() {
    if (
        typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      typeof HTMLElement === 'undefined'
    ) {
        return;
    }
  
    let supportsPreventScrollOption = false;
    try {
        let focusElem = document.createElement('div');
        focusElem.addEventListener(
            'focus',
            function(event) {
                event.preventDefault();
                event.stopPropagation();
            },
            true
        );
        focusElem.focus(
            Object.defineProperty({}, 'preventScroll', {
                get: function() {
                    supportsPreventScrollOption = true;
                }
            })
        );
    } catch (e) {}
  
    if (
        HTMLElement.prototype.nativeFocus === undefined &&
      !supportsPreventScrollOption
    ) {
        HTMLElement.prototype.nativeFocus = HTMLElement.prototype.focus;
  
        let calcScrollableElements = function(element) {
            let parent = element.parentNode;
            let scrollableElements = [];
            let rootScrollingElement =
          document.scrollingElement || document.documentElement;
  
            while (parent && parent !== rootScrollingElement) {
                if (
                    parent.offsetHeight < parent.scrollHeight ||
            parent.offsetWidth < parent.scrollWidth
                ) {
                    scrollableElements.push([
                        parent,
                        parent.scrollTop,
                        parent.scrollLeft
                    ]);
                }
                parent = parent.parentNode;
            }
            parent = rootScrollingElement;
            scrollableElements.push([parent, parent.scrollTop, parent.scrollLeft]);
  
            return scrollableElements;
        };
  
        let restoreScrollPosition = function(scrollableElements) {
            for (let i = 0; i < scrollableElements.length; i++) {
                scrollableElements[i][0].scrollTop = scrollableElements[i][1];
                scrollableElements[i][0].scrollLeft = scrollableElements[i][2];
            }
            scrollableElements = [];
        };
  
        let patchedFocus = function(args) {
            if (args && args.preventScroll) {
                let evScrollableElements = calcScrollableElements(this);
                this.nativeFocus();
                if (typeof setTimeout === 'function') {
                    setTimeout(function () {
                        restoreScrollPosition(evScrollableElements);
                    }, 0);
                } else {
                    restoreScrollPosition(evScrollableElements);          
                }
            } else {
                this.nativeFocus();
            }
        };
  
        HTMLElement.prototype.focus = patchedFocus;
    }
}());
