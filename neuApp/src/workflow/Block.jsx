import React, {useState} from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {SortableItem} from './SortableItem';
import { Card } from 'antd';
import { MoveBtn } from './BlockExtra';

export default function Block({node}) {
  const data = node.getData()
  const [items, setItems] = useState(data.items || [1,2,3]);
  const sensors = useSensors(
    useSensor(PointerSensor),

  );


  return (
    <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Card 
        size="small"
        title="life"
        extra={<MoveBtn/>}
        >
          <SortableContext 
            items={items}
            strategy={verticalListSortingStrategy}
          >
            {items.map(id => <SortableItem key={id} id={id}/>)}
          </SortableContext>
        </Card>
        
    </DndContext>
  );
  
  function handleDragEnd(event) {
    const {active, over} = event;
    
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        node.setData({
          items: newItems
        })
        return newItems;
      });
    }
  }
}