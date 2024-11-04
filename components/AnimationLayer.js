import { Container, Rectangle, Sprite, Texture } from "pixi.js";
import { Component } from "../core/Entity";
import { BaseContainer, BaseSprite } from "./displayObject";

class AnimationLayer extends Component{
  constructor(animationDescription){
    super();
    this.player = new BaseSprite();
    this._des = animationDescription;
    this._current = null;
    this._pause = false;
  }

  get current(){
    return this._des.get(this._current);
  }
  set current(id){
    if(this._current != id){
      this._current = id;
      this.play(id);
    }
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

  update(delta){
    super.update(delta);
    let current = this.current;
    if(!current) return;
    if(this._pause) return;
    this._updateReset();
    this._updateTexture();
    this._updateAnimation(delta);
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
