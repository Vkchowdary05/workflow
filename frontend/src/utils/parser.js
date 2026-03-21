/**
 * Safely extracts the core workflow object whether it's wrapped in 
 * { workflow: {...} } or given directly.
 */
const getInnerWorkflow = (data) => {
  return data?.workflow || data || {};
};

// Converts Workflow JSON to React Flow Nodes & Edges
export const parseWorkflowToReactFlow = (rawData) => {
  const nodes = [];
  const edges = [];
  const edgeSet = new Set(); // For safe deduplication
  
  if (!rawData) return { nodes, edges };

  const workflow = getInnerWorkflow(rawData);
  const layoutPositions = workflow.canvas_layout?.node_positions || {};

  let currentY = 50;
  
  // 1. Trigger Node Parsing
  if (workflow.trigger) {
    const defaultPos = { x: 300, y: currentY };
    const pos = layoutPositions['trigger'] || workflow.trigger.position || defaultPos;

    nodes.push({
      id: 'trigger',
      type: 'triggerNode',
      data: { 
        label: workflow.trigger.label || workflow.trigger.type,
        details: workflow.trigger 
      },
      position: pos,
    });
    currentY += 150;
  }

  // 2. Steps Parsing
  if (workflow.steps && Array.isArray(workflow.steps)) {
    
    // --- Determine DAG Root (Start Node) ---
    // A start node is one that is NOT the target of any other step.
    const targetIds = new Set();
    workflow.steps.forEach(s => {
      if (s.on_success) targetIds.add(s.on_success);
      if (s.on_failure) targetIds.add(s.on_failure);
      if (s.on_complete) targetIds.add(s.on_complete);
      if (s.branches?.true) targetIds.add(s.branches.true);
      if (s.branches?.false) targetIds.add(s.branches.false);
    });

    const startSteps = workflow.steps.filter(s => !targetIds.has(s.id));
    
    // Connect trigger to the dynamically detected first step
    if (workflow.trigger && startSteps.length > 0) {
      const rootId = startSteps[0].id;
      const edgeId = `e-trigger-${rootId}`;
      if (!edgeSet.has(edgeId)) {
        edges.push({
          id: edgeId,
          source: 'trigger',
          target: rootId,
          type: 'smoothstep',
          animated: true,
        });
        edgeSet.add(edgeId);
      }
    }

    // Basic layout fallback helper
    const getAutoPosition = (step, index) => {
      return { x: 300, y: 50 + ((index + 1) * 150) };
    };

    workflow.steps.forEach((step, index) => {
      // Assign appropriate node types
      let nodeType = 'actionNode';
      if (step.type === 'condition') nodeType = 'conditionNode';
      else if (step.type === 'delay') nodeType = 'delayNode';

      // Use explicit JSON positioning rules: Canvas Layout -> inline pos -> calculated fallback
      const pos = layoutPositions[step.id] || step.position || getAutoPosition(step, index);

      // Preserve entire step to guarantee no data loss on round-trip
      nodes.push({
        id: step.id,
        type: nodeType,
        data: {
          ...step, 
          label: step.label || step.id,
          type: step.type,
          action_type: step.action_type,
          config: step.config,
          step_id: step.id
        },
        position: pos,
      });

      // --- Edge Creation Helper ---
      // We explicitly store `sourceHandle` and `data.type` for bulletproof reverse-parsing
      const addEdgeSafely = (source, target, handleType, label, style) => {
        if (!target) return;
        const eId = `e-${source}-${handleType}-${target}`;
        if (!edgeSet.has(eId)) {
          edges.push({
            id: eId,
            source,
            target,
            sourceHandle: handleType,
            type: 'smoothstep',
            label,
            style,
            data: { type: handleType } 
          });
          edgeSet.add(eId);
        }
      };

      // Map Standard Paths
      if (step.on_success) {
        addEdgeSafely(step.id, step.on_success, 'success', 'Success', { stroke: '#10b981' });
      }
      if (step.on_failure) {
        addEdgeSafely(step.id, step.on_failure, 'failure', 'Failure', { stroke: '#ef4444' });
      }
      if (step.on_complete) {
        addEdgeSafely(step.id, step.on_complete, 'complete', null, null);
      }
      
      // Map Condition Branches
      if (step.branches?.true) {
        addEdgeSafely(step.id, step.branches.true, 'true', 'True', { stroke: '#10b981' });
      }
      if (step.branches?.false) {
        addEdgeSafely(step.id, step.branches.false, 'false', 'False', { stroke: '#ef4444' });
      }
    });
  }

  // Preserve the raw payload so metadata isn't destroyed upon subsequent changes
  return { nodes, edges, _rawPayload: rawData };
};

// Converts React Flow Nodes & Edges back to Workflow JSON
export const parseReactFlowToWorkflow = (nodes, edges, originalRecord) => {
  const steps = [];
  const stepNodes = nodes?.filter(n => n.id !== 'trigger') || [];
  
  // Safely fallback to deeply cloned original context
  const rawPayload = originalRecord?._rawPayload || originalRecord || {};
  const innerWorkflow = getInnerWorkflow(rawPayload);

  // Extract layout map
  const node_positions = {};

  stepNodes.forEach(node => {
    // Clone previous stashed data to maintain bidirectional parity (keeps config, retry rules, variables)
    const step = { ...node.data };

    // Update mandatory identity structures exactly from graph state
    step.id = node.id;
    step.type = node.data.type || 'action';
    if (node.data.label) step.label = node.data.label;

    // Reset routing keys cleanly before applying derived edges
    delete step.on_success;
    delete step.on_failure;
    delete step.on_complete;
    delete step.branches;
    
    // Save coordinate positions explicitly
    node_positions[node.id] = { 
      x: Math.round(node.position.x), 
      y: Math.round(node.position.y) 
    };

    // Calculate routing securely using edge sourceHandles
    const outgoing = edges?.filter(e => e.source === node.id) || [];
    
    outgoing.forEach(edge => {
      // Use logical identifier assigned to edge instead of string label
      const handleType = edge.sourceHandle || edge.data?.type;
      
      if (handleType === 'true') {
        step.branches = step.branches || {};
        step.branches.true = edge.target;
      }
      else if (handleType === 'false') {
        step.branches = step.branches || {};
        step.branches.false = edge.target;
      }
      else if (handleType === 'success') {
        step.on_success = edge.target;
      }
      else if (handleType === 'failure') {
        step.on_failure = edge.target;
      }
      else {
        // Fallback for unconditional logic
        step.on_complete = edge.target;
      }
    });

    // Cleanup auxiliary internal data assigned only for visual react components
    delete step.step_id;

    steps.push(step);
  });

  const triggerNode = nodes?.find(n => n.id === 'trigger');
  
  if (triggerNode) {
    node_positions['trigger'] = { 
      x: Math.round(triggerNode.position.x), 
      y: Math.round(triggerNode.position.y) 
    };
  }

  // Format trigger identical to original schema requirements
  const triggerPayload = triggerNode ? {
    ...triggerNode.data.details,
    type: triggerNode.data.details?.type || 'contact_created',
    label: triggerNode.data.label || triggerNode.data.details?.label || 'Contact Created',
  } : innerWorkflow.trigger || null;

  // Assembly: inject inner workflow components into cloned layout
  const newWorkflowData = {
    ...innerWorkflow,
    trigger: triggerPayload,
    steps,
    canvas_layout: {
      ...(innerWorkflow.canvas_layout || {}),
      node_positions
    }
  };

  // If the parsed file originally had a "workflow" root wrapper, return the exact same wrapper formatting!
  if (rawPayload && rawPayload.workflow) {
    return {
      ...rawPayload,
      workflow: newWorkflowData
    };
  }

  return newWorkflowData;
};
