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
  const onCode = function(e){
    let v = e.target.value;
    setValue(v);
    let result = Utils.transYaml(v);
    if(!result) return;
    console.log(result);
    if(result){
      const newItem = [];
      for(let key in result){
        // const {des, type} = result[key];
        newItem.push({title:key, target:key, param:result[key]})
      }
      console.log(newItem);
      setItem(newItem);
    }
  }

  // useEffect(()=>{
  //   clearLine();
  //   let a = Array.from(document.getElementsByClassName("reflect"));
    
  //   a.forEach((target)=>{
  //     let name = target.getAttribute("name").trim();
  //     // removeLine(name);
  //     addLine(target, name.replace(/\.$/, ""), );
      
  //   })
   
  //   // console.log(b, a[0]);
  //   // if(b && a[0]){
      
  //   //   new LeaderLine(
  //   //     a[0],
  //   //     b
  //   //   );
  //   // }
  // }, [items])
  
  // GEV.on(`meta:${type}:change`, (v)=>{
  //   setValue(v);
  // })

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
                <VarPane param={item.param} id={`vars:${item.target}`} name={item.target}/>
                
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

