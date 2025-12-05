import React, { useEffect } from 'react';
import { CognotFlowProvider, useCognotFlow } from '../contexts/CognotFlowContext';
import CognotFlowCanvas from './CognotFlowCanvas';
import CognotPropertyPanel from './CognotPropertyPanel';
import CognotNode from './CognotNode';
import CognotEdges from './CognotEdge';
import './CognotFlowEditor.css';

const CognotFlowEditorContent = ({ workflow, onChange, onExecute, onExecutionUpdate }) => {
  const { 
    nodes, 
    edges, 
    isExecuting, 
    executionProgress, 
    executionStatus, 
    executionResults, 
    executeWorkflow,
    cancelExecution 
  } = useCognotFlow();
  
  useEffect(() => {
    if (onChange) {
      onChange({ nodes, edges });
    }
  }, [nodes, edges, onChange]);
  
  const handleExecute = async () => {
    try {
      await executeWorkflow();
      if (onExecute) {
        onExecute();
      }
    } catch (error) {
      console.error('Execution failed:', error);
    }
  };
  
  const handleCancel = () => {
    cancelExecution();
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Execution Progress Bar */}
      {isExecuting && (
        <div className="cognot-execution-progress">
          <div className="cognot-progress-bar-container">
            <div 
              className="cognot-progress-bar" 
              style={{ width: `${executionProgress}%` }}
            />
          </div>
          <div className="cognot-progress-info">
            <span className="cognot-status-text">{executionStatus}</span>
            <span className="cognot-progress-percentage">{executionProgress}%</span>
            <button 
              className="cognot-cancel-button" 
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="cognot-flow-editor">
        <div className="cognot-flow-main">
          <CognotFlowCanvas>
            <CognotEdges />
            {nodes.map(node => (
              <CognotNode
                key={node.id}
                id={node.id}
                type={node.type}
                position={node.position}
                data={node.data}
              />
            ))}
          </CognotFlowCanvas>
        </div>
        <div className="cognot-flow-sidebar">
          <CognotPropertyPanel />
          
          {/* Execute Button */}
          <div className="cognot-execution-controls">
            <button 
              className="cognot-execute-button" 
              onClick={handleExecute}
              disabled={isExecuting}
            >
              {isExecuting ? 'Executing...' : 'Execute Workflow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CognotFlowEditor = ({ workflow, onWorkflowChange, onExecute, onExecutionUpdate }) => {
  return (
    <CognotFlowEditorContent 
      workflow={workflow} 
      onChange={onWorkflowChange}
      onExecute={onExecute}
      onExecutionUpdate={onExecutionUpdate}
    />
  );
};

export default CognotFlowEditor;