import React from 'react';
import { Save, Play, Trash2, List } from 'lucide-react';
import FileUpload from './FileUpload';

const WorkflowControls = ({ 
  onUpload, 
  onSave, 
  onExecute, 
  onDelete, 
  onLoadList,
  currentWorkflowName 
}) => {
  return (
    <div className="workflow-controls panel">
      <div className="controls-left">
        <h2>{currentWorkflowName || 'Workflow Canvas'}</h2>
      </div>
      <div className="controls-right flex-gap">
        <FileUpload onFileUpload={onUpload} />
        <button className="action-btn success" onClick={onSave} title="Save to Database">
          <Save size={16} /> Save
        </button>
        <button className="action-btn warning" onClick={onExecute} title="Execute Workflow">
          <Play size={16} /> Execute
        </button>
        <button className="action-btn secondary" onClick={onLoadList} title="List Workflows">
          <List size={16} /> List
        </button>
        <button className="action-btn danger" onClick={onDelete} title="Delete Workflow">
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
};

export default WorkflowControls;
