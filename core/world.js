import ev from "./ev";
import GameObject from "./gameObject";

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