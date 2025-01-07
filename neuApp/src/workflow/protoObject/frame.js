import { Bounds, Container, Graphics, Sprite } from "pixi.js";

export class FrameMask extends Graphics{
  constructor(){
    super();
  }
}

export class Frame extends Container{
  constructor(){
    super();
    this.children = [];
    this.initContent();
  }
  initContent(){
    const content = new Container();
    this.innerMask = new FrameMask();
    this.innerMask.rect(0, 0, 1, 1);
    this.innerMask.fill({color:0xffffff, alpha:1});
    this.bg = new Graphics();
    this.bg.rect(0, 0, 1, 1);
    this.bg.fill({color:0xffffff, alpha:1});
    this.addChild(this.bg, this.innerMask, content);
    this.content = content;
    this.content.mask = this.innerMask;
  }
  getBounds(...args){
    if(this.innerMask){
      let g = this.innerMask.getGlobalPosition();
      return new Bounds(g.x, g.y, g.x + this.innerMask.width, g.y + this.innerMask.height);
    }
    return super.getBounds(...args);
  }
  get width(){
    if(!this.innerMask) return 0;
    return this.innerMask.width;
  }
  set width(w){
    this.bg.width = this.innerMask.width = w;
    
  }
  get height(){
    if(!this.innerMask) return 0;
    return this.innerMask.height;
  }
  set height(h){
    this.bg.height = this.innerMask.height = h;
  }
  _getChildren(){
    if(this.content) return this.content.children;
    return this.children;
  }
  addChild(...args){
    if(this.content){
      return this.content.addChild(...args)
    }
    super.addChild(...args);
  }
  removeChild(...args){
    if(this.content){
      return this.content.removeChild(...args)
    }
    super.removeChild(...args);
  }
}