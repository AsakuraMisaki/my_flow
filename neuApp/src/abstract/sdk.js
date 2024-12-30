export class SDK{
  static set PIXI(value){
    this._PIXI = value;
  }
  static get PIXI(){
    return typeof(PIXI) == "undefined" ? this._PIXI : PIXI;
  }
}
