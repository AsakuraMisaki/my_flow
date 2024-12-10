import { Application, Assets, Texture } from "pixi.js";
import { BaseSprite } from "../components/displayObject.js";
import { ContainerEntity, Entity } from "./Entity.js";
import { Drag } from "../components/drag.js";
import { Drop } from "../components/drop.js";

class Layer extends ContainerEntity{
  constructor(){
    super();
  }

  async onReady(){
    super.onReady();
    // const texture = await Assets.load("../res/icons.svg");
    // this.test = new BaseSprite(texture);
    // this.addChild(this.test);
    // this.test.scale.x = this.test.scale.y = 10;
  }
}

export { Layer };