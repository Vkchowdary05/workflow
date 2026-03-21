import React from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './CustomNodes';

const FlowCanvas = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect }) => {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-dark)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#cbd5e1" gap={16} />
        <Controls style={{ background: 'var(--bg-card)', fill: 'var(--text-primary)' }} />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'triggerNode': return '#f59e0b';
              case 'actionNode': return '#3b82f6';
              case 'conditionNode': return '#8b5cf6';
              case 'delayNode': return '#14b8a6';
              default: return '#eee';
            }
          }}
          style={{ background: 'var(--bg-card)' }}
          maskColor="rgba(248, 250, 252, 0.7)"
        />
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
