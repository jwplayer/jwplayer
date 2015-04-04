if (window.Boundarizr)
  window.Boundarizr.kill();

window.Boundarizr = (function() {

  var boundaryContainerElement = null;
  var boundaryHideButton = null;
  var elements = null;
  var boundaries = [];

  function processElements() {

    elements = document.querySelectorAll('*');
    boundaries.length = 0;

    var element;

    for (var e = 0; e < elements.length; e++) {

      element = elements[e];

      switch (element.localName) {

        case 'script':
        case 'body':
        case 'meta':
        case 'link':
        case 'title':
        case 'head':
          continue;

        default:
          if (isBoundary(element)) {
            var boundary = element.getBoundingClientRect();
            boundary.label = element.localName;

            if (element.id)
              boundary.label += '#' + element.id;

            if (element.className)
              boundary.label += '.' + element.className.split(' ').join('.');

            boundaries.push(boundary);
          }
          break;

      }
    }
  }

  function isBoundary(element) {

    // Exclude our boundary element.
    if (element === boundaryContainerElement)
      return false;

    // Say yes to SVG roots and single-line inputs.
    if (isSVGRoot(element))
      return true;

    if (isInputTextOrSearch(element))
      return true;

    // Say no to anything with a percentage height,
    // anything without an explicit width & height,
    // anything which doesn't have an overflow property,
    // and anything which is a descendant of a table.
    if (hasPercentageHeight(element))
      return false;

    if (hasEmptyOrAutoWidth(element))
      return false;

    if (hasEmptyOrAutoHeight(element))
      return false;

    if (isNotOverflow(element))
      return false;

    if (isDescendantOfTable(element))
      return false;

    if (isDisplayInlineOrInlineBlock(element))
      return false;

    return true;
  }

  function getMatchedRuleOn(element, property) {

    var rule;
    var appliedRule = null;
    var matchedRuleProperty = '';
    var rules = window.getMatchedCSSRules(element);

    // Check on the element itself.
    if (element.style[property])
      return element.style[property];

    if (rules === null)
      return null;

    // Work backwards because the last item in the array
    // is the rule with the highest precedence.
    for (var r = rules.length - 1; r >= 0; r--) {

      rule = rules[r];
      matchedRuleProperty = rule.style[property];

      // If this rule contains the property we care
      // about stop here.
      if (matchedRuleProperty !== '') {
        appliedRule = matchedRuleProperty;
        break;
      }
    }

    return appliedRule;
  }

  function isSVGRoot(element) {
    return element.localName === 'svg';
  }

  function isInputTextOrSearch(element) {
    return (element.localName === 'input' &&
        (element.type === 'text') || (element.type === 'search'));
  }

  function hasPercentageHeight(element) {

    var appliedRule = getMatchedRuleOn(element, 'height');
    var percentageValue = /%$/;

    if (appliedRule === null)
      return false;

    return percentageValue.test(appliedRule);
  }

  function hasEmptyOrAutoWidth(element) {
    return isEmptyOrAuto(element, 'width');
  }

  function hasEmptyOrAutoHeight(element) {
    return isEmptyOrAuto(element, 'height');
  }

  function isEmptyOrAuto(element, property) {
    var appliedRule = getMatchedRuleOn(element, property);

    if (appliedRule === null)
      return true;

    return appliedRule === '' || appliedRule === 'auto';
  }

  function isNotOverflow(element) {
    var appliedRule = getMatchedRuleOn(element, 'overflow');

    if (appliedRule === null)
      return true;

    return appliedRule !== 'scroll' && appliedRule !== 'auto' &&
        appliedRule !== 'hidden';
  }

  function isDisplayInlineOrInlineBlock(element) {
    var appliedRule = getMatchedRuleOn(element, 'display');

    if (appliedRule === null)
      return false;

    return appliedRule === 'inline' || appliedRule === 'inline-block';
  }

  function isDescendantOfTable(element) {

    if (element.localName === 'html')
      return false;

    if (element.localName === 'table')
      return true;

    if (!element.parentNode)
      return false;

    return isDescendantOfTable(element.parentNode);
  }

  function createBoundaries() {
    if (!boundaryContainerElement) {
      boundaryContainerElement = document.createElement('div');
      boundaryContainerElement.style.position = 'absolute';
      boundaryContainerElement.style.top = '0';
      boundaryContainerElement.style.right = '0';
      boundaryContainerElement.style.bottom = '0';
      boundaryContainerElement.style.left = '0';
      boundaryContainerElement.style.zIndex = '10000000';

      boundaryContainerElement.style.display = 'none';

      boundaryHideButton = document.createElement('button');
      boundaryHideButton.style.position = 'fixed';
      boundaryHideButton.style.top = '10px';
      boundaryHideButton.style.left = '10px';
      boundaryHideButton.textContent = 'Hide Boundaries';
      boundaryHideButton.addEventListener('click', hideBoundaries);

      document.body.appendChild(boundaryContainerElement);
    }

    boundaryContainerElement.innerHTML = '';
    boundaryContainerElement.appendChild(boundaryHideButton);

    var boundary, boundaryElement;
    for (var b = 0; b < boundaries.length; b++) {

      boundary = boundaries[b];

      boundaryElement = document.createElement('div');
      boundaryElement.style.position = 'absolute';
      boundaryElement.style.display = 'block';
      boundaryElement.style.boxSizing = 'border-box';
      boundaryElement.style.padding = '10px';
      boundaryElement.style.overflow = 'hidden';

      // Boundary position.
      boundaryElement.style.top = boundary.top + 'px';
      boundaryElement.style.right = boundary.right + 'px';
      boundaryElement.style.bottom = boundary.bottom + 'px';
      boundaryElement.style.left = boundary.left + 'px';

      // Boundary size.
      boundaryElement.style.width = boundary.width + 'px';
      boundaryElement.style.height = boundary.height + 'px';

      // Boundary style.
      boundaryElement.style.outline = '1px solid blue';
      boundaryElement.style.background = 'rgba(0,0,255,0.1)';

      // Content.
      boundaryElement.textContent = boundary.label;

      boundaryContainerElement.appendChild(boundaryElement);
    }
  }

  function showBoundaries() {
    boundaryContainerElement.style.display = 'block';
  }

  function hideBoundaries() {
    boundaryContainerElement.style.display = 'none';
  }

  function testCurrentDocument() {
    processElements();
    createBoundaries();
    showBoundaries();
  }

  function kill() {
    if (boundaryContainerElement) {
      boundaryContainerElement.parentNode.removeChild(boundaryContainerElement);
    }
    window.Boundarizr = null;
  }

  return {
    testCurrentDocument: testCurrentDocument,
    showBoundaries: showBoundaries,
    hideBoundaries: hideBoundaries,
    kill: kill,
    tests: {
      isBoundary: isBoundary,
      isSVGRoot: isSVGRoot,
      isInputTextOrSearch: isInputTextOrSearch,
      hasPercentageHeight: hasPercentageHeight,
      hasEmptyOrAutoHeight: hasEmptyOrAutoHeight,
      hasEmptyOrAutoWidth: hasEmptyOrAutoWidth,
      isNotOverflow: isNotOverflow,
      isDescendantOfTable: isDescendantOfTable,
      isDisplayInlineOrInlineBlock: isDisplayInlineOrInlineBlock
    }
  };

})();
