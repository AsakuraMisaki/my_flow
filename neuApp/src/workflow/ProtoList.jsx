import React, { useEffect, useState } from 'react';
import { Flex, Splitter, Typography, Menu, Collapse, List, Button, Tabs, Card, Input, Radio, Space } from 'antd';

import { GEV, Utils } from './Utils';

import Shower from './Block';
import Outline from './Outline';
import AssetOutline from './AssetOutline';
import TextArea from 'antd/es/input/TextArea';
import MetaVar from './MetaVar';
import { Editor } from '../core/editor';


const {Panel} = Collapse;


const ProtoList = () => {
  const [states, setStates] = useState([]);
  const [value, setValue] = useState(null);
  GEV.on("prototype:select:states", (s)=>{
    let newStates = [];
    s.forEach((data, key)=>{
      newStates.push(Object.assign({stateName:key}, data));
    })
    setStates(newStates);
  })
  const onChange = (e) => {
    console.log('radio checked', e.target.value);
    setValue(e.target.value);
  };

  return <>
    <Radio.Group value={value} onChange={onChange} buttonStyle="solid">
      <Space direction="vertical">
        {
          states.map(({stateName, })=>{
            return <Radio key={stateName} value={stateName}>
              <Card title={stateName}>
                
              </Card>
            </Radio>
          })
        }
      </Space>
    </Radio.Group>
  </>
};

export default ProtoList

