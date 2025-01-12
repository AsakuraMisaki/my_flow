/* eslint-disable no-new */
import React, {useState} from 'react'
import { Graph } from '@antv/x6'
import { Clipboard } from '@antv/x6-plugin-clipboard'
import { History } from '@antv/x6-plugin-history'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { MiniMap } from '@antv/x6-plugin-minimap'
import { Selection } from '@antv/x6-plugin-selection'
import { Snapline } from '@antv/x6-plugin-snapline'
import { Transform } from '@antv/x6-plugin-transform'
import { GEV, Utils } from './Utils'
import Block from './Block'
import {register} from '@antv/x6-react-shape'
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import Dnd from './Dnd'

console.log(React.version);


// Shape.HTML.register({
//   shape: "type-command",
//   width: 1,
//   height: 1,
//   effect: ["data"],
//   html(cell){
//     let data = cell.getData();
//     let div = document.createElement("div");
//     let name = document.createElement("input");
//     name.placeholder = "序列名/纯文本";
//     let content = document.createElement("textarea");
//     content.placeholder = "内容/纯文本";
//     // let implict = document.createElement("div");
    
//     // implict.type = "checkbox";
//     // implict.checked = data.implict;
//     content.value = data.content.trim();
//     name.value = data.name.trim();
//     div.append(name, content);
//     content.classList.add("command-text");
//     name.classList.add("command-name");
//     name.addEventListener("change", ()=>{
//       cell.setData({ name:name.value });
//     })
//     content.addEventListener("change", ()=>{
//       cell.setData({ content:content.value });
//     })
//     let focus = (value)=>{
//       interactAble = value;
//       transformPlugin.options = {resizing:value};
//       value ? selectionPlugin.enable() : selectionPlugin.disable();
//     }
//     name.addEventListener("focusin", focus.bind(graph, false));
//     content.addEventListener("focusin", focus.bind(graph, false));
//     name.addEventListener("focusout", focus.bind(graph, true));
//     content.addEventListener("focusout", focus.bind(graph, true));
//     return div;
//   }
// })
// Shape.HTML.register({
//   shape: "type-comment",
//   width: 100,
//   height: 20,
//   effect: ["data"],
//   html(cell){
//     let data = cell.getData();
//     let div = document.createElement("div");
//     let name = document.createElement("textarea");
//     name.placeholder = "关系";
//     name.value = data.comment.trim();
//     div.append(name);
//     name.classList.add("command-text");
//     name.addEventListener("change", ()=>{
//       cell.setData({ comment:name.value });
//     })
//     let focus = (value)=>{
//       interactAble = value;
//       transformPlugin.options = {resizing:value};
//       value ? selectionPlugin.enable() : selectionPlugin.disable();
//     }
//     name.addEventListener("focusin", focus.bind(graph, false));
//     name.addEventListener("focusout", focus.bind(graph, true));
    
//     return div;
//   }
// })
const BlockWrap = (node)=>{
  const data = node.getData()
  return (<Block data={data}/>)
}
register({
  shape: "aa",
  width: 256,
  height: 40,
  effect: ["data"],
  component: Block
})



let interactAble = true;
export default class Editor extends React.Component {

  componentDidMount() {
    this.graph = new Graph({
      container: document.getElementById('graph'),
      grid: true,
      embedding: {
        enabled: true,
        // findParent({ node }) {
        //   const bbox = node.getBBox();
        //   if(!node.getData().canChildren) return;
        //   return this.getNodes().filter((node) => {
        //     const data = node.getData()
        //     if (data && data.parent) {
        //       const targetBBox = node.getBBox()
        //       return bbox.isIntersectWithRect(targetBBox)
        //     }
        //     return false
        //   })
        // },
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
        // return false;
        return {nodeMovable:Utils.nodeMovable};
      },
      panning: {
        enabled: true,
        eventTypes: ["rightMouseDown"]
      },
      mousewheel: true
    })
    this.userCustom();
  }

  userCustom(){
    console.log("graph setup");
    let graph = this.graph;
    graph.use(new History({ enabled: true }));
    const selectionPlugin = new Selection({ enabled:false, showNodeSelectionBox: true, multiple:true, rubberband:true});
    const transformPlugin = new Transform({ resizing:{ enabled:false } });
    graph.use(selectionPlugin);
    graph.use(transformPlugin);
    graph.use(new Keyboard({enabled:true, global:true}));
    graph.use(new Clipboard({enabled:true}));
    graph.use(new Snapline({enabled:true}));

    this.caches = new Map();
    graph.bindKey('ctrl+c', () => {
      const cells = graph.getSelectedCells()
      if (cells.length) {
        graph.copy(cells.filter((c)=>c.getData().block))
      }
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

    graph.bindKey('ctrl+t', ()=>{
      transformPlugin.options = { resizing:true }
      selectionPlugin.toggleEnabled();
    })

    graph.bindKey('ctrl+s', ()=>{
      const json = this.graph.toJSON();
      this.caches.set("recent", json);
      console.log(json);
    })

    graph.bindKey('ctrl+b', ()=>{
      let recent = this.caches.get("recent");
      console.log(recent);
      if(!recent) return;
      this.graph.fromJSON(recent);
    })
    
    graph.bindKey('delete', ()=>{
      const cells = graph.getSelectedCells();
      if(!cells.length) return;
      graph.removeCells(cells);
    })

    graph.bindKey('space', ()=>{
      this.createBlock();
      return;
      const cells = graph.getSelectedCells();
      if(cells.length == 2){
        createRelation(cells[0], cells[1]);
      }
      else if(cells.length == 1){
        let node = cells[0];
        createSimpleComment(node.position().x, node.position().y - 50)
      }
    })
    
    GEV.on("workspace:graph:comment", (x, y, comment)=>{
      this.createSimpleComment(x, y, comment);
    })
    GEV.on("workspace:graph:block", (content, name)=>{
      this.createBlock(content, name);
    })
    GEV.on("workspace:graph:link", (a, b, type)=>{
      this.createRelation(a, b, type);
    })
    GEV.on("workspace:graph:source", (data)=>{
      this.graph.clearCells();
      this.graph.fromJSON(data);
    })
  }

  createSimpleComment(x, y, comment="注释"){
    const graph = this.graph;
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
        canChildren: true,
        comment
      }
    })
    return a;
  }
  createBlock(content="", name=""){
    const graph = this.graph;
    graph.addNode({
      x: 40,
      y: 40,
      
      shape: 'aa',
      attrs:{
        
      },
      data:{
        items: [1,2,3,4]
      }
    })
    // return graph.addNode({
    //   shape: "react-shape",
    //   component(){
    //     return <header>sdasdsaddsa</header>
    //   },
    //   x: 0,
    //   y: 0,
    //   width: 300,
    //   height: 300,
    //   zIndex: 9,
    //   // attrs: {
    //   //   body: {
    //   //     fill: '#aa3399',
    //   //     stroke: '#000000',
    //   //   },
    //   // },
    //   // data: {
    //   //   content,
    //   //   name,
    //   //   // parent: true,
    //   //   block: true,
    //   //   relation: {},
    //   // },
    // })
  }
  createRelation(a, b, type="link"){
    const graph = this.graph;
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

  render() {
    // const sensors = useSensors(
    //   useSensor(PointerSensor),
  
    // );
    return (
    //   <DndContext 
    //   sensors={sensors}
    //   collisionDetection={closestCenter}
      
    // >
    //   <div id="graph"></div>
    // </DndContext>
      <Dnd/>
      // <div id="graph" style={{height:"100%"}}>
      // </div>
    )
  }
}