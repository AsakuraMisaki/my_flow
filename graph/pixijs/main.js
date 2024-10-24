
import { LGraph, LGraphCanvas, LiteGraph } from "litegraph.js";
import * as E from "./type_el.js"
import * as R from "./type_reflect.js"
import * as B from "./type_el.js"
import * as F from "./type_feature.js"

console.warn(F);
function register(m){
  m = m.default || m;
  for(let key in m){
    let data = m[key];
    console.log(data);
    if(typeof(data) == 'function' && data.title){
      LiteGraph.registerNodeType(`${data.ctxgroup || m.ctx.group}/${data.title.toLowerCase()}`, data);
    }
  }
}

register(E)
register(R)
register(B)
register(F)

// export { el, reflect, register }