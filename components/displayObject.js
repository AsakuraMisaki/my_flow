import { Container, Loader, Sprite, Text } from "pixi.js";

class BaseContainer extends Container{
  constructor(){
    super(...arguments);
  }

  update(delta){
    this.children.forEach((c)=>{
      c.update ? c.update(delta) : null;
    })
  }
}

class BaseSprite extends Sprite{
  constructor(){
    super(...arguments);
  }

  update(delta){
    this.children.forEach((c)=>{
      c.update ? c.update(delta) : null;
    })
  }

}

class BaseText extends Text{
  constructor(){
    super(...arguments);
  }

  update(delta){
    this.children.forEach((c)=>{
      c.update ? c.update(delta) : null;
    })
  }

}

export { BaseContainer, BaseSprite, BaseText }

