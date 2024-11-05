import { Container, Loader, Sprite, Text } from "pixi.js";

class BaseContainer extends Container{
  constructor(){
    super(...arguments);
  }

}

class BaseSprite extends Sprite{
  constructor(){
    super(...arguments);
  }


}

class BaseText extends Text{
  constructor(){
    super(...arguments);
  }


}

export { BaseContainer, BaseSprite, BaseText }

