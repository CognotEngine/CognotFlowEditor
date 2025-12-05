CognotFlowEditor
A powerful React-based visual workflow editor that supports node connection, workflow execution, and real-time state management.
🚀 Features
✨ Visual Editing: Intuitive drag-and-drop workflow editing interface
🔗 Node Connection: Support for multiple node types and connection methods
🎯 Real-time Preview: Real-time visual feedback of workflow execution process
🎨 Theme Customization: Support for custom styles and themes
📱 Responsive Design: Adapts to different screen sizes
📦 Easy Integration: Simple API for quick integration into existing projects
🔧 Highly Extensible: Support for custom nodes, edges, and feature extensions
📦 Installation
Install with npm:
bash
运行
npm install cognot-flow-editor
Install with yarn:
bash
运行
yarn add cognot-flow-editor
🚀 Quick Start
Basic Usage
javascript
运行
import React, { useState } from 'react'
import { CognotFlowEditor } from 'cognot-flow-editor'
import 'cognot-flow-editor/dist/style.css'

const App = () => {
  // Initialize workflow data
  const [workflow, setWorkflow] = useState({
    nodes: [
      {
        id: 'node-1',
        type: 'input',
        position: { x: 100, y: 100 },
        data: { label: 'Input Node' }
      },
      {
        id: 'node-2',
        type: 'output',
        position: { x: 400, y: 100 },
        data: { label: 'Output Node' }
      }
    ],
    edges: []
  })

  // Handle workflow changes
  const handleWorkflowChange = (newWorkflow) => {
    setWorkflow(newWorkflow)
  }

  // Handle workflow execution
  const handleExecute = () => {
    console.log('Execute Workflow:', workflow)
    // Implement workflow execution logic here
  }

  // Handle workflow cancellation
  const handleCancel = () => {
    console.log('Cancel Execution')
    // Implement workflow cancellation logic here
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <CognotFlowEditor
        workflow={workflow}
        onChange={handleWorkflowChange}
        onExecute={handleExecute}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default App
Advanced Usage
javascript
运行
import React, { useState } from 'react'
import { CognotFlowProvider, CognotFlowCanvas, useCognotFlow } from 'cognot-flow-editor'
import 'cognot-flow-editor/dist/style.css'

// Custom toolbar component
const CustomToolbar = () => {
  const { executeWorkflow, cancelExecution, isExecuting } = useCognotFlow()

  return (
    <div className="custom-toolbar">
      <button 
        onClick={executeWorkflow} 
        disabled={isExecuting}
        className={isExecuting ? 'executing' : ''}
      >
        {isExecuting ? 'Executing...' : 'Execute Workflow'}
      </button>
      <button 
        onClick={cancelExecution} 
        disabled={!isExecuting}
      >
        Cancel Execution
      </button>
    </div>
  )
}

// Custom node click handler
const handleNodeClick = (event, node) => {
  console.log('Node Clicked:', node)
  // Implement node click logic here
}

// Custom edge click handler
const handleEdgeClick = (event, edge) => {
  console.log('Edge Clicked:', edge)
  // Implement edge click logic here
}

const App = () => {
  const [workflow, setWorkflow] = useState({
    nodes: [],
    edges: []
  })

  const handleWorkflowChange = (newWorkflow) => {
    setWorkflow(newWorkflow)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CognotFlowProvider workflow={workflow} onChange={handleWorkflowChange}>
        {/* Custom toolbar */}
        <CustomToolbar />
        
        {/* Canvas component only */}
        <div style={{ flex: 1 }}>
          <CognotFlowCanvas 
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
          />
        </div>
      </CognotFlowProvider>
    </div>
  )
}

export default App
📖 API Documentation
CognotFlowEditor
The main workflow editor component, including toolbar and canvas.
Prop	Type	Default	Description
workflow	object	-	Workflow data, including nodes and edges arrays
onChange	function	-	Callback function triggered when workflow changes
onExecute	function	-	Callback function triggered when execute button is clicked
onCancel	function	-	Callback function triggered when cancel button is clicked
onNodeClick	function	-	Callback function triggered when node is clicked
onEdgeClick	function	-	Callback function triggered when edge is clicked
className	string	-	Custom CSS class name
style	object	-	Custom inline style
CognotFlowCanvas
Workflow canvas component for displaying and editing workflows.
Prop	Type	Default	Description
onNodeClick	function	-	Callback function triggered when node is clicked
onEdgeClick	function	-	Callback function triggered when edge is clicked
className	string	-	Custom CSS class name
style	object	-	Custom inline style
CognotFlowProvider
Workflow context provider for managing workflow state.
Prop	Type	Default	Description
workflow	object	-	Workflow data, including nodes and edges arrays
onChange	function	-	Callback function triggered when workflow changes
children	node	-	Child components
useCognotFlow
Custom hook for accessing workflow context.
javascript
运行
const {
  workflow,
  setWorkflow,
  edges,
  setEdges,
  nodes,
  setNodes,
  isConnecting,
  connectingEdge,
  isExecuting,
  executionStatus,
  executeWorkflow,
  cancelExecution
} = useCognotFlow()
🎨 Custom Nodes & Edges
Custom Nodes
javascript
运行
import React from 'react'
import { CognotFlowEditor } from 'cognot-flow-editor'

// Custom node component
const CustomNode = ({ id, data, position, onConnect }) => {
  return (
    <div 
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: 150,
        height: 80,
        backgroundColor: '#4CAF50',
        color: 'white',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'move'
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
        {data.label}
      </div>
      <div 
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: 'white',
          cursor: 'pointer'
        }}
        onClick={(e) => onConnect(e, { source: id, sourceHandle: 'output' })}
      />
    </div>
  )
}

// Use custom node
const App = () => {
  // ... state management code

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <CognotFlowEditor 
        workflow={workflow}
        onChange={handleWorkflowChange}
        nodeTypes={{ custom: CustomNode }} // Register custom node
      />
    </div>
  )
}
Custom Edges
javascript
运行
import React from 'react'
import { CognotFlowEditor } from 'cognot-flow-editor'

// Custom edge component
const CustomEdge = ({ id, source, target, sourcePosition, targetPosition, style }) => {
  // Calculate edge path
  const getPath = () => {
    // Implement custom path calculation logic
  }

  return (
    <path
      id={id}
      d={getPath()}
      style={{
        ...style,
        stroke: '#FF5722',
        strokeWidth: 3,
        fill: 'none'
      }}
    />
  )
}

// Use custom edge
const App = () => {
  // ... state management code

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <CognotFlowEditor 
        workflow={workflow}
        onChange={handleWorkflowChange}
        edgeTypes={{ custom: CustomEdge }} // Register custom edge
      />
    </div>
  )
}
🎯 Event Handling
Node Events
javascript
运行
const handleNodeClick = (event, node) => {
  console.log('Node Clicked:', node)
  // Implement node click logic
}

const handleNodeDragStart = (event, node) => {
  console.log('Node Drag Started:', node)
  // Implement node drag start logic
}

const handleNodeDragEnd = (event, node) => {
  console.log('Node Drag Ended:', node)
  // Implement node drag end logic
}
Edge Events
javascript
运行
const handleEdgeClick = (event, edge) => {
  console.log('Edge Clicked:', edge)
  // Implement edge click logic
}

const handleConnectionStart = (event, connection) => {
  console.log('Connection Started:', connection)
  // Implement connection start logic
}

const handleConnectionEnd = (event, connection) => {
  console.log('Connection Ended:', connection)
  // Implement connection end logic
}
🎨 Theme Customization
CSS Variables
Customize theme by overriding CSS variables:
css
/* Custom theme */
:root {
  --cognot-node-bg-color: #2196F3;
  --cognot-node-text-color: white;
  --cognot-node-border-color: #1976D2;
  --cognot-edge-color: #9E9E9E;
  --cognot-edge-hover-color: #616161;
  --cognot-handle-color: #FFC107;
  --cognot-canvas-bg-color: #F5F5F5;
  --cognot-toolbar-bg-color: #FFFFFF;
  --cognot-toolbar-text-color: #333333;
}
Custom CSS Classes
Override default styles with custom CSS classes:
css
/* Custom node style */
.cognot-node {
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Custom edge style */
.cognot-edge-path {
  stroke-dasharray: 5, 5;
  stroke-linecap: round;
}

/* Custom toolbar style */
.cognot-flow-editor-toolbar {
  background-color: #212121;
  color: white;
  padding: 12px;
}
🤝 Contributing
Contributions are welcome! Follow these steps:
Fork the project
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request
📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
📞 Contact
Project Link: https://github.com/CognotEngine/CognotFlowEditor
Issue Reporting: https://github.com/CognotEngine/CognotFlowEditor/issues
Email: your.aomozx88#gmail.com
🙏 Acknowledgements
Thanks to React for the excellent framework
Inspired by ReactFlow and other visual editing tools
Grateful for the support and help from all contributors
If you find this project useful, please give it a ⭐️!
