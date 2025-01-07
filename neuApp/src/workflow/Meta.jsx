import React, { useEffect, useState } from 'react';
import { Flex, Splitter, Typography, Menu, Collapse, List, Button, Tabs, Card } from 'antd';

import { GEV, Utils } from './Utils';

import Shower from './Block';
import Outline from './Outline';
import AssetOutline from './AssetOutline';
import TextArea from 'antd/es/input/TextArea';
import MetaVar from './MetaVar';
import { Editor } from '../core/editor';
import "leader-line";
import VarPane from './VarPane';

const {Panel} = Collapse;



const Meta = ({type, visual}) => {
  const [value, setValue] = useState("");
  const [items, setItem] = useState([]);
  const [result, setResult] = useState({});
  const [pane, setPane] = useState(null);
  // const clearPanes = ()=>{
  //   panes.forEach((p)=>{
  //     p.remove(p.rackApi_);
  //   })
  //   panes.clear();
  // }
  const onCode = (e)=>{
    let v = e.target.value;
    setValue(v);
    let r = Utils.transYaml(v);
    if(!r) return;
    const newItem = [];
    for(let key in r){
      newItem.push({title:key, target:key})
    }
    console.log(newItem);
    setItem(newItem);
    setResult(r);
  }

  useEffect(()=>{
    if(pane){
      while(pane.children.length){
        pane.remove(pane.children[0]);
      }
      pane.element.remove();
    }
    let target = document.getElementById("reflect-vars");
    console.log(result);
    let p = Editor.createPane(target);
    setPane(p);
    for(let key in result){
      let param = result[key];
      try{
        Editor._applyPaneParam(param, key, p);
      }catch(e){
        console.error(e);
      }
    }
  }, [result])


  return <>
    <Splitter 
      layout="vertical"
      style={{
        height: "100%",
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      }}>
        <Splitter.Panel>
          <div id="reflect-vars"/>
        </Splitter.Panel>
        <Splitter.Panel>
          <TextArea autoSize={{ minRows: 999, maxRows: 999 }} value={value} onChange={onCode}/>
        </Splitter.Panel>
    </Splitter>
    
  </>
};

export default Meta

