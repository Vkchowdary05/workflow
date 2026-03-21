/**
 * parser.js — Workflow ↔ ReactFlow conversion utilities.
 *
 * Exports:
 *   extractWorkflow(rawJson)               — normalize both Format A/B to flat object
 *   validateWorkflow(trigger, steps)        — client-side 5-rule DAG validation
 *   parseWorkflowToReactFlow(extracted)     — convert extracted workflow → ReactFlow {nodes, edges}
 *   prepareForSave(nodes, edges, name, tags)— convert ReactFlow state → backend payload
 */

// ── extractWorkflow ─────────────────────────────────────────────────
export function extractWorkflow(raw) {
  // Format A: Quantixone export — nested under raw.workflow
  if (raw?.workflow?.trigger) {
    const wf = raw.workflow;
    return {
      name:        wf.meta?.name        ?? 'Untitled Workflow',
      description: wf.meta?.description ?? '',
      tags:        wf.meta?.tags        ?? [],
      category:    wf.meta?.category    ?? '',
      trigger:     wf.trigger,
      steps:       wf.steps             ?? [],
      settings:    wf.settings          ?? {},
      positions:   wf.canvas_layout?.node_positions ?? {},
    };
  }
  // Format B: flat backend format — trigger at top level
  return {
    name:        raw.name        ?? 'Untitled Workflow',
    description: raw.description ?? '',
    tags:        raw.tags        ?? [],
    category:    raw.category    ?? '',
    trigger:     raw.trigger     ?? null,
    steps:       raw.steps       ?? [],
    settings:    raw.settings    ?? {},
    positions:   {},
  };
}


// ── validateWorkflow ────────────────────────────────────────────────
export function validateWorkflow(trigger, steps) {
  // Rule 1 — trigger must exist and have a type
  if (!trigger || !trigger.type) {
    return { valid: false, error: 'Trigger is missing or has no "type" field.' };
  }

  // Rule 2 — steps array must not be empty
  if (!steps || steps.length === 0) {
    return { valid: false, error: 'Workflow has no steps — steps array is empty.' };
  }

  // Rule 3 — all step IDs must be unique
  const idSet = new Set();
  for (const step of steps) {
    if (!step.id) return { valid: false, error: 'A step is missing its "id" field.' };
    if (idSet.has(step.id)) return { valid: false, error: `Duplicate step ID found: "${step.id}"` };
    idSet.add(step.id);
  }

  // Helper: collect all outgoing references from a step
  const getRefs = (step) => {
    const out = [];
    if (step.on_success)      out.push({ ref: step.on_success,      field: 'on_success'     });
    if (step.on_failure)      out.push({ ref: step.on_failure,      field: 'on_failure'     });
    if (step.on_complete)     out.push({ ref: step.on_complete,     field: 'on_complete'    });
    if (step.branches?.true)  out.push({ ref: step.branches.true,   field: 'branches.true'  });
    if (step.branches?.false) out.push({ ref: step.branches.false,  field: 'branches.false' });
    return out;
  };

  // Rule 4 — reference integrity
  for (const step of steps) {
    for (const { ref, field } of getRefs(step)) {
      if (!idSet.has(ref)) {
        return {
          valid: false,
          error: `Step "${step.id}" has an invalid reference in "${field}": no step with ID "${ref}" exists.`,
        };
      }
    }
  }

  // Rule 5 — cycle detection via DFS (white / gray / black)
  const graph = {};
  idSet.forEach(id => { graph[id] = []; });
  for (const step of steps) {
    for (const { ref } of getRefs(step)) graph[step.id].push(ref);
  }
  const color = {};
  idSet.forEach(id => { color[id] = 'white'; });

  const dfs = (node) => {
    color[node] = 'gray';
    for (const nb of graph[node] ?? []) {
      if (color[nb] === 'gray')  return `Cycle detected: step "${node}" points back to "${nb}".`;
      if (color[nb] === 'white') { const e = dfs(nb); if (e) return e; }
    }
    color[node] = 'black';
    return null;
  };

  for (const id of idSet) {
    if (color[id] === 'white') {
      const err = dfs(id);
      if (err) return { valid: false, error: err };
    }
  }

  return { valid: true, error: null };
}


// ── parseWorkflowToReactFlow ────────────────────────────────────────
export function parseWorkflowToReactFlow(extracted) {
  const { trigger, steps, positions } = extracted;
  const nodes = [];
  const edges = [];
  const edgeIds = new Set();

  const addEdge = (edge) => {
    if (!edge.target) return;
    if (edgeIds.has(edge.id)) return;
    edgeIds.add(edge.id);
    edges.push(edge);
  };

  // ── Trigger node ──────────────────────────────────────────────────
  if (trigger) {
    nodes.push({
      id: 'trigger',
      type: 'triggerNode',
      position: positions?.['trigger'] ?? { x: 300, y: 50 },
      data: {
        nodeKind:    'trigger',
        label:       trigger.label ?? trigger.type,
        triggerType: trigger.type,
        config:      trigger.config ?? {},
      },
    });
  }

  // ── Step nodes ────────────────────────────────────────────────────
  if (steps && Array.isArray(steps)) {
    steps.forEach((step, index) => {
      const defaultPos = { x: 300, y: 50 + (index + 1) * 180 };
      const pos = positions?.[step.id] ?? step.position ?? defaultPos;

      let nodeType = 'actionNode';
      if (step.type === 'condition') nodeType = 'conditionNode';
      if (step.type === 'delay')     nodeType = 'delayNode';

      nodes.push({
        id:       step.id,
        type:     nodeType,
        position: pos,
        data: {
          nodeKind:      step.type,
          stepId:        step.id,
          label:         step.label ?? step.id,
          actionType:    step.action_type ?? null,
          config:        step.config ?? {},
          duration:      step.config?.duration,
          unit:          step.config?.unit,
          rules:         step.config?.rules ?? [],
          conditionType: step.condition_type ?? null,
          retryPolicy:   step.retry_policy ?? null,
        },
      });

      // ── Edges from this step ──────────────────────────────────────
      if (step.on_success) addEdge({
        id: `e-${step.id}-success`, source: step.id, target: step.on_success,
        sourceHandle: 'success', type: 'smoothstep',
        label: '✓', style: { stroke: '#16a34a', strokeWidth: 1.5 },
        labelStyle: { fill: '#16a34a', fontSize: 11 },
      });
      if (step.on_failure) addEdge({
        id: `e-${step.id}-failure`, source: step.id, target: step.on_failure,
        sourceHandle: 'failure', type: 'smoothstep',
        label: '✗', style: { stroke: '#dc2626', strokeWidth: 1.5 },
        labelStyle: { fill: '#dc2626', fontSize: 11 },
      });
      if (step.on_complete) addEdge({
        id: `e-${step.id}-complete`, source: step.id, target: step.on_complete,
        sourceHandle: 'complete', type: 'smoothstep',
        style: { stroke: '#6366f1', strokeWidth: 1.5 },
      });
      if (step.branches?.true) addEdge({
        id: `e-${step.id}-true`, source: step.id, target: step.branches.true,
        sourceHandle: 'true', type: 'smoothstep',
        label: 'True', style: { stroke: '#16a34a', strokeWidth: 1.5 },
        labelStyle: { fill: '#16a34a', fontSize: 11 },
      });
      if (step.branches?.false) addEdge({
        id: `e-${step.id}-false`, source: step.id, target: step.branches.false,
        sourceHandle: 'false', type: 'smoothstep',
        label: 'False', style: { stroke: '#dc2626', strokeWidth: 1.5 },
        labelStyle: { fill: '#dc2626', fontSize: 11 },
      });
    });

    // ── Trigger → first step edge ───────────────────────────────────
    if (trigger) {
      const allTargets = new Set(edges.map(e => e.target));
      const firstStep = steps.find(s => !allTargets.has(s.id));
      if (firstStep) addEdge({
        id: `e-trigger-${firstStep.id}`,
        source: 'trigger', target: firstStep.id,
        type: 'smoothstep', animated: false,
        style: { stroke: '#6366f1', strokeWidth: 1.5 },
      });
    }
  }

  return { nodes, edges };
}


// ── prepareForSave ──────────────────────────────────────────────────
export function prepareForSave(nodes, edges, workflowName, tags = []) {
  const triggerNode = nodes.find(n => n.id === 'trigger');
  const stepNodes   = nodes.filter(n => n.id !== 'trigger');

  const trigger = {
    type:   triggerNode?.data?.triggerType ?? 'contact_created',
    label:  triggerNode?.data?.label ?? 'Contact Created',
    config: triggerNode?.data?.config ?? {},
  };

  const steps = stepNodes.map(node => {
    const d = node.data;
    const step = {
      id:       node.id,
      type:     d.nodeKind ?? 'action',
      label:    d.label,
      config:   d.config ?? {},
      position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
    };
    if (d.actionType)    step.action_type    = d.actionType;
    if (d.conditionType) step.condition_type  = d.conditionType;
    if (d.retryPolicy)   step.retry_policy   = d.retryPolicy;

    // Reconstruct routing from edges
    const out = edges.filter(e => e.source === node.id);
    for (const edge of out) {
      const h = edge.sourceHandle;
      if      (h === 'success')  step.on_success  = edge.target;
      else if (h === 'failure')  step.on_failure  = edge.target;
      else if (h === 'complete') step.on_complete = edge.target;
      else if (h === 'true')  { step.branches ??= {}; step.branches.true  = edge.target; }
      else if (h === 'false') { step.branches ??= {}; step.branches.false = edge.target; }
      else step.on_success = edge.target; // fallback
    }
    return step;
  });

  return { name: workflowName, trigger, steps, tags };
}
