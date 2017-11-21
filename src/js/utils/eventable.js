import BackboneEvents from 'utils/backbone.events';

// Combine mixins into a class which can be extended
export default class Eventable {}
Eventable.prototype = Object.assign({}, BackboneEvents);
