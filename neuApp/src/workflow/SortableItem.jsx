import React, { useState } from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { Card, Space, Input, Tag, Flex, Divider } from 'antd';
import { ActionMenuCard, CommandScope, ContentCard, ExtraBaseMenuCard, LocalVar, MoveBtnCard, RemoveCard, TitleCard } from './BlockExtra';
const {TextArea} = Input;

export function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: props.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    margin: 5,

  };
  
  const [_scope, setScope] = useState("./workflow/font/self.svg");
  function _setScope(){
    if(_scope == "./workflow/font/global.svg"){
      setScope("./workflow/font/self.svg")
    }
    else if(_scope == "./workflow/font/self.svg"){
      setScope("./workflow/font/global.svg")
    }
  }

  return (
    <Card ref={setNodeRef} style={style} {...attributes} 
      size="small"
      actions={[<ActionMenuCard listeners={listeners}/>]}
      title={<Input placeholder="name" prefix={<CommandScope onClick={_setScope} scope={_scope}/>}></Input>}
      // extra={<ExtraBaseMenuCard/>}
    >
      <ContentCard/>
      <ContentCard/>
    </Card>
    
  );
}