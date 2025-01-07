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

const {Panel} = Collapse;

const lineSet = new Map();
function removeLine(name){
  let line = lineSet.get(name);
  lineSet.delete(name);
  if(!line) return;
  if(!line.remove) return;
  line.remove();
}
function addLine(a, name, option={size:2, path:"straight"}){
  let b = Editor.getPaneEleByRefString(name);
  if(!b) return;
  const l = new LeaderLine(a, b, option);
  console.log(l);
  lineSet.set(name, l);
}
function clearLine(){
  lineSet.forEach((l, name)=>{
    removeLine(name);
  })
}
function getReflects(data, items=[], key=""){
  if(typeof(data) == "string"){
    let target = key;
    items.push({title:data, target});
  }
  else if(data && typeof(data) == "object"){
    for(let key0 in data){
      const data0 = data[key0];
      getReflects(data0, items, key+key0+".");
    }
  }
  
}
const Meta = ({type, visual}) => {
  const [value, setValue] = useState("");
  const [items, setItem] = useState([]);
  const onCode = function(e){
    let v = e.target.value;
    setValue(v);
    let result = Utils.transYaml(v);
    if(!result) return;
    console.log(result);
    if(result){
      const newItem = [];
      getReflects(result, newItem);
      console.log(newItem);
      setItem(newItem);
    }
  }

  useEffect(()=>{
    clearLine();
    let a = Array.from(document.getElementsByClassName("reflect"));
    
    a.forEach((target)=>{
      let name = target.getAttribute("name").trim();
      // removeLine(name);
      addLine(target, name.replace(/\.$/, ""), );
      
    })
   
    // console.log(b, a[0]);
    // if(b && a[0]){
      
    //   new LeaderLine(
    //     a[0],
    //     b
    //   );
    // }
  }, [items])
  
  
  return <>
    <Splitter 
      layout="vertical"
      style={{
        height: "100%",
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      }}>
        <Splitter.Panel>
          <List dataSource={items} bordered 
            renderItem={(item) => (
              <List.Item>
                <Card title={item.title} className="reflect" name={item.target}/>
              </List.Item>
            )}
          >
          </List>
         
        </Splitter.Panel>
        <Splitter.Panel>
          <TextArea autoSize={{ minRows: 999, maxRows: 999 }} value={value} onChange={onCode}/>
        </Splitter.Panel>
    </Splitter>
    
  </>
};

export default Meta

