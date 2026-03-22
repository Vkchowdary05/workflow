import React from 'react';
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

export default function CustomEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style = {}, markerEnd, data, animated
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const onPlusClick = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('add-node-on-edge', {
      detail: {
        edgeId:        id,
        sourceNodeId:  data?.source || id.split('-')[1],
        targetNodeId:  data?.target || id.split('-')[2],
        insertPosition: { x: labelX, y: labelY },
      },
    }));
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke:           style.stroke || '#c5cdd6',
          strokeWidth:      style.strokeWidth || 1.5,
          strokeDasharray:  style.strokeDasharray || '6 4',
          fill:             'none',
        }}
        className={animated ? 'react-flow__edge-path' : ''}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position:  'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={onPlusClick}
            className="add-edge-btn"
            title="Add step here"
          >
            +
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
