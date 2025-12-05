import { useCognotFlow } from '../contexts/CognotFlowContext';
import { useState, useRef, useEffect } from 'react';
import './CognotPropertyPanel.css';

const CognotPropertyPanel = () => {
  const { selectedNodes, nodes, updateNode } = useCognotFlow();
  
  const selectedNodeId = Array.from(selectedNodes)[0];
  const selectedNode = selectedNodeId ? nodes.find(node => node.id === selectedNodeId) : null;
  
  if (!selectedNode) {
    return (
      <div className="cognot-property-panel">
        <div className="cognot-property-panel-header">
          <h3>属性面板</h3>
        </div>
        <div className="cognot-property-panel-content">
          <div className="cognot-property-panel-empty">
            选择一个节点查看和编辑属性
          </div>
        </div>
      </div>
    );
  }
  
  const { id, type, data } = selectedNode;
  
  const handlePropertyChange = (paramName, value, path = '') => {
    if (path) {
      const updateNestedParams = (params, pathParts, paramName, value) => {
        const newParams = { ...params };
        let current = newParams;
        
        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];
          const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
          
          if (arrayMatch) {
            const arrayName = arrayMatch[1];
            const index = parseInt(arrayMatch[2]);
            
            if (!current[arrayName]) {
              current[arrayName] = { value: [] };
            }
            if (!current[arrayName].value) {
              current[arrayName].value = [];
            }
            if (i === pathParts.length - 1) {
              if (!current[arrayName].value[index]) {
                current[arrayName].value[index] = {};
              }
              current[arrayName].value[index][paramName] = {
                ...current[arrayName].value[index][paramName],
                value
              };
            } else {
              if (!current[arrayName].value[index]) {
                current[arrayName].value[index] = {};
              }
              current = current[arrayName].value[index];
            }
          } else {
            if (i === pathParts.length - 1) {
              if (!current[part]) {
                current[part] = { value: {} };
              }
              if (!current[part].value) {
                current[part].value = {};
              }
              current[part].value[paramName] = {
                ...current[part].value[paramName],
                value
              };
            } else {
              if (!current[part]) {
                current[part] = { value: {} };
              }
              if (!current[part].value) {
                current[part].value = {};
              }
              current = current[part].value;
            }
          }
        }
        
        return newParams;
      };
      
      const pathParts = path.split('.');
      const newParams = updateNestedParams(data.params, pathParts, paramName, value);
      
      updateNode({
        id,
        data: {
          ...data,
          params: newParams
        }
      });
      
      return;
    }
    
    updateNode({
      id,
      data: {
        ...data,
        params: {
          ...data.params,
          [paramName]: {
            ...data.params[paramName],
            value
          }
        }
      }
    });
  };
  
  const shouldShowParam = (paramName) => {
    const param = data.params[paramName];
    
    if (param?.condition) {
      return evaluateCondition(param.condition, data.params);
    }
    
    if (type.includes('KSampler')) {
      if (paramName === 'noise_offset' && data.params?.add_noise?.value === false) {
        return false;
      }
      if (paramName === 'eta' && !['ddim', 'dpm_solver_++'].includes(data.params?.scheduler?.value)) {
        return false;
      }
    }
    
    return true;
  };

  const evaluateCondition = (condition, params) => {
    if (condition.type === 'AND') {
      return condition.conditions.every(subCondition => 
        evaluateCondition(subCondition, params)
      );
    }
    
    if (condition.type === 'OR') {
      return condition.conditions.some(subCondition => 
        evaluateCondition(subCondition, params)
      );
    }
    
    const { param, operator, value } = condition;
    const paramValue = getParamValue(params, param);
    
    switch (operator) {
      case 'equals':
        return paramValue === value;
      case 'not_equals':
        return paramValue !== value;
      case 'includes':
        return Array.isArray(paramValue) ? paramValue.includes(value) : 
               String(paramValue).includes(String(value));
      case 'not_includes':
        return Array.isArray(paramValue) ? !paramValue.includes(value) : 
               !String(paramValue).includes(String(value));
      case 'greater_than':
        return Number(paramValue) > Number(value);
      case 'less_than':
        return Number(paramValue) < Number(value);
      case 'greater_or_equal':
        return Number(paramValue) >= Number(value);
      case 'less_or_equal':
        return Number(paramValue) <= Number(value);
      case 'is_true':
        return Boolean(paramValue) === true;
      case 'is_false':
        return Boolean(paramValue) === false;
      case 'exists':
        return paramValue !== undefined && paramValue !== null;
      case 'not_exists':
        return paramValue === undefined || paramValue === null;
      default:
        return true;
    }
  };

  const getParamValue = (params, path) => {
    const parts = path.split('.');
    let value = params;
    
    for (const part of parts) {
      const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
      
      if (arrayMatch) {
        const arrayName = arrayMatch[1];
        const index = parseInt(arrayMatch[2]);
        
        if (!value[arrayName] || !Array.isArray(value[arrayName].value)) {
          return undefined;
        }
        
        value = value[arrayName].value[index];
      } else {
        if (!value[part]) {
          return undefined;
        }
        
        value = value[part].value;
      }
    }
    
    return value;
  };
  
  const CollapsibleGroup = ({ title, children, defaultExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    
    return (
      <div className="cognot-property-collapsible-group">
        <div 
          className="cognot-property-collapsible-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h4>{title}</h4>
          <div className={`cognot-property-collapsible-icon ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </div>
        </div>
        {isExpanded && (
          <div className="cognot-property-collapsible-content">
            {children}
          </div>
        )}
      </div>
    );
  };
  
  const renderParameterControl = (paramName, param, path = '') => {
    const value = getParamValue(data.params, path || paramName);
    
    switch (param.type) {
      case 'text':
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handlePropertyChange(paramName, e.target.value, path)}
            className="cognot-property-input"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handlePropertyChange(paramName, parseFloat(e.target.value), path)}
            className="cognot-property-input"
            step={param.step || 'any'}
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handlePropertyChange(paramName, e.target.checked, path)}
            className="cognot-property-checkbox"
          />
        );
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handlePropertyChange(paramName, e.target.value, path)}
            className="cognot-property-select"
          >
            {param.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'searchable_select':
        return (
          <SearchableDropdown
            options={param.options || []}
            value={value || ''}
            onChange={(newValue) => handlePropertyChange(paramName, newValue, path)}
            placeholder={`选择${param.label || paramName}`}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handlePropertyChange(paramName, e.target.value, path)}
            className="cognot-property-input"
          />
        );
    }
  };
  
  const renderParameter = (paramName, param, path = '') => {
    if (param.type === 'object' && param.properties) {
      return (
        <CollapsibleGroup key={paramName} title={param.label || paramName} defaultExpanded={false}>
          {Object.entries(param.properties).map(([subParamName, subParam]) => 
            renderParameter(subParamName, subParam, path ? `${path}.${paramName}` : paramName)
          )}
        </CollapsibleGroup>
      );
    }

    if (param.type === 'array' && param.items) {
      const arrayValue = getParamValue(data.params, path || paramName) || [];
      return (
        <div key={paramName} className="cognot-property-item">
          <div className="cognot-property-label-container">
            <label>{param.label || paramName}:</label>
            {param.description && (
              <div className="cognot-property-description">
                {param.description}
              </div>
            )}
          </div>
          <div className="cognot-property-array">
            {arrayValue.map((item, index) => (
              <div key={index} className="cognot-property-array-item">
                <div className="cognot-property-array-index">{index + 1}.</div>
                {renderParameter(`${paramName}[${index}]`, param.items, path ? `${path}.${paramName}[${index}]` : `${paramName}[${index}]`)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={paramName} className="cognot-property-item">
        <div className="cognot-property-label-container">
          <label>{param.label || paramName}:</label>
          {param.description && (
            <div className="cognot-property-description">
              {param.description}
            </div>
          )}
          {param.required && (
            <span className="cognot-property-required">*</span>
          )}
        </div>
        {renderParameterControl(paramName, param, path)}
      </div>
    );
  };
  
  const groupParams = () => {
    const coreParams = [];
    const advancedParams = [];
    const loraParams = [];
    const controlNetParams = [];
    const otherParams = [];
    
    if (!data.params || typeof data.params !== 'object' || Array.isArray(data.params)) {
      return {
        coreParams,
        advancedParams,
        loraParams,
        controlNetParams,
        otherParams
      };
    }
    
    Object.entries(data.params).forEach(([paramName, param]) => {
      const lowerName = paramName.toLowerCase();
      
      if (type.includes('KSampler') && ['seed', 'steps', 'cfg'].includes(lowerName)) {
        coreParams.push([paramName, param]);
      }
      else if (type.includes('Checkpoint') && lowerName.includes('model_name')) {
        coreParams.push([paramName, param]);
      }
      else if (lowerName.includes('lora')) {
        loraParams.push([paramName, param]);
      }
      else if (lowerName.includes('controlnet') || lowerName.includes('control_net')) {
        controlNetParams.push([paramName, param]);
      }
      else if (type.includes('KSampler') && ['sampler_name', 'scheduler'].includes(lowerName)) {
        advancedParams.push([paramName, param]);
      }
      else {
        otherParams.push([paramName, param]);
      }
    });
    
    return {
      coreParams,
      advancedParams,
      loraParams,
      controlNetParams,
      otherParams
    };
  };
  
  const groupedParams = groupParams();
  
  const SearchableDropdown = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    const filteredOptions = options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return (
      <div className="cognot-property-searchable-dropdown" ref={dropdownRef}>
        <div 
          className="cognot-property-dropdown-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          {value}
          <span className="cognot-property-dropdown-arrow">▼</span>
        </div>
        {isOpen && (
          <div className="cognot-property-dropdown-menu">
            <input
              type="text"
              className="cognot-property-dropdown-search"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="cognot-property-dropdown-options">
              {filteredOptions.map((option) => (
                <div
                  key={option}
                  className={`cognot-property-dropdown-option ${option === value ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {option}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="cognot-property-dropdown-no-results">
                  No matching options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="cognot-property-panel">
      <div className="cognot-property-panel-header">
        <h3>属性面板</h3>
      </div>
      
      <div className="cognot-property-panel-content">
        {/* Node Information - Enhanced UI */}
        <div className="cognot-property-section">
          <h4>节点信息</h4>
          <div className="cognot-property-node-info">
            <div className="cognot-property-item">
              <div className="cognot-property-label-container">
                <label>ID:</label>
              </div>
              <div className="cognot-property-readonly-container">
                <input 
                  type="text" 
                  value={id} 
                  readOnly 
                  className="cognot-property-readonly"
                />
                <button 
                  className="cognot-property-copy-btn"
                  onClick={() => navigator.clipboard.writeText(id)}
                  title="复制ID"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="cognot-property-item">
              <div className="cognot-property-label-container">
                <label>Execution Status:</label>
              </div>
              <div className="cognot-property-status">
                {data.executionStatus === 'completed' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#4CAF50', 
                        borderRadius: '50%' 
                      }}
                    />
                    <span>Completed</span>
                  </div>
                ) : data.executionStatus === 'running' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#FFC107', 
                        borderRadius: '50%',
                        animation: 'pulse 1s infinite' 
                      }}
                    />
                    <span>Running</span>
                  </div>
                ) : data.executionStatus === 'error' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#F44336', 
                        borderRadius: '50%' 
                      }}
                    />
                    <span>Failed</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#888', 
                        borderRadius: '50%' 
                      }}
                    />
                    <span>Pending</span>
                  </div>
                )}
              </div>
            </div>
            <div className="cognot-property-item">
              <div className="cognot-property-label-container">
                <label>类型:</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="text" 
                  value={type} 
                  readOnly 
                  className="cognot-property-readonly"
                />
                <button 
                  style={{ 
                    padding: '2px 6px', 
                    fontSize: '10px', 
                    backgroundColor: '#2196F3', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '3px', 
                    cursor: 'pointer' 
                  }}
                  title="View Node Documentation"
                >
                  ?
                </button>
              </div>
            </div>
            <div className="cognot-property-item">
              <div className="cognot-property-label-container">
                <label>名称:</label>
              </div>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateNode({
                  id,
                  data: {
                    ...data,
                    label: e.target.value
                  }
                })}
              />
            </div>
          </div>
        </div>
        
        {/* PreviewImageFunction-SpecificNodeTypes */}
        {(type.includes('Image') || type.includes('KSampler') || type.includes('VAE') || data.preview) && (
          <div className="cognot-property-section">
            <h4>预览</h4>
            <div className="cognot-property-item">
              <div 
                style={{ 
                  width: '100%', 
                  height: '200px', 
                  backgroundColor: '#2a2a2a', 
                  border: '1px solid #444', 
                  borderRadius: '4px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  cursor: 'pointer', 
                  overflow: 'hidden'
                }}
              >
                {data.preview ? (
                  <img 
                    src={data.preview} 
                    alt="Node Preview" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ color: '#888', fontSize: '12px' }}>暂无预览</span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* NodeParams-CollapsibleGroups */}
        {data.params && Object.keys(data.params).length > 0 && (
          <div className="cognot-property-section">
            {/* Dynamically Render All Parameter Groups */}
            {Object.entries(groupedParams).map(([groupName, params]) => {
              if (params.length === 0) return null;
              
              const groupNameMap = {
                core: 'Core Parameters',
                advanced: 'Advanced Parameters',
                lora: 'Lora Parameters',
                controlnet: 'ControlNet Parameters',
                other: 'Other Parameters'
              };
              
              const displayName = groupNameMap[groupName] || groupName;
              const defaultExpanded = groupName === 'core';
              
              return (
                <CollapsibleGroup key={groupName} title={displayName} defaultExpanded={defaultExpanded}>
                  {params.map(([paramName, param]) => (
                    shouldShowParam(paramName) && renderParameter(paramName, param)
                  ))}
                </CollapsibleGroup>
              );
            })}
          </div>
        )}
        
        {/* Node Port Information */}
        {(data.inputs || data.outputs) && (
          <div className="comfy-property-section">
            <h4>端口</h4>
            
            {/* Input Port */}
            {data.inputs && (
              <div className="cognot-property-ports">
                <h5>Input Port</h5>
                {data.inputs.map((input) => (
                  <div key={input.name} className="cognot-property-port-item">
                    <span className="cognot-property-port-name">{input.name}</span>
                    <span className="cognot-property-port-type">{input.type}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Output Port */}
            {data.outputs && (
              <div className="cognot-property-ports">
                <h5>Output Port</h5>
                {data.outputs.map((output) => (
                  <div key={output.name} className="cognot-property-port-item">
                    <span className="cognot-property-port-name">{output.name}</span>
                    <span className="cognot-property-port-type">{output.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CognotPropertyPanel;