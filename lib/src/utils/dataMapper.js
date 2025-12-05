/**
 * Data mapping utility
 * Handles data format conversion and synchronization between frontend and backend
 */

// Frontend to backend data mapping

/**

 * @param {Object} workflow - 
 * @returns {Object} 
 */
export const frontendToBackendWorkflow = (workflow) => {
  if (!workflow) return null
  
  return {
    id: workflow.id || null,
    name: workflow.name || 'Untitled Workflow',
    description: workflow.description || '',
    nodes: workflow.nodes ? workflow.nodes.map(frontendToBackendNode) : [],
    edges: workflow.edges ? workflow.edges.map(frontendToBackendEdge) : [],
    created_at: workflow.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * @param {Object} node - 
 * @returns {Object} 
 */
export const frontendToBackendNode = (node) => {
  if (!node) return null
  
  const typeMap = {
    'InputNode': 'input',
    'OutputNode': 'output',
    'ProcessingNode': 'processing'
  };
  
  const backendType = typeMap[node.type] || node.type;
  
  const inputs = {};
  
  if (node.data.config && node.data.config.defaultValue !== undefined) {
    inputs.value = node.data.config.defaultValue;
  }
  
  if (node.data.config && node.data.config.operation !== undefined) {
    inputs.operation = node.data.config.operation;
  }
  
  if (node.data.config && node.data.config.outputName !== undefined) {
    inputs.outputName = node.data.config.outputName;
  }
  
  return {
    id: node.id,
    type: backendType,
    inputs: inputs,
    data: {
      label: node.data.label || node.type,
      ...(node.data.params || {}),
      ...(node.data.connections || {})
    },
    position: {
      x: node.position.x,
      y: node.position.y
    },
    status: node.status || 'idle',
    execution_time: node.executionTime || null,
    output: node.output || null
  }
}

/**
 * @param {Object} edge - 
 * @returns {Object} 
 */
export const frontendToBackendEdge = (edge) => {
  if (!edge) return null
  
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    source_output: edge.sourceHandle || 'output',
    target_input: edge.targetHandle || 'input',
    source_handle: edge.sourceHandle,
    target_handle: edge.targetHandle,
    label: edge.data?.label || null
  }
}


/**
 * @param {Object} workflow 
 * @returns {Object} 
 */
export const backendToFrontendWorkflow = (workflow) => {
  if (!workflow) return null
  
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    nodes: workflow.nodes ? workflow.nodes.map(backendToFrontendNode) : [],
    edges: workflow.edges ? workflow.edges.map(backendToFrontendEdge) : [],
    createdAt: workflow.created_at,
    updatedAt: workflow.updated_at
  }
}

/**
 * @param {Object} node
 * @returns {Object} 
 */
export const backendToFrontendNode = (node) => {
  if (!node) return null
  
  const label = node.data.label || node.type
  
  const params = { ...node.data }
  delete params.label
  delete params.connections
  
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      label: label,
      params: params,
      connections: node.data.connections || {},
      status: node.status || 'idle',
      executionTime: node.execution_time || null,
      output: node.output || null
    },
    className: `node-${node.status || 'idle'}`
  }
}

/**
 * @param {Object} edge
 * @returns {Object} 
 */
export const backendToFrontendEdge = (edge) => {
  if (!edge) return null
  
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.source_handle,
    targetHandle: edge.target_handle,
    data: {
      label: edge.label || ''
    }
  }
}

// Data synchronization utilities

/**
 * @param {Object} frontendData 
 * @param {Object} backendData 
 * @param {string} syncDirection 
 * @returns {Object} 
 */
export const syncWorkflowData = (frontendData, backendData, syncDirection = 'frontend-to-backend') => {
  if (syncDirection === 'frontend-to-backend') {
    return frontendToBackendWorkflow(frontendData)
  } else {
    return backendToFrontendWorkflow(backendData)
  }
}

/**
 * @param {Object} frontendData
 * @param {Object} backendData
 * @returns {Object} 
 */
export const mergeWorkflowData = (frontendData, backendData) => {
  if (!frontendData) return backendToFrontendWorkflow(backendData)
  if (!backendData) return frontendData
  
  // Use newer data based on update time
  const frontendUpdated = new Date(frontendData.updatedAt || 0)
  const backendUpdated = new Date(backendData.updated_at || 0)
  
  if (frontendUpdated > backendUpdated) {
    return frontendData
  } else {
    return backendToFrontendWorkflow(backendData)
  }
}

// Validation utilities

/**
 * Validate workflow data format
 * @param {Object} workflowData - Workflow data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateWorkflowData = (workflowData) => {
  const errors = []
  
  if (!workflowData) {
    errors.push('Workflow data is null or undefined')
    return { isValid: false, errors }
  }
  
  if (!Array.isArray(workflowData.nodes)) {
    errors.push('Nodes must be an array')
  } else {
    workflowData.nodes.forEach((node, index) => {
      const nodeErrors = validateNodeData(node)
      if (!nodeErrors.isValid) {
        errors.push(`Node at index ${index}: ${nodeErrors.errors.join(', ')}`)
      }
    })
  }
  
  if (!Array.isArray(workflowData.edges)) {
    errors.push('Edges must be an array')
  } else {
    workflowData.edges.forEach((edge, index) => {
      const edgeErrors = validateEdgeData(edge)
      if (!edgeErrors.isValid) {
        errors.push(`Edge at index ${index}: ${edgeErrors.errors.join(', ')}`)
      }
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate node data format
 * @param {Object} nodeData - Node data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateNodeData = (nodeData) => {
  const errors = []
  
  if (!nodeData) {
    errors.push('Node data is null or undefined')
    return { isValid: false, errors }
  }
  
  if (!nodeData.id) {
    errors.push('Node must have an id')
  }
  
  if (!nodeData.type) {
    errors.push('Node must have a type')
  }
  
  if (!nodeData.position || typeof nodeData.position.x !== 'number' || typeof nodeData.position.y !== 'number') {
    errors.push('Node must have valid position coordinates')
  }
  
  if (!nodeData.data) {
    errors.push('Node must have data')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate edge data format
 * @param {Object} edgeData - Edge data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateEdgeData = (edgeData) => {
  const errors = []
  
  if (!edgeData) {
    errors.push('Edge data is null or undefined')
    return { isValid: false, errors }
  }
  
  if (!edgeData.id) {
    errors.push('Edge must have an id')
  }
  
  if (!edgeData.source) {
    errors.push('Edge must have a source node id')
  }
  
  if (!edgeData.target) {
    errors.push('Edge must have a target node id')
  }
  
  if (!edgeData.sourceHandle) {
    errors.push('Edge must have a source handle')
  }
  
  if (!edgeData.targetHandle) {
    errors.push('Edge must have a target handle')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Helper functions

/**
 * Generate a unique ID for nodes or edges
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
export const generateUniqueId = (prefix = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Extract node parameters from backend data
 * @param {Object} node - Backend node data
 * @returns {Object} Node parameters
 */
export const extractNodeParams = (node) => {
  if (!node || !node.data) return {}
  
  const params = { ...node.data }
  delete params.label
  delete params.connections
  delete params.status
  delete params.execution_time
  delete params.output
  
  return params
}
