import { Graph, Shape } from '@antv/x6'
import { Clipboard } from '@antv/x6-plugin-clipboard'
import { History } from '@antv/x6-plugin-history'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { MiniMap } from '@antv/x6-plugin-minimap'
import { Selection } from '@antv/x6-plugin-selection'
import { Snapline } from '@antv/x6-plugin-snapline'
import { Transform } from '@antv/x6-plugin-transform'

let graph = new Graph({
  container: document.getElementById('workspace'),
  grid: true,
  embedding: {
    enabled: true,
    findParent({ node }) {
      const bbox = node.getBBox()
      return this.getNodes().filter((node) => {
        const data = node.getData()
        if (data && data.parent) {
          const targetBBox = node.getBBox()
          return bbox.isIntersectWithRect(targetBBox)
        }
        return false
      })
    },
  },
  highlighting: {
    embedding: {
      name: 'stroke',
      args: {
        padding: -1,
        attrs: {
          stroke: '#73d13d',
        },
      },
    },
  },
  interacting:function(cell){
    return interactAble;
    // console.log();
    // return false;
    if(cell.cell && cell.cell.editing){
      return false;
    }
    return true;
  },
  connecting:{
    snap: true
  },
  panning: {
    enabled: true,
    eventTypes: ["rightMouseDown"]
  },
  mousewheel: true
  // panning:{
  //   eventTypes: ['rightMouseDown']
  // }
})

Shape.HTML.register({
  shape: "type-command",
  width: 1,
  height: 1,
  effect: ["data"],
  html(cell){
    let data = cell.getData();
    let div = document.createElement("div");
    let name = document.createElement("input");
    name.placeholder = "序列名/纯文本";
    let content = document.createElement("textarea");
    content.placeholder = "内容/纯文本";
    // let implict = document.createElement("div");
    
    // implict.type = "checkbox";
    // implict.checked = data.implict;
    content.value = data.content.trim();
    name.value = data.name.trim();
    div.append(name, content);
    content.classList.add("command-text");
    name.classList.add("command-name");
    name.addEventListener("change", ()=>{
      cell.setData({ name:name.value });
    })
    content.addEventListener("change", ()=>{
      cell.setData({ content:content.value });
    })
    let focus = (value)=>{
      interactAble = value;
      transformPlugin.options = {resizing:value};
      value ? selectionPlugin.enable() : selectionPlugin.disable();
    }
    name.addEventListener("focusin", focus.bind(graph, false));
    content.addEventListener("focusin", focus.bind(graph, false));
    name.addEventListener("focusout", focus.bind(graph, true));
    content.addEventListener("focusout", focus.bind(graph, true));
    return div;
  }
})
Shape.HTML.register({
  shape: "type-comment",
  width: 100,
  height: 20,
  effect: ["data"],
  html(cell){
    let data = cell.getData();
    let div = document.createElement("div");
    let name = document.createElement("textarea");
    name.placeholder = "关系";
    name.value = data.comment.trim();
    div.append(name);
    name.classList.add("command-text");
    name.addEventListener("change", ()=>{
      cell.setData({ comment:name.value });
    })
    let focus = (value)=>{
      interactAble = value;
      transformPlugin.options = {resizing:value};
      value ? selectionPlugin.enable() : selectionPlugin.disable();
    }
    name.addEventListener("focusin", focus.bind(graph, false));
    name.addEventListener("focusout", focus.bind(graph, true));
    
    return div;
  }
})

graph.use(new History({ enabled: true }));
const selectionPlugin = new Selection({ enabled:true, showNodeSelectionBox: true, multiple:true, rubberband:true});
const transformPlugin = new Transform({ resizing:{ enabled:true } });
graph.use(selectionPlugin);
graph.use(transformPlugin);
graph.use(new Keyboard({enabled:true, global:true}));
graph.use(new Clipboard({enabled:true}));
graph.use(new Snapline({enabled:true}));
// graph.use(new MiniMap({container:document.getElementById("mmap"), width:300, height:300}));
let interactAble = false;
// graph.bindKey('ctrl', ()=>{
//   interactAble = !interactAble;
//   transformPlugin.options = { resizing:interactAble };
// })
// graph.on("node:resize", ({node})=>{
//   let textarea = node.textarea;
//   if(!textarea) return;
  
//   let size = node.size();
//   console.log(textarea, size);
//   textarea.style.width = size.width + "px";
//   textarea.style.height = (size.height * 0.8) + "px";
// })

graph.bindKey('ctrl+c', () => {
  const cells = graph.getSelectedCells()
  if (cells.length) {
    graph.copy(cells.filter((c)=>c.getData().block))
  }
  // const node = graph.currentNode;
  // if(node){
  //   node
  //   graph.copy([node])
  // }
  return false
})

graph.bindKey('ctrl+v', () => {
  if (!graph.isClipboardEmpty()) {
    const cells = graph.paste({ offset: 32 })
    cells.forEach((c)=>{
      c.setZIndex(1);
    })
    graph.cleanSelection()
    graph.select(cells)
  }
  // const node = graph.currentNode;
  // if(node){
  //   const cells = graph.paste({ offset: 32 })
  //   cells.forEach((c)=>{
  //     c.setZIndex(node.zIndex);
  //   })
  //   graph.select(cells);
  // }
  return false
})

graph.bindKey('ctrl+z', () => {
  if(!graph.canUndo()) return;
  graph.undo();
})

graph.bindKey('ctrl+y', () => {
  if(!graph.canRedo()) return;
  graph.redo();
})

graph.bindKey('l', ()=>{
  const cells = graph.getSelectedCells();
  if(cells.length == 1){
    let position = [0, 0];
    if(cells[0].isNode()){
      let pos = cells[0].position();
      position = [pos.x + cells[0].size().width/2, pos.y - 30]
    }
    let e = graph.addEdge({
      source: cells[0],
      target: position
    })
    e.setLabels("l");
  }
  else if(cells.length == 2){
    let e = graph.addEdge({
      source: cells[0],
      target: cells[1]
    })
    e.setLabels("l");
  }
})

graph.bindKey('ctrl+t', ()=>{
  transformPlugin.options = { resizing:true }
  selectionPlugin.toggleEnabled();
})

graph.bindKey('ctrl+d', ()=>{
  // const cells = graph.getSelectedCells();
  // if(!cells.length) return;
  // graph.removeCells(cells);
  const node = graph.currentNode;
  if(node){
    graph.removeNode(node);
  }
})

graph.bindKey('space', ()=>{
  const cells = graph.getSelectedCells();
  if(cells.length == 2){
    createRelation(cells[0], cells[1]);
  }
  else if(cells.length == 1){
    let node = cells[0];
    createSimpleComment(node.position().x, node.position().y - 50)
  }
  // const node = graph.currentNode;
  // let target = null;
  // if(!node){
  //   target = createSimpleComment(0, 0);
  //   return;
  // }
  // target = createSimpleComment(node.position().x, node.position().y - 50);
  // if(target){
  //   graph.addEdge({
  //     source: node,
  //     target
  //   })
  // }
  // console.log(node);
})

function createSimpleComment(x, y, comment="注释"){
  const a = graph.addNode({
    shape: "type-comment",
    x,
    y,
    width: 100,
    height: 50,
    zIndex: 10,
    attrs: {
      body: {
        stroke: 'none',
        fill: '#3199FF',
      },
      label: {
        fill: '#fff',
        fontSize: 12,
      },
    },
    data:{
      comment
    }
  })
  return a;
}






function update(){
  requestAnimationFrame(update);
  let allNodes = graph.getNodes();
  allNodes.forEach((n)=>{
    let data = n.getData();
    if(data.asPlainContent){
      let parent = n.getParent();
      if(!parent) return;
      // console.log(n);
      let pos = parent.position();
      n.prop({
        position:{
          x: pos.x,
          y: parent.size().height + pos.y
        }
      })
    }
  })
  // console.log(allNodes);
}
// requestAnimationFrame(update);
function createBlock(content="", name=""){
  return graph.addNode({
    shape: "type-command",
    x: 200,
    y: 80,
    width: 300,
    height: 300,
    zIndex: 1,
    attrs: {
      body: {
        fill: '#aa3399',
        stroke: '#000000',
      },
    },
    data: {
      content,
      name,
      // parent: true,
      block: true,
      relation: {},
    },
  })
}
function createRelation(a, b, type="link"){
  let pos = b.position();
  let comment = createSimpleComment(pos.x - 200, pos.y + b.size().height, type);
  comment.setData({linkPoint:true});
  graph.addEdge({
    source: a,
    target: comment,
    data:{
      link:true
    }
  })
  graph.addEdge({
    source: comment,
    target: b,
    data:{
      link:true
    }
  })
}



let autoCompleteV0 = document.getElementById("autoCompleteV0");
autoCompleteV0.addEventListener("input", ()=>{
  if(!autoCompleteV0.lastNode) return;
  autoCompleteV0.lastNode.setLabel(autoCompleteV0.value);
})
graph.currentNode = null;
graph.on("node:click", ({e, node, view})=>{
  graph.currentNode = node;
  // if(autoCompleteV0.lastNode == node) return;
  // autoCompleteV0.value = node.label;
  // autoCompleteV0.style.display = "block";
  // autoCompleteV0.lastNode = node;
  // autoCompleteV0.style.left = e.pageX + "px";
  // autoCompleteV0.style.top = e.pageY + "px";
  // let height = Math.min(window.innerHeight * 0.8 - e.pageY, autoCompleteV0.scrollHeight);
  // autoCompleteV0.style.height = height + "px";
  // autoCompleteV0.style.width = "720px";
})
graph.on("blank:click", ({e, node, view})=>{
  // autoCompleteV0.style.display = "none";
  autoCompleteV0.lastNode = null;
  graph.currentNode = null;
})


export { graph, createBlock, createRelation };