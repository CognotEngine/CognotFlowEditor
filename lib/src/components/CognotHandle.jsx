import { useEffect, useRef } from 'react';
import { useCognotFlow } from '../contexts/CognotFlowContext';
import './CognotHandle.css';

const HANDLE_TYPE_COLORS = {
  input: '#4CAF50',
  output: '#FF9800',
  default: '#9E9E9E',
};

const CognotHandle = ({ 
  id, 
  nodeId, 
  type, 
  position, 
  label,
  onConnect,
}) => {
  const handleRef = useRef(null);
  const { 
    startConnecting, 
    endConnecting, 
    clearConnecting,
    updateConnectingPosition,
    connectingEdge,
    edges,
  } = useCognotFlow();

  const isInput = type === 'input';
  const isOutput = type === 'output';
  const handleColor = HANDLE_TYPE_COLORS[type] || HANDLE_TYPE_COLORS.default;
  
  const isConnected = isInput && edges.some(edge => edge.target === nodeId && edge.targetHandle === id);

  const getHandlePosition = () => {
    if (!handleRef.current) return null;
    
    const rect = handleRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    
    if (isInput) return; 

    const handlePosition = getHandlePosition();
    if (!handlePosition) return;

    startConnecting(nodeId, id, handlePosition);

    const handleMouseMove = (e) => {
      updateConnectingPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e) => {
      const targetHandleElement = document.elementFromPoint(e.clientX, e.clientY);
      const isTargetHandle = targetHandleElement && targetHandleElement.classList.contains('cognot-handle');
      
      if (isTargetHandle) {
        const targetNodeId = targetHandleElement.dataset.nodeId;
        const targetHandleId = targetHandleElement.dataset.handleId;
        const targetHandleType = targetHandleElement.dataset.handleType;
        
        if (
          targetHandleType === 'input' && 
          targetNodeId !== nodeId &&
          !edges.some(edge => edge.target === targetNodeId && edge.targetHandle === targetHandleId) 
        ) {
          endConnecting(targetNodeId, targetHandleId);
        }
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      clearConnecting();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseEnter = (e) => {
    if (isInput && connectingEdge && connectingEdge.source !== nodeId) {
      handleRef.current.classList.add('cognot-handle-connecting');
    }
  };

  const handleMouseLeave = (e) => {
    if (isInput) {
      handleRef.current.classList.remove('cognot-handle-connecting');
    }
  };

  return (
    <div
      ref={handleRef}
      className={`cognot-handle cognot-handle-${type} ${isConnected ? 'cognot-handle-connected' : ''}`}
      style={{ backgroundColor: handleColor }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-handle-id={id}
      data-handle-type={type}
      data-node-id={nodeId}
      title={label || id}
    >
      {/* Port Prompt Text */}
      <div className={`cognot-handle-label cognot-handle-label-${type}`}>
        {label || id}
      </div>
    </div>
  );
};

export default CognotHandle;
