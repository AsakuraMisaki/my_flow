import { Graphics } from "pixi.js";
import { ContainerEntity } from "../core/Entity.js";

class Inputter extends ContainerEntity{
  constructor(targetWidth, targetHeight){
    super();
    this._targetWidth = targetWidth;
    this._targetHeight = targetHeight;
  }

  async ready(){
    let hinter = new Graphics();
    hinter.rect(0, -1, 3, 2);
    hinter.fill({ color:0x223344, alpha:1 });
    let texter = new Text();
    this.addChild(hinter, texter);
    let mask = new Graphics();
    mask.rect(0, 0, 1, 1);
    mask.fill({ color:0xffffff, alpha:1 });
    texter.mask = mask;
    this.innerMask = mask;
    this.addChild(mask, texter, hinter);
    this._texter = texter;
    this.hinter = hinter;
    this.focus = false;
    this.resize(this.targetWidth, this.targetHeight);
    // this.
  }

  onUpdate(delta){
    super.onUpdate(delta);
    this._updateFocus();
  }

  resize(width=this.targetWidth, height=this.targetHeight){
    this.innerMask.scale.x = width;
    this.innerMask.scale.y = height;
  }

  _updateFocus(){
    if(!this.focus) return;
    let hinter = this.hinter;
    if(hinter.alpha <= 0 && hinter.addAlpha < 0 ){
      hinter.addAlpha = -hinter.addAlpha;
    }
    else if(hinter.alpha >= 1 && hinter.addAlpha > 0 ){
      hinter.addAlpha = -hinter.addAlpha;
    }
    hinter.alpha += hinter.addAlpha;
  }

  get targetHeight(){
    return this._targetHeight;
  }
  set targetHeight(value){
    this._targetHeight = value;
    this.resize();
  }
  get targetWidth(){
    return this._targetWidth;
  }
  set targetWidth(value){
    this._targetWidth = value;
    this.resize();
  }
  get focus(){
    return this._focus;
  }
  set focus(value){
    this.hinter.alpha = 0;
    this.hinter.addAlpha = 0.5;
    return this._focus = value;
  }
  get hinter(){
    return this._hinter;
  }
  set hinter(displayObject){
    return this._hinter = displayObject;
  }
  get texter(){
    return this._texter;
  }
  get value(){
    return this.texter.text;
  }
  set value(v){
    this.texter.text = v;
  }
  get style(){
    return this.texter.style;
  }
}