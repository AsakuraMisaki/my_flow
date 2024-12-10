class HtmlAdaption{
  constructor(htmlElement, targetCanvas){
    this.htmlElement = htmlElement;
    this.targetCanvas = targetCanvas;
    this.cssText = null;
  }
  record(){
    this.cssText = this.htmlElement.style.cssText;
  }
  recover(htmlElement = this.htmlElement){
    this.cssText ? htmlElement.style.cssText = this.cssText : null;
  }
  targetCss(x, y, width, height, scale){
    let base = `position:absolute;z-Index:999999;`;
    
  }
  adapt(){
    if(arguments.length == 1){
      return this._adaptAuto(arguments[0]);
    }
    else if(arguments.length == 4){
      return this._adaptCustom(...arguments);
    }
  }
  adaptBase(){
    let rect = targetCanvas.getClientRects();
    let 
  }
  _adaptAuto(displayObject){
    
  }
  _adaptCustom(x, y, width, height){

  }
}