import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js";
import { Component } from "../core/Entity";
import { BaseContainer, BaseSprite } from "./displayObject";

class AnimationLayer extends Component{
  constructor(animationDescription){
    super();
    this.setup(animationDescription);
  }

  async setup(animationDescription){
    let des = await Assets.load(animationDescription);
    this.setupAnimationDescription(des);
    super.setup();
  }
  setupAnimationDescription(des){

  }

  get player(){
    return this.E;
  }

  get current(){
    return this.animationDescription.get(this._current);
  }
  set current(id){
    if(this._current != id){
      this._current = id;
      this.play(id);
    }
  }

  blend(b, time){

  }

  play(id = this._current){
    if(!id) return;
    this._reset = true;
  }

  resume(){
    this._pause = false;
  }

  pause(){
    this._pause = true;
  }

  onUpdate(delta){
    if(!this.animationDescription) return;
    let current = this.current;
    if(!current) return;
    this._updateReset();
    this._updateTexture();
    this._updateAnimation(delta);
    super.onUpdate(delta);
  }

  _updateTexture(){
    if(this.player.texture != this.current.texture){
      this.player.texture = this.current.texture;
    }
  }

  _updateReset(){
    if(this._reset){
      this.player.frame = new Rectangle(0);
    }
  }

  _updateAnimation(){
    this._des.update();
    let state = this._des.state;
    this.player.frame = state.frame;
    this.player.x = state.x;
    this.player.y = state.y;
    this.player.scale.x = state.scale.x;
    this.player.scale.y = state.scale.y;
  }

}

class AnimationStateMachine{
  
}
