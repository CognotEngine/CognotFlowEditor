# CognotFlowEditor

一个强大的、基于React的可视化工作流编辑器，支持节点连接、工作流执行和实时状态管理。

## 🚀 特性

- ✨ **可视化编辑**：直观的拖拽式工作流编辑界面
- 🔗 **节点连接**：支持多种节点类型和连接方式
- 🎯 **实时预览**：工作流执行过程的实时可视化反馈
- 🎨 **主题定制**：支持自定义样式和主题
- 📱 **响应式设计**：适配不同屏幕尺寸
- 📦 **易于集成**：简单的API，快速集成到现有项目
- 🔧 **高度可扩展**：支持自定义节点、连线和功能扩展

## 📦 安装

使用npm安装：

```bash
npm install cognot-flow-editor
```

使用yarn安装：

```bash
yarn add cognot-flow-editor
```

## 🚀 快速开始

### 基本使用

```javascript
import React, { useState } from 'react'
import { CognotFlowEditor } from 'cognot-flow-editor'
import 'cognot-flow-editor/dist/style.css'

const App = () => {
  // 初始化工作流数据
  const [workflow, setWorkflow] = useState({
    nodes: [
      {
        id: 'node-1',
        type: 'input',
        position: { x: 100, y: 100 },
        data: { label: '输入节点' }
      },
      {
        id: 'node-2',
        type: 'output',
        position: { x: 400, y: 100 },
        data: { label: '输出节点' }
      }
    ],
    edges: []
  })

  // 处理工作流变化
  const handleWorkflowChange = (newWorkflow) => {
    setWorkflow(newWorkflow)
  }

  // 处理工作流执行
  const handleExecute = () => {
    console.log('执行工作流:', workflow)
    // 在这里实现工作流执行逻辑
  }

  // 处理工作流取消
  const handleCancel = () => {
    console.log('取消执行')
    // 在这里实现工作流取消逻辑
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
```

### 高级使用

```javascript
import React, { useState } from 'react'
import { CognotFlowProvider, CognotFlowCanvas, useCognotFlow } from 'cognot-flow-editor'
import 'cognot-flow-editor/dist/style.css'

// 自定义工具栏组件
const CustomToolbar = () => {
  const { executeWorkflow, cancelExecution, isExecuting } = useCognotFlow()

  return (
    <div className="custom-toolbar">
      <button 
        onClick={executeWorkflow} 
        disabled={isExecuting}
        className={isExecuting ? 'executing' : ''}
      >
        {isExecuting ? '执行中...' : '执行工作流'}
      </button>
      <button 
        onClick={cancelExecution} 
        disabled={!isExecuting}
      >
        取消执行
      </button>
    </div>
  )
}

// 自定义节点点击处理
const handleNodeClick = (event, node) => {
  console.log('节点被点击:', node)
  // 在这里实现节点点击逻辑
}

// 自定义连线点击处理
const handleEdgeClick = (event, edge) => {
  console.log('连线被点击:', edge)
  // 在这里实现连线点击逻辑
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
        {/* 自定义工具栏 */}
        <CustomToolbar />
        
        {/* 仅使用画布组件 */}
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
```

## 📖 API文档

### CognotFlowEditor

主要的工作流编辑器组件，包含工具栏和画布。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `workflow` | `object` | - | 工作流数据，包含nodes和edges数组 |
| `onChange` | `function` | - | 工作流变化时的回调函数 |
| `onExecute` | `function` | - | 执行按钮点击时的回调函数 |
| `onCancel` | `function` | - | 取消按钮点击时的回调函数 |
| `onNodeClick` | `function` | - | 节点点击时的回调函数 |
| `onEdgeClick` | `function` | - | 连线点击时的回调函数 |
| `className` | `string` | - | 自定义CSS类名 |
| `style` | `object` | - | 自定义内联样式 |

### CognotFlowCanvas

工作流画布组件，用于显示和编辑工作流。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `onNodeClick` | `function` | - | 节点点击时的回调函数 |
| `onEdgeClick` | `function` | - | 连线点击时的回调函数 |
| `className` | `string` | - | 自定义CSS类名 |
| `style` | `object` | - | 自定义内联样式 |

### CognotFlowProvider

工作流上下文提供者，用于管理工作流状态。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `workflow` | `object` | - | 工作流数据，包含nodes和edges数组 |
| `onChange` | `function` | - | 工作流变化时的回调函数 |
| `children` | `node` | - | 子组件 |

### useCognotFlow

自定义钩子，用于访问工作流上下文。

```javascript
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
```

## 🎨 自定义节点和连线

### 自定义节点

```javascript
import React from 'react'
import { CognotFlowEditor } from 'cognot-flow-editor'

// 自定义节点组件
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

// 使用自定义节点
const App = () => {
  // ... 状态管理代码

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <CognotFlowEditor 
        workflow={workflow}
        onChange={handleWorkflowChange}
        nodeTypes={{ custom: CustomNode }} // 注册自定义节点
      />
    </div>
  )
}
```

### 自定义连线

```javascript
import React from 'react'
import { CognotFlowEditor } from 'cognot-flow-editor'

// 自定义连线组件
const CustomEdge = ({ id, source, target, sourcePosition, targetPosition, style }) => {
  // 计算连线路径
  const getPath = () => {
    // 实现自定义路径计算逻辑
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

// 使用自定义连线
const App = () => {
  // ... 状态管理代码

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <CognotFlowEditor 
        workflow={workflow}
        onChange={handleWorkflowChange}
        edgeTypes={{ custom: CustomEdge }} // 注册自定义连线
      />
    </div>
  )
}
```

## 🎯 事件处理

### 节点事件

```javascript
const handleNodeClick = (event, node) => {
  console.log('节点被点击:', node)
  // 实现节点点击逻辑
}

const handleNodeDragStart = (event, node) => {
  console.log('节点开始拖拽:', node)
  // 实现节点拖拽开始逻辑
}

const handleNodeDragEnd = (event, node) => {
  console.log('节点拖拽结束:', node)
  // 实现节点拖拽结束逻辑
}
```

### 连线事件

```javascript
const handleEdgeClick = (event, edge) => {
  console.log('连线被点击:', edge)
  // 实现连线点击逻辑
}

const handleConnectionStart = (event, connection) => {
  console.log('连接开始:', connection)
  // 实现连接开始逻辑
}

const handleConnectionEnd = (event, connection) => {
  console.log('连接结束:', connection)
  // 实现连接结束逻辑
}
```

## 🎨 主题定制

### CSS变量

通过覆盖CSS变量来自定义主题：

```css
/* 自定义主题 */
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
```

### 自定义CSS类

通过自定义CSS类来覆盖默认样式：

```css
/* 自定义节点样式 */
.cognot-node {
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 自定义连线样式 */
.cognot-edge-path {
  stroke-dasharray: 5, 5;
  stroke-linecap: round;
}

/* 自定义工具栏样式 */
.cognot-flow-editor-toolbar {
  background-color: #212121;
  color: white;
  padding: 12px;
}
```

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目链接：[https://github.com/yourusername/cognot-flow-editor](https://github.com/yourusername/cognot-flow-editor)
- 问题反馈：[https://github.com/yourusername/cognot-flow-editor/issues](https://github.com/yourusername/cognot-flow-editor/issues)
- 电子邮件：your.email@example.com

## 🙏 致谢

- 感谢 [React](https://reactjs.org/) 提供的优秀框架
- 灵感来自 [ReactFlow](https://reactflow.dev/) 和其他可视化编辑工具
- 感谢所有贡献者的支持和帮助

---

如果您觉得这个项目有用，请给它一个 ⭐️！