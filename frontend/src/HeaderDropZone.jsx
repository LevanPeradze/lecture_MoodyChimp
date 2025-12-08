import { useDroppable } from '@dnd-kit/core';
import './HeaderDropZone.css';

const HeaderDropZone = ({ id, position, isOver: externalIsOver }) => {
  const { setNodeRef, isOver: hookIsOver } = useDroppable({
    id: `header-drop-${id}`,
    data: {
      position: position,
      type: 'header-drop-zone'
    }
  });

  // Use hook's isOver for accurate detection, fallback to external prop
  const isOver = hookIsOver || externalIsOver;

  return (
    <div
      ref={setNodeRef}
      className={`header-drop-zone ${isOver ? 'drag-over' : ''}`}
      aria-label={`Drop services section at position ${position}`}
    />
  );
};

export default HeaderDropZone;

