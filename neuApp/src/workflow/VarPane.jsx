import React, { useEffect, useRef, useState } from 'react';
import { Flex, Splitter, Typography, Menu, Collapse, List, Button, Tabs, Card } from 'antd';

import { GEV, Utils } from './Utils';

import Shower from './Block';
import Outline from './Outline';
import AssetOutline from './AssetOutline';
import TextArea from 'antd/es/input/TextArea';
import MetaVar from './MetaVar';
import { Editor } from '../core/editor';



const VarPane = ({param, name}) => {
  const self = useRef(null);
  let lastPane = null;
  useEffect(()=>{
    console.log(param);
    if(lastPane){
      lastPane.remove();
    }
    lastPane = Editor.createPane(self.current);
    Editor._applyPaneParam(param, name, lastPane);
  }, [param])

  let container = <div ref={self}></div>
  
  
  return container;
};

export default VarPane

