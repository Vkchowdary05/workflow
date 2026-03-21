import React from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './CustomNodes';

const FlowCanvas = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, isLocked, setIsLocked }) => {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-dark)', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={!isLocked}
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
      <div style={{ position: 'absolute', bottom: 80, left: 10, zIndex: 10 }}>
        <button
          onClick={() => setIsLocked(l => !l)}
          title={isLocked ? 'Unlock canvas (drag within canvas)' : 'Lock canvas (drag to panels)'}
          style={{
            width: 26, height: 26, border: '1px solid #e2e8f0',
            borderRadius: 4, background: isLocked ? '#4f46e5' : '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}
        >
          {isLocked ? '🔓' : '🔒'}
        </button>
      </div>
    </div>
  );
};

export default FlowCanvas;
