import { useDroppable } from '@dnd-kit/core';
import DraggableServicesTitle from './DraggableServicesTitle';
import WaveAnimatedElement from './components/WaveAnimatedElement';

const ServicesDropTarget = ({
  servicesInHeader,
  learnServices,
  createServices,
  onServiceClick,
  onDragStart,
  onDragEnd,
  waveTriggered,
  triggerWave,
  getPushAnimation,
  t
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'services-section-drop',
  });

  // If services are NOT in header, show the draggable component with wave animation
  if (!servicesInHeader) {
    return (
      <div ref={setNodeRef}>
        <WaveAnimatedElement
          waveTriggered={waveTriggered}
          getPushAnimation={getPushAnimation}
          elementId="services-title"
        >
          <DraggableServicesTitle
            learnServices={learnServices}
            createServices={createServices}
            onServiceClick={onServiceClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            waveTriggered={waveTriggered}
            triggerWave={triggerWave}
          >
            {t('services.title')}
          </DraggableServicesTitle>
        </WaveAnimatedElement>
      </div>
    );
  }

  // Otherwise, show drop target for returning from header
  return (
    <div
      ref={setNodeRef}
      className={`services-drop-target ${isOver ? 'drag-over' : ''}`}
      style={{
        minHeight: '60px',
        padding: '1rem',
        border: isOver ? '2px dashed var(--accent-primary)' : '2px dashed transparent',
        borderRadius: '4px',
        transition: 'border-color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}
      aria-label="Drop services section here to return to original position"
    >
      {isOver && (
        <span style={{ 
          color: 'var(--accent-primary)',
          fontSize: '0.9rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          Drop here to return Services
        </span>
      )}
    </div>
  );
};

export default ServicesDropTarget;

