import React, { createContext, useContext, useReducer, useEffect } from 'react';

const initialState = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodes: new Set(),
  connectingEdge: null, 
  isConnecting: false, 
  hoveredHandle: null, 
  isExecuting: false,
  executionProgress: 0,
  executionStatus: '',
  executionId: null,
  executionResults: null,
};

const ACTION_TYPES = {
  ADD_NODE: 'ADD_NODE',
  UPDATE_NODE: 'UPDATE_NODE',
  DELETE_NODE: 'DELETE_NODE',
  
  ADD_EDGE: 'ADD_EDGE',
  UPDATE_EDGE: 'UPDATE_EDGE',
  DELETE_EDGE: 'DELETE_EDGE',
  

  UPDATE_VIEWPORT: 'UPDATE_VIEWPORT',
  
  SELECT_NODE: 'SELECT_NODE',
  DESELECT_NODE: 'DESELECT_NODE',
  DESELECT_ALL: 'DESELECT_ALL',
  
  START_CONNECTING: 'START_CONNECTING',
  END_CONNECTING: 'END_CONNECTING',
  UPDATE_CONNECTING_POSITION: 'UPDATE_CONNECTING_POSITION',
  CLEAR_CONNECTING: 'CLEAR_CONNECTING',
  
  SET_HOVERED_HANDLE: 'SET_HOVERED_HANDLE',
  CLEAR_HOVERED_HANDLE: 'CLEAR_HOVERED_HANDLE',
  
  START_EXECUTION: 'START_EXECUTION',
  UPDATE_EXECUTION_STATUS: 'UPDATE_EXECUTION_STATUS',
  END_EXECUTION: 'END_EXECUTION',
  CLEAR_EXECUTION: 'CLEAR_EXECUTION',
};

const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.ADD_NODE:
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
      };
      
    case ACTION_TYPES.UPDATE_NODE:
      return {
        ...state,
        nodes: state.nodes.map(node => 
          node.id === action.payload.id ? { ...node, ...action.payload } : node
        ),
      };
      
    case ACTION_TYPES.DELETE_NODE:
      return {
        ...state,
        nodes: state.nodes.filter(node => node.id !== action.payload),
        edges: state.edges.filter(edge => 
          edge.source !== action.payload && edge.target !== action.payload
        ),
        selectedNodes: new Set([...state.selectedNodes].filter(id => id !== action.payload)),
      };
      
    case ACTION_TYPES.ADD_EDGE:
      return {
        ...state,
        edges: [...state.edges, action.payload],
      };
      
    case ACTION_TYPES.UPDATE_EDGE:
      return {
        ...state,
        edges: state.edges.map(edge => 
          edge.id === action.payload.id ? { ...edge, ...action.payload } : edge
        ),
      };
      
    case ACTION_TYPES.DELETE_EDGE:
      return {
        ...state,
        edges: state.edges.filter(edge => edge.id !== action.payload),
      };
      
    case ACTION_TYPES.UPDATE_VIEWPORT:
      return {
        ...state,
        viewport: { ...state.viewport, ...action.payload },
      };
      
    case ACTION_TYPES.SELECT_NODE:
      return {
        ...state,
        selectedNodes: new Set([...state.selectedNodes, action.payload]),
      };
      
    case ACTION_TYPES.DESELECT_NODE:
      const newSelectedNodes = new Set([...state.selectedNodes]);
      newSelectedNodes.delete(action.payload);
      return {
        ...state,
        selectedNodes: newSelectedNodes,
      };
      
    case ACTION_TYPES.DESELECT_ALL:
      return {
        ...state,
        selectedNodes: new Set(),
      };
      
    case ACTION_TYPES.START_CONNECTING:
      return {
        ...state,
        isConnecting: true,
        connectingEdge: {
          source: action.payload.sourceNodeId,
          sourceHandle: action.payload.sourceHandleId,
          sourcePosition: action.payload.position,
          targetPosition: action.payload.position,
        },
      };
      
    case ACTION_TYPES.UPDATE_CONNECTING_POSITION:
      return {
        ...state,
        connectingEdge: state.connectingEdge ? {
          ...state.connectingEdge,
          targetPosition: action.payload,
        } : null,
      };
      
    case ACTION_TYPES.END_CONNECTING:
      if (!state.connectingEdge) return state;
      
      const newEdge = {
        id: `edge_${Date.now()}`,
        source: state.connectingEdge.source,
        sourceHandle: state.connectingEdge.sourceHandle,
        target: action.payload.targetNodeId,
        targetHandle: action.payload.targetHandleId,
      };
      
      return {
        ...state,
        edges: [...state.edges, newEdge],
        isConnecting: false,
        connectingEdge: null,
      };
      
    case ACTION_TYPES.CLEAR_CONNECTING:
      return {
        ...state,
        isConnecting: false,
        connectingEdge: null,
      };
      
    case ACTION_TYPES.SET_HOVERED_HANDLE:
      return {
        ...state,
        hoveredHandle: action.payload,
      };
      
    case ACTION_TYPES.CLEAR_HOVERED_HANDLE:
      return {
        ...state,
        hoveredHandle: null,
      };
      
    case ACTION_TYPES.START_EXECUTION:
      return {
        ...state,
        isExecuting: true,
        executionProgress: 0,
        executionStatus: 'submitting',
        executionId: null,
        executionResults: null,
      };
      
    case ACTION_TYPES.UPDATE_EXECUTION_STATUS:
      return {
        ...state,
        executionProgress: action.payload.progress,
        executionStatus: action.payload.status,
        executionId: action.payload.executionId,
        executionResults: action.payload.results,
      };
      
    case ACTION_TYPES.END_EXECUTION:
      return {
        ...state,
        isExecuting: false,
        executionResults: action.payload.results,
      };
      
    case ACTION_TYPES.CLEAR_EXECUTION:
      return {
        ...state,
        isExecuting: false,
        executionProgress: 0,
        executionStatus: '',
        executionId: null,
        executionResults: null,
      };
      
    default:
      return state;
  }
};

const CognotFlowContext = createContext(null);

const convertToBackendWorkflow = (workflow) => {
  return {
    nodes: workflow.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data
    })),
    edges: workflow.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      source_handle: edge.sourceHandle,
      target: edge.target,
      target_handle: edge.targetHandle
    }))
  };
};

export const CognotFlowProvider = ({ children, initialWorkflow = { nodes: [], edges: [] } }) => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    nodes: initialWorkflow.nodes || [],
    edges: initialWorkflow.edges || [],
  });
  
  useEffect(() => {
    let intervalId = null;
    
    if (state.isExecuting && state.executionId) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:8000/workflows/execution/${state.executionId}`);
          if (response.ok) {
            const data = await response.json();
            console.log('Execution Status:', data);
            
            let progress = 0;
            if (data.results && data.results.node_count) {
              const completedNodes = Object.keys(data.results).filter(key => key !== 'node_count').length;
              progress = Math.min(100, Math.floor((completedNodes / data.results.node_count) * 100));
            }
            
            dispatch({
              type: ACTION_TYPES.UPDATE_EXECUTION_STATUS,
              payload: {
                status: data.status,
                progress,
                executionId: state.executionId,
                results: data.results,
              }
            });
            
            if (data.status === 'completed' || data.status === 'error') {
              clearInterval(intervalId);
              dispatch({
                type: ACTION_TYPES.END_EXECUTION,
                payload: {
                  results: data.results,
                }
              });
            }
          }
        } catch (error) {
          console.error('Error fetching execution status:', error);
          clearInterval(intervalId);
          dispatch({
            type: ACTION_TYPES.END_EXECUTION,
            payload: {
              results: null,
            }
          });
        }
      }, 500);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state.isExecuting, state.executionId]);
  
  const addNode = (node) => {
    let uniqueNode = { ...node };
    
    if (state.nodes.some(existingNode => existingNode.id === uniqueNode.id)) {
      uniqueNode.id = `node_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    }
    
    if (!uniqueNode.position) {
      const canvasWidth = window.innerWidth * 0.6; 
      const canvasHeight = window.innerHeight;
      
      const centerX = (canvasWidth / 2 - state.viewport.x) / state.viewport.zoom;
      const centerY = (canvasHeight / 2 - state.viewport.y) / state.viewport.zoom;
      
      uniqueNode = {
        ...uniqueNode,
        position: { x: centerX, y: centerY }
      };
    }
    
    dispatch({ type: ACTION_TYPES.ADD_NODE, payload: uniqueNode });
  };
  
  const updateNode = (node) => {
    dispatch({ type: ACTION_TYPES.UPDATE_NODE, payload: node });
  };
  
  const deleteNode = (nodeId) => {
    dispatch({ type: ACTION_TYPES.DELETE_NODE, payload: nodeId });
  };
  
  const addEdge = (edge) => {
    dispatch({ type: ACTION_TYPES.ADD_EDGE, payload: edge });
  };
  
  const updateEdge = (edge) => {
    dispatch({ type: ACTION_TYPES.UPDATE_EDGE, payload: edge });
  };
  
  const deleteEdge = (edgeId) => {
    dispatch({ type: ACTION_TYPES.DELETE_EDGE, payload: edgeId });
  };
  
  const updateViewport = (viewport) => {
    dispatch({ type: ACTION_TYPES.UPDATE_VIEWPORT, payload: viewport });
  };
  
  const selectNode = (nodeId) => {
    dispatch({ type: ACTION_TYPES.SELECT_NODE, payload: nodeId });
  };
  
  const deselectNode = (nodeId) => {
    dispatch({ type: ACTION_TYPES.DESELECT_NODE, payload: nodeId });
  };
  
  const deselectAll = () => {
    dispatch({ type: ACTION_TYPES.DESELECT_ALL });
  };
  
  const startConnecting = (sourceNodeId, sourceHandleId, position) => {
    dispatch({
      type: ACTION_TYPES.START_CONNECTING,
      payload: { sourceNodeId, sourceHandleId, position },
    });
  };
  
  const updateConnectingPosition = (position) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_CONNECTING_POSITION,
      payload: position,
    });
  };
  
  const endConnecting = (targetNodeId, targetHandleId) => {
    dispatch({
      type: ACTION_TYPES.END_CONNECTING,
      payload: { targetNodeId, targetHandleId },
    });
  };
  
  const clearConnecting = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_CONNECTING });
  };
  
  const setHoveredHandle = (handle) => {
    dispatch({ type: ACTION_TYPES.SET_HOVERED_HANDLE, payload: handle });
  };
  
  const clearHoveredHandle = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_HOVERED_HANDLE });
  };
  
  const executeWorkflow = async () => {
    try {

      dispatch({ type: ACTION_TYPES.START_EXECUTION });
      
      const backendWorkflow = convertToBackendWorkflow(state);
      console.log('Execute Workflow:', backendWorkflow);
      
      const response = await fetch('http://localhost:8000/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendWorkflow),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Execution Started:', data);
        
        dispatch({
          type: ACTION_TYPES.UPDATE_EXECUTION_STATUS,
          payload: {
            status: 'pending',
            progress: 0,
            executionId: data.execution_id,
            results: null,
          }
        });
        
        return data.execution_id;
      } else {
        throw new Error('Failed to execute workflow');
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
      dispatch({
        type: ACTION_TYPES.END_EXECUTION,
        payload: {
          results: null,
        }
      });
      throw error;
    }
  };
  
  const cancelExecution = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_EXECUTION });
  };
  
  const contextValue = {
    ...state,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    updateViewport,
    selectNode,
    deselectNode,
    deselectAll,
    startConnecting,
    updateConnectingPosition,
    endConnecting,
    clearConnecting,
    setHoveredHandle,
    clearHoveredHandle,
    executeWorkflow,
    cancelExecution,
  };
  
  return (
    <CognotFlowContext.Provider value={contextValue}>
      {children}
    </CognotFlowContext.Provider>
  );
};

export const useCognotFlow = () => {
  const context = useContext(CognotFlowContext);
  if (!context) {
    throw new Error('useCognotFlow must be used within a CognotFlowProvider');
  }
  return context;
};