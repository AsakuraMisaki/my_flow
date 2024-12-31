import React, { useState } from 'react';
import { Flex, Splitter, Typography, Menu, Collapse, List, Button } from 'antd';

import { GEV, Utils } from './Utils';
import Editor from './Workgraph';
import Shower from './Block';
const {Panel} = Collapse;

function onClick(item){
  // let data = Utils.getData();
  // if(!data) return;
  // console.log(item);
  // if(!data[item.type]) return;
  // if(!data[item.type][item.key]) return;
  // console.log(data[item.type][item.key]);
  GEV.emit("workspace:build", item.type, item.key);
}

const Workspace = () => {
  const [items, setItems] = useState([]);
  GEV.on("workspace:items:change", (_)=>{
    setItems(_);
  })
  const [list, updateList] = useState([]);
  GEV.on("workspace:list:change", (_)=>{
    updateList(_);
  })
  

  return <Splitter
    style={{
      height: '100%',
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    }}
  >
    <Splitter.Panel defaultSize="13%" min="13%" max="50%">
      {
        list.map(item => (
          <Collapse key={item.key}>
          <Panel header={item.label}>
            <List
                itemLayout="horizontal"
                dataSource={item.items}
                renderItem={(item, index) => (
                  <List.Item key={item.key}>
                    <a onClick={onClick.bind({}, item)}>
                      {item.key}{ item.label }
                    </a>
                  </List.Item>
                )}
            />
          </Panel>
          </Collapse>
        ))
      }
    </Splitter.Panel>
    <Splitter.Panel style={{height:"100%"}}>
      <div id="protoEditor" style={{height:"100%", padding:0, margin:0}}></div>
      {/* <Editor/> */}
      {/* <Shower/> */}
    </Splitter.Panel>
    <Splitter.Panel defaultSize="13%" min="13%" max="50%">
      <div id="pane"></div>
      {/* <div id="protoEditor"></div> */}
      {/* <Editor/> */}
      {/* <Shower/> */}
    </Splitter.Panel>
  </Splitter>
};

export default Workspace

