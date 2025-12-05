import React, { useRef, useEffect, useCallback } from 'react';
import { useCognotFlow } from '../contexts/CognotFlowContext';
import './CognotFlowCanvas.css';

const CognotFlowCanvas = ({ children }) => {
  const canvasRef = useRef(null);
  const { viewport, updateViewport, addNode } = useCognotFlow();
  
  const isPanning = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  
  useEffect(() => {
    if (!document.getElementById('cognot-flow-canvas-styles')) {
      const canvasStyle = document.createElement('style');
      canvasStyle.id = 'cognot-flow-canvas-styles';
      canvasStyle.textContent = `
        /* Smooth transition */
        .cognot-flow-transform-layer {
          transition: transform 0.1s ease-out;
        }
        
        /* Optimize the display of nodes during scaling */
        .cognot-node {
          transform-origin: 0 0;
        }
      `;
      document.head.appendChild(canvasStyle);
    }
  }, []);
  
  const handleMouseDown = useCallback((e) => {
    const clickedNode = e.target.closest('.cognot-node');
    const clickedHandle = e.target.closest('.cognot-node-handle');
    
    if (e.button === 0 && !e.ctrlKey && !clickedNode && !clickedHandle) {
      isPanning.current = true;
      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
      
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
      
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);
  
  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const deltaX = e.clientX - lastMouseX.current;
    const deltaY = e.clientY - lastMouseY.current;
    
    updateViewport({
      ...viewport,
      x: viewport.x + deltaX,
      y: viewport.y + deltaY
    });
    
    lastMouseX.current = e.clientX;
    lastMouseY.current = e.clientY;
  }, [viewport, updateViewport]);
  
  const handleMouseUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
  }, []);
  
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const zoomSpeed = 0.001; 
    const normalizedDelta = Math.min(Math.abs(e.deltaY), 100);
    const zoomFactor = 1 + (e.deltaY > 0 ? -zoomSpeed * normalizedDelta : zoomSpeed * normalizedDelta);
    
    const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * zoomFactor));
    
    if (newZoom === viewport.zoom) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - viewport.x) / viewport.zoom;
    const worldY = (mouseY - viewport.y) / viewport.zoom;
    
    const newX = mouseX - worldX * newZoom;
    const newY = mouseY - worldY * newZoom;
    
    updateViewport({
      x: newX,
      y: newY,
      zoom: newZoom
    });
  }, [viewport, updateViewport]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', handleMouseDown, { passive: false });
    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);
  
  const handleDoubleClick = useCallback((e) => {
    const clickedNode = e.target.closest('.cognot-node');
    const clickedHandle = e.target.closest('.cognot-node-handle');
    
    if (!clickedNode && !clickedHandle) {
      updateViewport({
        x: 0,
        y: 0,
        zoom: 1
      });
    }
  }, [updateViewport]);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const nodeDataJSON = e.dataTransfer.getData('application/json');
      if (!nodeDataJSON) {
        console.error('No drag data found');
        return;
      }
      
      console.log('Raw drag data:', nodeDataJSON);
      
      const nodeData = JSON.parse(nodeDataJSON);
      
      if (!nodeData || typeof nodeData !== 'object') {
        console.error('Invalid drag data type:', typeof nodeData);
        return;
      }
      
      if (!nodeData.type || !nodeData.label) {
        console.error('Invalid drag data format - missing required fields:', nodeData);
        return;
      }
      
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('Canvas reference not found');
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomFactor = viewport.zoom || 1;
      const worldX = (mouseX - viewport.x) / zoomFactor;
      const worldY = (mouseY - viewport.y) / zoomFactor;
      
      if (isNaN(worldX) || isNaN(worldY)) {
        console.error('Calculated position is NaN:', { worldX, worldY, mouseX, mouseY, viewport });
        return;
      }
      
      let inputsArray = [];
      let outputsArray = [];
      
      if (nodeData.inputs) {
        if (Array.isArray(nodeData.inputs)) {
          inputsArray = nodeData.inputs;
        } else if (typeof nodeData.inputs === 'object') {
          inputsArray = Object.keys(nodeData.inputs).map(name => ({
            name,
            type: nodeData.inputs[name] || 'default'
          }));
        }
      }
      
      if (nodeData.outputs) {
        if (Array.isArray(nodeData.outputs)) {
          outputsArray = nodeData.outputs;
        } else if (typeof nodeData.outputs === 'object') {
          outputsArray = Object.keys(nodeData.outputs).map(name => ({
            name,
            type: nodeData.outputs[name] || 'default'
          }));
        }
      }
      
      const newNode = {
        id: `node_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        type: nodeData.type,
        position: { x: worldX, y: worldY },
        data: {
          ...(nodeData.config || {}),
          label: nodeData.label,
          inputs: inputsArray,
          outputs: outputsArray
        },
      };
      
      console.log('Adding new node:', newNode);
      
      if (addNode) {
        addNode(newNode);
        console.log('Node added successfully');
      } else {
        console.error('addNode function is not available');
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      console.error('Error stack:', error.stack);
    }
  }, [viewport, addNode]);
  
  return (
      <div
        ref={canvasRef}
        className="cognot-flow-canvas"
        onContextMenu={(e) => e.preventDefault()} 
        onDoubleClick={handleDoubleClick} 
        onDragOver={handleDragOver} 
        onDrop={handleDrop}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: 'grab',
          position: 'relative',
          backgroundColor: '#1a1a1a', 
          userSelect: 'none', 
          backgroundSize: `${50 * viewport.zoom}px ${50 * viewport.zoom}px, ${50 * viewport.zoom}px ${50 * viewport.zoom}px, ${50 * viewport.zoom}px ${50 * viewport.zoom}px, ${50 * viewport.zoom}px ${50 * viewport.zoom}px`,
        }}
      >
      {/* Transformation layer for nodes and connections */}
      <div
        className="cognot-flow-transform-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          pointerEvents: 'none', 
        }}
      >
        {/* Restore the mouse events of nodes */}
        <div style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CognotFlowCanvas;