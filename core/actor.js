import { Container, Sprite } from "pixi.js";
import GameObject from "./Entity";

class Actor extends GameObject{
  constructor() {
    super();
    this._animations = new Map();
    this.setupDisplayObject();
  }

  get renderable(){
    return this._renderable;
  }
  set renderable(value){
    this._renderable = (value == true);
  }
  get visible(){
    return this._visible;
  }
  set visible(value){
    this._visible = (value == true);
  }

  setupDisplayObject() {
    let sprite = new Actor_Base_Sprite();
  }

  addAnimation(){
    
  }

  deleteAnimation(){
    
  }

  startAnimation(){

  }

  _updateAnimation(){

  }

  onUpdate(delta) {
    super.onUpdate(delta);
    this._updateDisplayObject(delta);
  }

  _updateDisplayObject(delta){
    this.displayObject.transform = this._transform;
    this.displayObject.update ? this.displayObject.update(delta) : null;
  }
}

class Actor_Base_Sprite extends Sprite{
  constructor(){
    super(...arguments);
    this._textures = new Map();
  }

  update(delta){

  }
}

export default Actor;