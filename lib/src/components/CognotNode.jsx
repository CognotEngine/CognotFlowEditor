import { useEffect, useRef, useState, useCallback } from 'react';
import { useCognotFlow } from '../contexts/CognotFlowContext';
import './CognotNode.css';

const NODE_TYPE_COLORS = {
  input: '#4CAF50',
  processing: '#2196F3',
  output: '#FF9800',
  default: '#9C27B0',
};

const HANDLE_TYPE_COLORS = {
  input: '#4CAF50',
  output: '#FF9800',
  default: '#9E9E9E',
};

const CognotNode = ({ id, type, position, data }) => {
  const nodeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const {
    selectedNodes,
    selectNode,
    deselectNode,
    deselectAll,
    updateNode,
    startConnecting,
    endConnecting,
    clearConnecting,
    updateConnectingPosition, 
    viewport
  } = useCognotFlow();

  const isSelected = selectedNodes.has(id);
  const titleColor = NODE_TYPE_COLORS[type] || NODE_TYPE_COLORS.default;

  const handleNodeClick = (e) => {
    e.stopPropagation();
    if (e.shiftKey) {
      if (isSelected) {
        deselectNode(id);
      } else {
        selectNode(id);
      }
    } else {
      deselectAll();
      selectNode(id);
    }
  };

  const lastUpdateTime = useRef(0);
  const updateThreshold = 16; 

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();

    const currentTime = Date.now();
    if (currentTime - lastUpdateTime.current < updateThreshold) {
      return;
    }
    lastUpdateTime.current = currentTime;
    
    const canvasElement = document.querySelector('.cognot-flow-canvas');
    if (!canvasElement) return;
    
    const canvasRect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    const newX = (mouseX - viewport.x) / viewport.zoom - dragOffset.x;
    const newY = (mouseY - viewport.y) / viewport.zoom - dragOffset.y;
    
    updateNode({
      id,
      position: { x: newX, y: newY }
    });
  }, [isDragging, dragOffset, id, updateNode, viewport]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('mouseleave', handleDragEnd);
    
    document.body.style.userSelect = '';
  }, [handleDragMove]);

  const handleDragStart = useCallback((e) => {
    e.stopPropagation();
    
    if (!isSelected) {
      deselectAll();
      selectNode(id);
    }
    
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      setDragOffset({ x: offsetX, y: offsetY });
    }
    
    setIsDragging(true);
    
    window.addEventListener('mousemove', handleDragMove, { passive: false });
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('mouseleave', handleDragEnd);
    
    document.body.style.userSelect = 'none';
  }, [id, isSelected, selectNode, deselectAll, handleDragMove, handleDragEnd]);
  

  const handleHandleMouseDown = (e, handleId, handleType) => {
    e.stopPropagation();
    
    if (handleType === 'input') return; 

    const startConnectingPosition = {
      x: e.clientX,
      y: e.clientY,
    };

    startConnecting(id, handleId, startConnectingPosition);

    const handleMouseMove = (e) => {
      const endPosition = {
        x: e.clientX,
        y: e.clientY,
      };
      updateConnectingPosition(endPosition);
    };

    const handleMouseUp = (e) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      clearConnecting();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleHandleMouseUp = (e, handleId, handleType) => {
    e.stopPropagation();
    
    if (handleType === 'output') return; 

    endConnecting(id, handleId);
  };

  const renderHandles = () => {
    const handles = [];
    
    if (Array.isArray(data.inputs)) {
      data.inputs.forEach((input, index) => {
        if (input && input.name) {
          handles.push(
            <div
              key={`${id}_input_${input.name}`}
              className="cognot-node-handle cognot-node-handle-input"
              style={{ 
                backgroundColor: HANDLE_TYPE_COLORS.input,
                top: `${30 + index * 20}px` 
              }}
              onMouseUp={(e) => handleHandleMouseUp(e, input.name, 'input')}
              data-handle-id={input.name}
              data-handle-type="input"
              data-node-id={id}
            />
          );
        }
      });
    }

    if (Array.isArray(data.outputs)) {
      data.outputs.forEach((output, index) => {
        if (output && output.name) {
          handles.push(
            <div
              key={`${id}_output_${output.name}`}
              className="cognot-node-handle cognot-node-handle-output"
              style={{ 
                backgroundColor: HANDLE_TYPE_COLORS.output,
                top: `${30 + index * 20}px` 
              }}
              onMouseDown={(e) => handleHandleMouseDown(e, output.name, 'output')}
              data-handle-id={output.name}
              data-handle-type="output"
              data-node-id={id}
            />
          );
        }
      });
    }

    return handles;
  };

  return (
    <div
      ref={nodeRef}
      className={`cognot-node ${isSelected ? 'cognot-node-selected' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={handleNodeClick}
      data-node-id={id}
      data-node-type={type}
    >
      {/* Node Title Bar */}
      <div 
        className="cognot-node-header"
        style={{ backgroundColor: titleColor }}
        onMouseDown={handleDragStart} // 标题栏支持拖拽
      >
        <div className="cognot-node-title">{data.label || id}</div>
      </div>

      {/* Node Content Area */}
      <div className="cognot-node-content">
        {data.content && <div className="cognot-node-data">{data.content}</div>}
        
        {/* Parameter Area */}
        {data.params && (
          <div className="cognot-node-params">
            {Object.entries(data.params).map(([key, param]) => (
              <div key={key} className="cognot-node-param">
                <label className="cognot-node-param-label">{param.label || key}</label>
                <div className="cognot-node-param-control">
                  {param.type === 'text' && (
                    <input
                      type="text"
                      value={param.value || ''}
                      onChange={(e) => updateNode({
                        id,
                        data: {
                          ...data,
                          params: {
                            ...data.params,
                            [key]: { ...param, value: e.target.value }
                          }
                        }
                      })}
                    />
                  )}
                  {param.type === 'number' && (
                    <input
                      type="number"
                      value={param.value || 0}
                      onChange={(e) => updateNode({
                        id,
                        data: {
                          ...data,
                          params: {
                            ...data.params,
                            [key]: { ...param, value: parseFloat(e.target.value) }
                          }
                        }
                      })}
                    />
                  )}
                  {param.type === 'select' && (
                    <select
                      value={param.value || param.options[0]}
                      onChange={(e) => updateNode({
                        id,
                        data: {
                          ...data,
                          params: {
                            ...data.params,
                            [key]: { ...param, value: e.target.value }
                          }
                        }
                      })}
                    >
                      {param.options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render Port */}
      {renderHandles()}
    </div>
  );
};

export default CognotNode;
