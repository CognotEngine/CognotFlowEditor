import React, { useCallback, useRef, memo } from 'react';
import { useCognotFlow } from '../contexts/CognotFlowContext';
import './CognotEdge.css';

const getBezierPath = (sourceX, sourceY, targetX, targetY) => {
  if (isNaN(sourceX) || isNaN(sourceY) || isNaN(targetX) || isNaN(targetY)) {
    return '';
  }
  
  const offset = Math.abs(targetX - sourceX) / 2;
  const midX = (sourceX + targetX) / 2;
  
  return `
    M ${sourceX} ${sourceY}
    C ${sourceX + offset} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}
  `;
};

const getLineIntersection = (line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) => {
  const denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
  
  if (denominator === 0) return null;
  
  const a = line1StartY - line2StartY;
  const b = line1StartX - line2StartX;
  const numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
  const numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
  
  const r = numerator1 / denominator;
  const s = numerator2 / denominator;
  
  if (r < 0 || r > 1 || s < 0 || s > 1) return null;
  
  return {
    x: line1StartX + (r * (line1EndX - line1StartX)),
    y: line1StartY + (r * (line1EndY - line1StartY))
  };
};

const CognotEdgeComponent = ({ id, source, target, sourceHandle, targetHandle, selected, onEdgeClick }) => {
  if (!id || !source || !sourceHandle || !target || !targetHandle) {
    console.error('Invalid edge data:', { id, source, sourceHandle, target, targetHandle });
    return null;
  }
  const edgeRef = useRef(null);
  const { deleteEdge, connectingEdge, nodes, viewport } = useCognotFlow();
  
  const getHandlePosition = useCallback((nodeId, handleId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.position) return null;
    
    const nodeWidth = 200; 
    const nodeHeight = 100; 
    const handleSpacing = 20; 
    
    let handleX, handleY;
    

    if (node.data.inputs?.some(input => input.name === handleId)) {
      handleX = node.position.x;
      const inputIndex = node.data.inputs?.findIndex(input => input.name === handleId) || 0;
      handleY = node.position.y + (inputIndex + 1) * handleSpacing;
    } 
    else {
      handleX = node.position.x + nodeWidth;
      const outputIndex = node.data.outputs?.findIndex(output => output.name === handleId) || 0;
      handleY = node.position.y + (outputIndex + 1) * handleSpacing;
    }
    
    return { x: handleX, y: handleY };
  }, [nodes]);

  const path = useRef('');
  const currentSource = useRef(source);
  const currentTarget = useRef(target);
  const currentSourceHandle = useRef(sourceHandle);
  const currentTargetHandle = useRef(targetHandle);
  const currentNodes = useRef(nodes);

  const getPath = useCallback(() => {
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);
    
    const cachedSourceNode = currentNodes.current.find(n => n.id === source);
    const cachedTargetNode = currentNodes.current.find(n => n.id === target);
    
    if (
      path.current &&
      currentSource.current === source &&
      currentTarget.current === target &&
      currentSourceHandle.current === sourceHandle &&
      currentTargetHandle.current === targetHandle &&
      currentNodes.current.length === nodes.length &&
      sourceNode && cachedSourceNode && targetNode && cachedTargetNode &&
      JSON.stringify(sourceNode.position) === JSON.stringify(cachedSourceNode.position) &&
      JSON.stringify(targetNode.position) === JSON.stringify(cachedTargetNode.position)
    ) {
      return path.current;
    }

    const sourcePosition = getHandlePosition(source, sourceHandle);
    const targetPosition = getHandlePosition(target, targetHandle);
    
    if (!sourcePosition || !targetPosition) {
      path.current = '';
      return path.current;
    }
    
    if (isNaN(sourcePosition.x) || isNaN(sourcePosition.y) || isNaN(targetPosition.x) || isNaN(targetPosition.y)) {
      path.current = '';
      return path.current;
    }
    
    path.current = getBezierPath(sourcePosition.x, sourcePosition.y, targetPosition.x, targetPosition.y);
    
    currentSource.current = source;
    currentTarget.current = target;
    currentSourceHandle.current = sourceHandle;
    currentTargetHandle.current = targetHandle;
    currentNodes.current = nodes;

    return path.current;
  }, [getHandlePosition, source, sourceHandle, target, targetHandle, nodes]);

  const handleEdgeClick = (e) => {
    e.stopPropagation();
    deleteEdge(id);
  };

  const pathData = getPath();

  return (
    <g className="cognot-edge" onMouseDown={handleEdgeClick}>
      {/* Path with arrowheads - merged into a single path for improved performance */}
      <path
        ref={edgeRef}
        className="cognot-edge-path"
        d={pathData}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        markerEnd={`url(#arrowhead-${id})`}
      />
      
      {/* arrow marker */}
      <marker
        id={`arrowhead-${id}`}
        markerWidth="6"
        markerHeight="6"
        refX="5"
        refY="1.5"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <polygon points="0 0, 6 1.5, 0 3" fill="#FF9800" />
      </marker>
    </g>
  );
};

const CognotEdge = memo(CognotEdgeComponent);

const CognotEdges = () => {
  const { edges, connectingEdge, nodes, viewport } = useCognotFlow();
  const svgRef = useRef(null);
  
  const getHandlePosition = (nodeId, handleId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.position) return null;
    
    const nodeWidth = 200; 
    const nodeHeight = 100; 
    const handleSpacing = 20; 
    
    let handleX, handleY;
    
    if (connectingEdge?.targetHandle === handleId) {
      handleX = node.position.x;
      const inputIndex = node.data.inputs?.findIndex(input => input.name === handleId) || 0;
      handleY = node.position.y + (inputIndex + 1) * handleSpacing;
    } 
    else {
      handleX = node.position.x + nodeWidth;
      const outputIndex = node.data.outputs?.findIndex(output => output.name === handleId) || 0;
      handleY = node.position.y + (outputIndex + 1) * handleSpacing;
    }
    
    return { x: handleX, y: handleY };
  };
  
  const getConnectingPath = () => {
    if (!connectingEdge) return '';
    
    const sourcePosition = getHandlePosition(connectingEdge.source, connectingEdge.sourceHandle);
    if (!sourcePosition || !connectingEdge.targetPosition) return '';
    
    const canvasElement = document.querySelector('.cognot-flow-canvas');
    if (!canvasElement) return '';
    
    const canvasRect = canvasElement.getBoundingClientRect();
    const screenX = connectingEdge.targetPosition.x;
    const screenY = connectingEdge.targetPosition.y;
    
    const canvasX = screenX - canvasRect.left;
    const canvasY = screenY - canvasRect.top;
    
    const worldX = (canvasX - viewport.x) / viewport.zoom;
    const worldY = (canvasY - viewport.y) / viewport.zoom;
    
    if (isNaN(sourcePosition.x) || isNaN(sourcePosition.y) || isNaN(worldX) || isNaN(worldY)) {
      return '';
    }
    
    return getBezierPath(sourcePosition.x, sourcePosition.y, worldX, worldY);
  };

  return (
    <svg className="cognot-edges-container" ref={svgRef}>
      {/* Render all connected lines */}
      {edges.map(edge => (
        <CognotEdge
          key={edge.id}
          id={edge.id}
          source={edge.source}
          sourceHandle={edge.sourceHandle}
          target={edge.target}
          targetHandle={edge.targetHandle}
        />
      ))}
      
      {/* Render the temporary lines during the connection process */}
      {connectingEdge && (
        <g className="cognot-edge-connecting">
          <path
            className="cognot-edge-path-connecting"
            d={getConnectingPath()}
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="5,5"
          />
        </g>
      )}
    </svg>
  );
};

export default CognotEdges;
