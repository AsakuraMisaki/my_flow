import { Container } from "pixi.js";
import Component from "../core/component.js";

class ActorContainer extends Component{
  constructor(parent){
    super(parent);
    this.container = new Container();
  }

  main(){
    return this.container;
  }
}
