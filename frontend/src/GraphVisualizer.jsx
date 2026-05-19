import React, { useState, useRef, useCallback, useEffect } from 'react';
import './GraphVisualizer.css';
import './StackVisualizer.css'; // stv-* panel classes
import { executeGraphOp, nextNodeId, nextEdgeId } from './graphOps';

// ── Default graph ──────────────────────────────────────────────────────────────
const DEFAULT_GRAPH = {
  nodes: {
    nA: { id: 'nA', label: 'A', x: 400, y: 80  },
    nB: { id: 'nB', label: 'B', x: 200, y: 230 },
    nC: { id: 'nC', label: 'C', x: 600, y: 230 },
    nD: { id: 'nD', label: 'D', x: 150, y: 400 },
    nE: { id: 'nE', label: 'E', x: 560, y: 400 },
  },
  edges: {
    e1: { id: 'e1', from: 'nA', to: 'nB', weight: 4 },
    e2: { id: 'e2', from: 'nA', to: 'nC', weight: 2 },
    e3: { id: 'e3', from: 'nB', to: 'nD', weight: 5 },
    e4: { id: 'e4', from: 'nC', to: 'nE', weight: 3 },
    e5: { id: 'e5', from: 'nB', to: 'nC', weight: 1 },
    e6: { id: 'e6', from: 'nD', to: 'nE', weight: 2 },
  }
};
const R = 22; // node radius

// ── Edge geometry ─────────────────────────────────────────────────────────────
function edgePts(from, to, directed) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / d, uy = dy / d;
  const x1 = from.x + ux * R, y1 = from.y + uy * R;
  const gap = directed ? R + 9 : R;
  const x2 = to.x - ux * gap, y2 = to.y - uy * gap;
  return { x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
}

// ── SVG Canvas ────────────────────────────────────────────────────────────────
function GraphCanvas({ graph, directed, weighted, nodeStates, edgeStates, distLabels,
                       onDragStart, onDragMove, onDragEnd, newNodeId }) {
  const nodes = graph.nodes, edges = graph.edges;

  const markerFor = cls => {
    if (cls === 'path') return 'url(#arrow-amber)';
    if (cls === 'traversed') return 'url(#arrow-teal)';
    return 'url(#arrow-default)';
  };

  return (
    <svg className="graph-svg" viewBox="0 0 800 500"
      onMouseMove={onDragMove} onMouseUp={onDragEnd} onMouseLeave={onDragEnd}>

      <defs>
        {[
          ['arrow-default', 'rgba(255,255,255,0.35)'],
          ['arrow-teal',    '#2dd4bf'],
          ['arrow-amber',   '#f59e0b'],
        ].map(([id, color]) => (
          <marker key={id} id={id} markerWidth="8" markerHeight="8"
            refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={color} />
          </marker>
        ))}
      </defs>

      {/* ── Edges ── */}
      {Object.values(edges).map(e => {
        const fn = nodes[e.from], tn = nodes[e.to];
        if (!fn || !tn) return null;
        if (e.from === e.to) return null; // skip self-loops
        const { x1, y1, x2, y2, mx, my } = edgePts(fn, tn, directed);
        const cls = edgeStates[e.id] || 'default';
        return (
          <g key={e.id}>
            <line className={`ge-${cls}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              markerEnd={directed ? markerFor(cls) : undefined} />
            {weighted && (
              <g>
                <rect className="graph-weight-pill" x={mx - 10} y={my - 8} width={20} height={16} rx={4} />
                <text className="graph-weight-label" x={mx} y={my}
                  textAnchor="middle" dominantBaseline="central">{e.weight}</text>
              </g>
            )}
          </g>
        );
      })}

      {/* ── Nodes ── */}
      {Object.values(nodes).map(n => {
        const cls = nodeStates[n.id] || 'default';
        const isNew = newNodeId === n.id;
        return (
          <g key={n.id} className="tree-node-g"
            transform={`translate(${n.x},${n.y})`}
            onMouseDown={ev => onDragStart(ev, n.id)}
            style={{ cursor: 'grab' }}>
            <circle className={`gn-${cls}`} r={R}
              style={isNew ? { animation: 'nodePop 0.35s cubic-bezier(0.34,1.56,0.64,1)' } : {}} />
            <text className="graph-node-label" textAnchor="middle" dominantBaseline="central">
              {n.label}
            </text>
            {distLabels[n.id] !== undefined && (
              <text className="graph-dist-label" x={R - 2} y={-(R - 2)}
                textAnchor="middle" dominantBaseline="central">
                {distLabels[n.id]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Strip (queue / stack display) ─────────────────────────────────────────────
function StripDisplay({ items, label }) {
  return (
    <div className="graph-strip-wrapper">
      <span className="graph-strip-label">{label}:</span>
      <div className="graph-strip-items">
        {items.length === 0
          ? <span style={{ color: '#444', fontFamily: 'monospace', fontSize: 12 }}>empty</span>
          : items.map((v, i) => <span key={i} className="graph-strip-chip">{v}</span>)
        }
      </div>
    </div>
  );
}

// ── Step controls ─────────────────────────────────────────────────────────────
function StepControls({ stepIdx, total, isPlaying, speed, onPrev, onNext, onPlay, onSpeedChange }) {
  if (total === 0) return null;
  return (
    <div className="graph-step-controls">
      <button className="graph-step-btn" onClick={onPrev} disabled={stepIdx <= 0}>◀</button>
      <button className="graph-step-btn play-btn" onClick={onPlay}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button className="graph-step-btn" onClick={onNext} disabled={stepIdx >= total - 1}>▶</button>
      <span style={{ fontSize: 11, color: '#555' }}>Speed</span>
      <input type="range" className="graph-speed-slider"
        min={100} max={1200} step={100} value={speed}
        onChange={e => onSpeedChange(Number(e.target.value))} />
      <span className="graph-step-counter">{stepIdx + 1} / {total}</span>
    </div>
  );
}

// ── Result + Log ──────────────────────────────────────────────────────────────
function ResultDisplay({ result }) {
  if (!result) return (
    <div className="stv-card">
      <div className="stv-header">Result</div>
      <div style={{ color: '#666', fontStyle: 'italic', padding: '8px 0' }}>No result yet.</div>
    </div>
  );
  const isErr = result.isError;
  return (
    <div className="stv-card">
      <div className="stv-header">Result</div>
      <div>
        <span className="stv-result-val" style={{ color: isErr ? '#ff5252' : undefined, fontSize: 16, wordBreak: 'break-all' }}>
          {typeof result.value === 'boolean' ? (result.value ? 'True' : 'False') : result.value}
        </span>
        <span className="stv-badge"
          style={isErr ? { background: 'rgba(255,82,82,0.1)', color: '#ff5252' } : {}}>
          {isErr ? 'error' : result.type}
        </span>
      </div>
    </div>
  );
}

function OperationLog({ logs }) {
  return (
    <div className="stv-card">
      <div className="stv-header">Operation Log</div>
      <div className="stv-log-container">
        {logs.length === 0 && <span style={{ color: '#666' }}>Log is empty.</span>}
        {logs.map((l, i) => (
          <div key={i} className={l.isError ? 'stv-log-error' : 'stv-log-success'}>
            <span className="stv-log-time">[{l.timestamp}]</span>{l.expression}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Op panel ──────────────────────────────────────────────────────────────────
function OpForm({ op, weighted, onRun }) {
  const [args, setArgs] = useState({});
  useEffect(() => setArgs({}), [op]);
  if (!op) return null;

  const set = (k, v) => setArgs(p => ({ ...p, [k]: v }));
  const inputs = {
    addNode:     [['label', 'node label']],
    addEdge:     [['from', 'from node'], ['to', 'to node'], ...(weighted ? [['weight', 'weight']] : [])],
    removeNode:  [['label', 'node label']],
    removeEdge:  [['from', 'from node'], ['to', 'to node']],
    bfs:         [['start', 'start node']],
    dfs:         [['start', 'start node']],
    dijkstra:    [['start', 'start node'], ['end', 'end node']],
    hasNode:     [['label', 'node label']],
    hasEdge:     [['from', 'from node'], ['to', 'to node']],
    degree:      [['label', 'node label']],
  };
  const fields = inputs[op] ?? [];

  return (
    <div className="stv-form">
      {fields.map(([key, ph]) => (
        <input key={key} className="stv-form-input" placeholder={ph}
          value={args[key] ?? ''}
          onChange={e => set(key, e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onRun(args)} />
      ))}
      <button className="stv-btn" onClick={() => onRun(args)}>Run</button>
    </div>
  );
}

function OpItem({ op, activeOp, setActiveOp }) {
  const labels = { addNode: 'add node', addEdge: 'add edge', removeNode: 'remove node',
    removeEdge: 'remove edge', bfs: 'BFS', dfs: 'DFS', dijkstra: 'Dijkstra',
    hasNode: 'has node', hasEdge: 'has edge', isConnected: 'is connected', hasCycle: 'has cycle' };
  return (
    <div className={`stv-op-item ${activeOp === op ? 'active' : ''}`} onClick={() => setActiveOp(op)}>
      <span className="stv-op-name">{labels[op] || op}</span>
    </div>
  );
}

function OpGroup({ label, ops, activeOp, setActiveOp, weighted, onRun }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="stv-header" onClick={() => setOpen(o => !o)}>
        {label} <span>{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ops.map(op => <OpItem key={op} op={op} activeOp={activeOp} setActiveOp={setActiveOp} />)}
          {ops.includes(activeOp) && <OpForm op={activeOp} weighted={weighted} onRun={onRun} />}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GraphVisualizer() {
  const [graph, setGraph]           = useState(DEFAULT_GRAPH);
  const [directed, setDirected]     = useState(true);
  const [weighted, setWeighted]     = useState(true);
  const [activeOp, setActiveOp]     = useState(null);
  const [result, setResult]         = useState(null);
  const [logs, setLogs]             = useState([]);

  // Visual states
  const [nodeStates, setNodeStates] = useState({});
  const [edgeStates, setEdgeStates] = useState({});
  const [distLabels, setDistLabels] = useState({});
  const [stripItems, setStripItems] = useState([]);
  const [stripLabel, setStripLabel] = useState('Queue');
  const [newNodeId, setNewNodeId]   = useState(null);

  // Step player
  const [accStates, setAccStates]   = useState([]);
  const [stepIdx, setStepIdx]       = useState(-1);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [speed, setSpeed]           = useState(500);
  const playRef = useRef(null);

  // Drag
  const dragRef = useRef(null);
  const svgRef  = useRef(null);

  // ── Apply step index ──
  const applyStep = useCallback((idx, states) => {
    if (!states || idx < 0 || idx >= states.length) return;
    const s = states[idx];
    setNodeStates(s.nodeStates);
    setEdgeStates(s.edgeStates);
    setStripItems(s.strip);
    setDistLabels(s.distLabels);
  }, []);

  // ── Step player controls ──
  const stopPlay = useCallback(() => {
    clearInterval(playRef.current);
    setIsPlaying(false);
  }, []);

  const startPlay = useCallback((currentIdx, states) => {
    clearInterval(playRef.current);
    setIsPlaying(true);
    playRef.current = setInterval(() => {
      setStepIdx(prev => {
        const next = prev + 1;
        if (next >= states.length) {
          clearInterval(playRef.current);
          setIsPlaying(false);
          return prev;
        }
        applyStep(next, states);
        return next;
      });
    }, speed);
  }, [speed, applyStep]);

  const handlePrev = () => {
    stopPlay();
    const next = Math.max(0, stepIdx - 1);
    setStepIdx(next);
    applyStep(next, accStates);
  };

  const handleNext = () => {
    stopPlay();
    const next = Math.min(accStates.length - 1, stepIdx + 1);
    setStepIdx(next);
    applyStep(next, accStates);
  };

  const handlePlayPause = () => {
    if (isPlaying) { stopPlay(); }
    else { startPlay(stepIdx, accStates); }
  };

  useEffect(() => { return () => clearInterval(playRef.current); }, []);

  // Reset visuals when switching ops
  useEffect(() => {
    stopPlay();
    setNodeStates({});
    setEdgeStates({});
    setDistLabels({});
    setStripItems([]);
    setAccStates([]);
    setStepIdx(-1);
    setResult(null);
  }, [activeOp]);

  // ── Handle run ──
  const handleRun = useCallback((args) => {
    if (!activeOp) return;
    stopPlay();

    const res = executeGraphOp(graph, directed, weighted, activeOp, args);
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [{ timestamp: time, expression: res.logEntry, isError: res.isError }, ...prev].slice(0, 6));

    if (res.isError) {
      setResult({ value: res.result, type: 'error', isError: true });
      return;
    }

    // Commit graph mutations
    if (['addNode','addEdge','removeNode','removeEdge','clear'].includes(activeOp)) {
      setGraph(res.nextGraph);
      setNodeStates({}); setEdgeStates({}); setDistLabels({}); setStripItems([]);
      setAccStates([]); setStepIdx(-1);
      if (res.result !== null) setResult({ value: res.result, type: res.resultType });
      if (activeOp === 'addNode') {
        const newId = Object.keys(res.nextGraph.nodes).at(-1);
        setNewNodeId(newId);
        setTimeout(() => setNewNodeId(null), 500);
      }
      return;
    }

    // Scalar check ops
    if (['hasNode','hasEdge','degree','isConnected','hasCycle'].includes(activeOp)) {
      setResult({ value: res.result, type: res.resultType });
      return;
    }

    // Traversal / pathfinding — set up step player
    const states = res.accStates;
    setAccStates(states);
    setStepIdx(0);
    applyStep(0, states);
    setStripLabel(activeOp === 'dfs' ? 'Stack' : activeOp === 'bfs' ? 'Queue' : 'Settled');
    setResult({ value: res.result, type: res.resultType });
  }, [activeOp, graph, directed, weighted, stopPlay, applyStep]);

  // ── Dragging ──
  const handleDragStart = useCallback((e, nodeId) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { nodeId };
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current || !svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
    const { nodeId } = dragRef.current;
    setGraph(g => ({
      ...g,
      nodes: { ...g.nodes, [nodeId]: { ...g.nodes[nodeId], x: Math.max(R, Math.min(800 - R, x)), y: Math.max(R, Math.min(500 - R, y)) } }
    }));
  }, []);

  const handleDragEnd = useCallback(() => { dragRef.current = null; }, []);

  // Attach svg ref to the wrapper via callback ref on svg element
  const svgCallbackRef = useCallback((el) => { svgRef.current = el; }, []);

  return (
    <div className="graph-vis-container">
      {/* ── Left column ── */}
      <div className="graph-vis-middle">
        {/* Mode toggles */}
        <div className="graph-mode-bar">
          <span style={{ fontSize: 11, color: '#555', marginRight: 4 }}>MODE:</span>
          <button className={`graph-mode-btn ${directed ? 'active' : ''}`}
            onClick={() => setDirected(d => !d)}>
            {directed ? 'Directed' : 'Undirected'}
          </button>
          <button className={`graph-mode-btn amber ${weighted ? 'active' : ''}`}
            onClick={() => setWeighted(w => !w)}>
            {weighted ? 'Weighted' : 'Unweighted'}
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#555' }}>
            {Object.keys(graph.nodes).length}N · {Object.keys(graph.edges).length}E
          </span>
        </div>

        {/* Canvas */}
        <div className="graph-canvas-wrapper">
          <div className="graph-dot-grid" />
          <div className="graph-canvas-label">Graph Canvas · drag nodes freely</div>
          <svg ref={svgCallbackRef} className="graph-svg" viewBox="0 0 800 500"
            onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
            <defs>
              {[['arrow-default','rgba(255,255,255,0.35)'],['arrow-teal','#2dd4bf'],['arrow-amber','#f59e0b']].map(([id, c]) => (
                <marker key={id} id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={c} />
                </marker>
              ))}
            </defs>

            {/* Edges */}
            {Object.values(graph.edges).map(e => {
              const fn = graph.nodes[e.from], tn = graph.nodes[e.to];
              if (!fn || !tn || e.from === e.to) return null;
              const { x1, y1, x2, y2, mx, my } = edgePts(fn, tn, directed);
              const cls = edgeStates[e.id] || 'default';
              const mkr = cls === 'path' ? 'url(#arrow-amber)' : cls === 'traversed' || cls === 'relaxed' ? 'url(#arrow-teal)' : 'url(#arrow-default)';
              return (
                <g key={e.id}>
                  <line className={`ge-${cls}`} x1={x1} y1={y1} x2={x2} y2={y2}
                    markerEnd={directed ? mkr : undefined} />
                  {weighted && (
                    <g>
                      <rect className="graph-weight-pill" x={mx - 11} y={my - 9} width={22} height={16} rx={4} />
                      <text className="graph-weight-label" x={mx} y={my}
                        textAnchor="middle" dominantBaseline="central">{e.weight}</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {Object.values(graph.nodes).map(n => {
              const cls = nodeStates[n.id] || 'default';
              return (
                <g key={n.id} transform={`translate(${n.x},${n.y})`}
                  onMouseDown={ev => handleDragStart(ev, n.id)}
                  style={{ cursor: 'grab' }}>
                  <circle className={`gn-${cls}`} r={R}
                    style={newNodeId === n.id ? { animation: 'nodePop 0.35s cubic-bezier(0.34,1.56,0.64,1)' } : {}} />
                  <text className="graph-node-label" textAnchor="middle" dominantBaseline="central">{n.label}</text>
                  {distLabels[n.id] !== undefined && (
                    <text className="graph-dist-label" x={R} y={-R} textAnchor="middle" dominantBaseline="central">
                      {distLabels[n.id]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Strip */}
        {accStates.length > 0 && (
          <StripDisplay items={stripItems} label={stripLabel} />
        )}

        {/* Step controls */}
        <StepControls
          stepIdx={stepIdx} total={accStates.length}
          isPlaying={isPlaying} speed={speed}
          onPrev={handlePrev} onNext={handleNext}
          onPlay={handlePlayPause} onSpeedChange={setSpeed}
        />

        {/* Result + log */}
        <ResultDisplay result={result} />
        <OperationLog logs={logs} />
      </div>

      {/* ── Right panel ── */}
      <div className="graph-vis-right">
        <OpGroup label="Build" ops={['addNode','addEdge','removeNode','removeEdge','clear']}
          activeOp={activeOp} setActiveOp={setActiveOp} weighted={weighted} onRun={handleRun} />
        <OpGroup label="Traversal" ops={['bfs','dfs']}
          activeOp={activeOp} setActiveOp={setActiveOp} weighted={weighted} onRun={handleRun} />
        <OpGroup label="Pathfinding" ops={['dijkstra']}
          activeOp={activeOp} setActiveOp={setActiveOp} weighted={weighted} onRun={handleRun} />
        <OpGroup label="Check" ops={['hasNode','hasEdge','degree','isConnected','hasCycle']}
          activeOp={activeOp} setActiveOp={setActiveOp} weighted={weighted} onRun={handleRun} />
      </div>
    </div>
  );
}
