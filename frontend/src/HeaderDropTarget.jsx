import { useDroppable } from '@dnd-kit/core';
import DraggableServicesTitle from './DraggableServicesTitle';

const HeaderDropTarget = ({
  servicesInHeader,
  draggedServicePosition,
  learnServices,
  createServices,
  onServiceClick,
  onReturnToDefault,
  onNavigateToServices
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'header-nav',
  });

  // If services are in header, show the draggable component
  if (servicesInHeader) {
    return (
      <DraggableServicesTitle
        isInHeader={true}
        learnServices={learnServices}
        createServices={createServices}
        onServiceClick={onServiceClick}
        onReturnToDefault={onReturnToDefault}
        onNavigateToServices={onNavigateToServices}
        position={draggedServicePosition}
      >
        Services
      </DraggableServicesTitle>
    );
  }

  // Otherwise, show invisible drop target
  return (
    <div
      ref={setNodeRef}
      className={`header-drop-target ${isOver ? 'drag-over' : ''}`}
      style={{
        minWidth: '1px',
        minHeight: '1px',
        opacity: 0,
        pointerEvents: isOver ? 'auto' : 'none'
      }}
      aria-label="Drop services section here"
    />
  );
};

export default HeaderDropTarget;

