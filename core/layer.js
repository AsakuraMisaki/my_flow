import { Application, Assets, Texture } from "pixi.js";
import { BaseSprite } from "../components/displayObject";
import { ContainerEntity, Entity } from "./Entity";
import { Drag } from "../components/ItemDrag";
import { Drop } from "../components/drop";

class Layer extends ContainerEntity{
  constructor(){
    super();
  }

  async onReady(){
    const texture = await Assets.load("../res/icons.svg");
    this.test = new BaseSprite(texture);
    this.addChild(this.test);
    // this.test.scale.x = this.test.scale.y = 10;
  }
}

export { Layer };