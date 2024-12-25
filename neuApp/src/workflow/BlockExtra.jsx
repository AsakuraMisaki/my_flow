import React, { useState } from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { Card, Space, Input, Tag, Flex, Divider } from 'antd';
import { Utils } from './Utils';
const {TextArea} = Input;

function canmove(){
  Utils.setNodeMovable(true);
}
function nomove(){
  Utils.setNodeMovable(false);
}

export function MoveBtn(){
  return (<img 
    src="./workflow/font/move.svg" 
    onPointerDown={canmove} 
    onPointerOut={nomove} 
    onPointerUp={nomove}
    style={{width:20, height:20}}
    />)
}

export function MoveBtnCard(){
  return (<img 
    src="./workflow/font/move.svg" 
    style={{width:13, height:13}}
    />)
}

export function RemoveCard(){
  return (<img 
    src="./workflow/font/delete.svg" 
    style={{width:13, height:13}}
    />)
}

export function TitleCard(){
  return (
    <Flex>
      <Input placeholder="name"></Input>
      {/* <Input placeholder="cache"></Input> */}
    </Flex>
  )
}

export function CommandScope({scope, onClick}){
  return (<img 
    onClick={onClick}
    src={scope}
    style={{width:13, height:13}}
  />)
}

export function LocalVar(){
  return (<img 
    src="./workflow/font/localVar.svg" 
    style={{width:13, height:13}}
  />)
}

export function ExtraBaseMenuCard(){
  return (
    <Input placeholder="ddda"/>
  )
}

export function ActionMenuCard({listeners}){
  return (<Space direction="vertical" size="small">
          <Input
            placeholder="缓存"
            prefix = {<img 
              src="./workflow/font/localVar.svg" 
              style={{width:13, height:13}}
            />}
          />
          <Flex vertical={false} justify="space-between">
            <img src="./workflow/font/delete.svg" style={{width:13, height:13}}/>
            <img src="./workflow/font/add.svg" style={{width:13, height:13}}/>
            <img src="./workflow/font/loop.svg" style={{width:13, height:13}}/>
            <img src="./workflow/font/add.svg" style={{width:13, height:13}}/>
            <img {...listeners} src="./workflow/font/move.svg" style={{width:13, height:13}}/>
          </Flex>
      </Space>)
}

export function ContentCard(){
  const [display, setDisplay] = useState("none");

  return <Flex >
    <img src="./workflow/font/javascript.svg" style={{width:15, height:15, padding:1}}/>
    <TextArea
      placeholder="参数"
      onPointerEnter={()=>setDisplay("")} onPointerOut={()=>setDisplay("none")}
      autoSize={{
        maxRows: 8,
      }}
    />
    <Flex justify="space-between" style={{display:display, marginBottom:5}}>
      <img src="./workflow/font/delete.svg" style={{width:15, height:15, padding:1}}/>
      <img src="./workflow/font/add.svg" style={{width:15, height:15, padding:1}}/>
      
    </Flex>
  </Flex>
}