import React from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './CustomNodes';

export default function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onInit }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#c5cdd6', strokeWidth: 1.5 },
        }}
        attributionPosition="bottom-right"
      >
        <Background color="#dde1e7" gap={20} size={1} />
        <Controls style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
        <MiniMap
          nodeColor={n =>
            n.type === 'triggerNode'   ? '#6c63ff' :
            n.type === 'conditionNode' ? '#f39c12' :
            n.type === 'delayNode'     ? '#8e44ad' : '#1b6ac9'
          }
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
          maskColor="rgba(244,245,247,0.7)"
        />
      </ReactFlow>
    </div>
  );
}
