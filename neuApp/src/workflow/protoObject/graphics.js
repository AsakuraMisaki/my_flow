import { Graphics } from "pixi.js";

export class _Graphics extends Graphics{
  constructor(){
    super();
    this.rect(0, 0, 1, 1);
    this.fill({color:0x9f9f9f, alpha:1});
  }
}