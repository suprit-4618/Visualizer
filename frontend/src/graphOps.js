// ── ID counter ────────────────────────────────────────────────────────────────
let _eid = 0;
export const nextEdgeId = () => `e${++_eid}`;
let _nid = 0;
export const nextNodeId = () => `n${++_nid}`;

// ── Adjacency list ────────────────────────────────────────────────────────────
function buildAdj(graph, directed) {
  const adj = {};
  for (const id of Object.keys(graph.nodes)) adj[id] = [];
  for (const e of Object.values(graph.edges)) {
    adj[e.from]?.push({ to: e.to, edgeId: e.id, weight: e.weight ?? 1 });
    if (!directed) adj[e.to]?.push({ to: e.from, edgeId: e.id, weight: e.weight ?? 1 });
  }
  return adj;
}

function findByLabel(graph, label) {
  return Object.values(graph.nodes).find(n => n.label === label) ?? null;
}

// ── Step accumulator (pre-computes states so seeking is fast) ─────────────────
function buildAccStates(steps) {
  const acc = [];
  let ns = {}, es = {}, strip = [], dist = {};
  for (const step of steps) {
    ns = { ...ns }; es = { ...es };
    switch (step.type) {
      case 'start':
        ns[step.nodeId] = 'active';
        strip = step.strip ?? [];
        break;
      case 'visit':
        ns[step.nodeId] = 'active';
        if (step.edgeId) es[step.edgeId] = 'traversed';
        strip = step.strip ?? strip;
        break;
      case 'dequeue':
      case 'pop':
        ns[step.nodeId] = 'visited';
        strip = step.strip ?? strip;
        break;
      case 'backtrack':
        if (step.edgeId) es[step.edgeId] = 'backtrack';
        break;
      case 'relax':
        if (step.edgeId) es[step.edgeId] = 'relaxed';
        ns[step.nodeId] = 'updated';
        dist = { ...dist, ...(step.distLabels ?? {}) };
        break;
      case 'settle':
        ns[step.nodeId] = 'visited';
        break;
      case 'path':
        (step.pathNodes ?? []).forEach(id => { ns[id] = 'path'; });
        (step.pathEdges ?? []).forEach(id => { es[id] = 'path'; });
        strip = [];
        break;
      default: break;
    }
    acc.push({ nodeStates: { ...ns }, edgeStates: { ...es }, strip: [...strip], distLabels: { ...dist }, step });
  }
  return acc;
}

// ── BFS ───────────────────────────────────────────────────────────────────────
function bfs(graph, directed, startLabel) {
  const start = findByLabel(graph, startLabel);
  if (!start) throw new Error(`Node "${startLabel}" not found`);
  const adj = buildAdj(graph, directed);
  const visited = new Set([start.id]);
  const queue = [start.id];
  const steps = [];
  const label = id => graph.nodes[id]?.label ?? id;

  steps.push({ type: 'start', nodeId: start.id, strip: [start.label] });

  while (queue.length) {
    const cur = queue.shift();
    steps.push({ type: 'dequeue', nodeId: cur, strip: queue.map(label) });
    for (const { to, edgeId } of (adj[cur] ?? [])) {
      if (!visited.has(to)) {
        visited.add(to);
        queue.push(to);
        steps.push({ type: 'visit', nodeId: to, edgeId, strip: queue.map(label) });
      }
    }
  }
  return { steps, result: [...visited].map(label).join(', ') };
}

// ── DFS ───────────────────────────────────────────────────────────────────────
function dfs(graph, directed, startLabel) {
  const start = findByLabel(graph, startLabel);
  if (!start) throw new Error(`Node "${startLabel}" not found`);
  const adj = buildAdj(graph, directed);
  const visited = new Set();
  const stackTrace = [start.id];
  const steps = [];
  const label = id => graph.nodes[id]?.label ?? id;

  steps.push({ type: 'start', nodeId: start.id, strip: [start.label] });

  while (stackTrace.length) {
    const cur = stackTrace.pop();
    if (visited.has(cur)) continue;
    visited.add(cur);
    steps.push({ type: 'dequeue', nodeId: cur, strip: stackTrace.map(label) });
    for (const { to, edgeId } of [...(adj[cur] ?? [])].reverse()) {
      if (!visited.has(to)) {
        stackTrace.push(to);
        steps.push({ type: 'visit', nodeId: to, edgeId, strip: stackTrace.map(label) });
      }
    }
  }
  return { steps, result: [...visited].map(label).join(', ') };
}

// ── Dijkstra ──────────────────────────────────────────────────────────────────
function dijkstra(graph, directed, startLabel, endLabel) {
  const start = findByLabel(graph, startLabel);
  const end   = findByLabel(graph, endLabel);
  if (!start) throw new Error(`Node "${startLabel}" not found`);
  if (!end)   throw new Error(`Node "${endLabel}" not found`);

  const adj = buildAdj(graph, directed);
  const ids = Object.keys(graph.nodes);
  const dist = Object.fromEntries(ids.map(id => [id, Infinity]));
  const prev = Object.fromEntries(ids.map(id => [id, null]));
  const prevEdge = Object.fromEntries(ids.map(id => [id, null]));
  const unvisited = new Set(ids);
  dist[start.id] = 0;

  const label = id => graph.nodes[id]?.label ?? id;
  const distStr = () => Object.fromEntries(ids.map(id => [id, dist[id] === Infinity ? '∞' : String(dist[id])]));
  const steps = [];

  steps.push({ type: 'start', nodeId: start.id, strip: [], distLabels: distStr() });

  while (unvisited.size) {
    const cur = [...unvisited].reduce((a, b) => dist[a] <= dist[b] ? a : b);
    if (dist[cur] === Infinity) break;
    unvisited.delete(cur);
    steps.push({ type: 'settle', nodeId: cur, distLabels: distStr() });

    for (const { to, edgeId, weight } of (adj[cur] ?? [])) {
      const alt = dist[cur] + weight;
      if (alt < dist[to]) {
        dist[to] = alt;
        prev[to] = cur;
        prevEdge[to] = edgeId;
        steps.push({ type: 'relax', nodeId: to, edgeId, distLabels: distStr() });
      }
    }
    if (cur === end.id) break;
  }

  // Reconstruct path
  const pathNodes = [], pathEdges = [];
  let cur = end.id;
  while (cur) {
    pathNodes.unshift(cur);
    if (prevEdge[cur]) pathEdges.unshift(prevEdge[cur]);
    cur = prev[cur];
  }
  const totalCost = dist[end.id];
  const pathStr = pathNodes.map(label).join(' → ');
  const resultStr = totalCost === Infinity ? 'No path found' : `${pathStr}  |  cost: ${totalCost}`;

  steps.push({ type: 'path', pathNodes, pathEdges, strip: [] });
  return { steps, result: resultStr, pathNodes, pathEdges };
}

// ── Graph checks ──────────────────────────────────────────────────────────────
function hasCycle(graph, directed) {
  const adj = buildAdj(graph, directed);
  const ids = Object.keys(graph.nodes);
  if (directed) {
    const color = Object.fromEntries(ids.map(id => [id, 0]));
    function dfsColor(v) {
      color[v] = 1;
      for (const { to } of (adj[v] ?? [])) {
        if (color[to] === 1) return true;
        if (color[to] === 0 && dfsColor(to)) return true;
      }
      color[v] = 2; return false;
    }
    return ids.some(id => color[id] === 0 && dfsColor(id));
  } else {
    const parent = Object.fromEntries(ids.map(id => [id, id]));
    function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
    const seen = new Set();
    for (const e of Object.values(graph.edges)) {
      const key = [e.from, e.to].sort().join('|');
      if (seen.has(key)) continue; seen.add(key);
      const pf = find(e.from), pt = find(e.to);
      if (pf === pt) return true;
      parent[pf] = pt;
    }
    return false;
  }
}

function isConnected(graph, directed) {
  const ids = Object.keys(graph.nodes);
  if (ids.length === 0) return true;
  const adj = buildAdj(graph, directed);
  const visited = new Set([ids[0]]);
  const queue = [ids[0]];
  while (queue.length) {
    const cur = queue.shift();
    for (const { to } of (adj[cur] ?? [])) {
      if (!visited.has(to)) { visited.add(to); queue.push(to); }
    }
  }
  return visited.size === ids.length;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function executeGraphOp(graph, directed, weighted, opName, args = {}) {
  let result = null, resultType = '', steps = [], accStates = [],
      logEntry = '', isError = false, nextGraph = graph;

  try {
    switch (opName) {
      case 'addNode': {
        const label = args.label?.trim();
        if (!label) throw new Error('Label required');
        if (findByLabel(graph, label)) throw new Error(`Node "${label}" already exists`);
        const id = nextNodeId();
        const cx = 380 + Math.random() * 80 - 40;
        const cy = 230 + Math.random() * 80 - 40;
        nextGraph = { ...graph, nodes: { ...graph.nodes, [id]: { id, label, x: cx, y: cy } } };
        result = label; resultType = 'str';
        logEntry = `addNode("${label}")`;
        break;
      }
      case 'addEdge': {
        const u = findByLabel(graph, args.from);
        const v = findByLabel(graph, args.to);
        if (!u) throw new Error(`Node "${args.from}" not found`);
        if (!v) throw new Error(`Node "${args.to}" not found`);
        const w = weighted ? (parseFloat(args.weight) || 1) : 1;
        const id = nextEdgeId();
        nextGraph = { ...graph, edges: { ...graph.edges, [id]: { id, from: u.id, to: v.id, weight: w } } };
        result = `${args.from}→${args.to}`; resultType = 'str';
        logEntry = `addEdge("${args.from}", "${args.to}"${weighted ? `, w=${w}` : ''})`;
        break;
      }
      case 'removeNode': {
        const n = findByLabel(graph, args.label);
        if (!n) throw new Error(`Node "${args.label}" not found`);
        const newNodes = { ...graph.nodes };
        delete newNodes[n.id];
        const newEdges = Object.fromEntries(
          Object.entries(graph.edges).filter(([, e]) => e.from !== n.id && e.to !== n.id)
        );
        nextGraph = { ...graph, nodes: newNodes, edges: newEdges };
        result = args.label; resultType = 'str';
        logEntry = `removeNode("${args.label}")`;
        break;
      }
      case 'removeEdge': {
        const u = findByLabel(graph, args.from);
        const v = findByLabel(graph, args.to);
        if (!u || !v) throw new Error('Node not found');
        const edge = Object.values(graph.edges).find(
          e => e.from === u.id && e.to === v.id || (!directed && e.from === v.id && e.to === u.id)
        );
        if (!edge) throw new Error(`Edge ${args.from}→${args.to} not found`);
        const newEdges = { ...graph.edges };
        delete newEdges[edge.id];
        nextGraph = { ...graph, edges: newEdges };
        result = `${args.from}→${args.to}`; resultType = 'str';
        logEntry = `removeEdge("${args.from}", "${args.to}")`;
        break;
      }
      case 'clear':
        nextGraph = { ...graph, nodes: {}, edges: {} };
        result = null; resultType = 'None';
        logEntry = 'graph.clear()';
        break;
      case 'bfs': {
        const r = bfs(graph, directed, args.start);
        steps = r.steps; accStates = buildAccStates(steps);
        result = r.result; resultType = 'str';
        logEntry = `BFS("${args.start}") → ${result}`;
        break;
      }
      case 'dfs': {
        const r = dfs(graph, directed, args.start);
        steps = r.steps; accStates = buildAccStates(steps);
        result = r.result; resultType = 'str';
        logEntry = `DFS("${args.start}") → ${result}`;
        break;
      }
      case 'dijkstra': {
        const r = dijkstra(graph, directed, args.start, args.end);
        steps = r.steps; accStates = buildAccStates(steps);
        result = r.result; resultType = 'str';
        logEntry = `Dijkstra("${args.start}"→"${args.end}") → ${result}`;
        break;
      }
      case 'hasNode': {
        const n = findByLabel(graph, args.label);
        result = !!n; resultType = 'bool';
        logEntry = `hasNode("${args.label}") → ${result}`;
        break;
      }
      case 'hasEdge': {
        const u = findByLabel(graph, args.from);
        const v = findByLabel(graph, args.to);
        result = !!(u && v && Object.values(graph.edges).some(
          e => (e.from === u.id && e.to === v.id) || (!directed && e.from === v.id && e.to === u.id)
        ));
        resultType = 'bool';
        logEntry = `hasEdge("${args.from}", "${args.to}") → ${result}`;
        break;
      }
      case 'degree': {
        const n = findByLabel(graph, args.label);
        if (!n) throw new Error(`Node "${args.label}" not found`);
        const deg = Object.values(graph.edges).filter(
          e => e.from === n.id || e.to === n.id
        ).length;
        result = deg; resultType = 'int';
        logEntry = `degree("${args.label}") → ${result}`;
        break;
      }
      case 'isConnected': {
        result = isConnected(graph, directed); resultType = 'bool';
        logEntry = `isConnected() → ${result}`;
        break;
      }
      case 'hasCycle': {
        result = hasCycle(graph, directed); resultType = 'bool';
        logEntry = `hasCycle() → ${result}`;
        break;
      }
      default: throw new Error('Unknown operation');
    }
  } catch (e) {
    isError = true; result = e.message; resultType = 'str';
    logEntry = `Error: ${e.message}`;
  }

  return { result, resultType, steps, accStates, logEntry, isError, nextGraph };
}
