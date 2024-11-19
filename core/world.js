import ev from "./ev.js";
import GameObject from "./gameObject.js";

/**
 * @abstract
 */
class World extends GameObject{
  constructor() {
    super();
  }

  adapt(width, height){
    
  }
}

export default World;