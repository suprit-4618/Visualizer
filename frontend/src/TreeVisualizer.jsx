import React, { useState, useEffect, useRef, useCallback } from 'react';
import './TreeVisualizer.css';
import './StackVisualizer.css'; // reuse stv-* panel styles
import { executeTreeOp, computeLayout, collectEdges, flattenNodes } from './treeOps';

// ── Default trees ──────────────────────────────────────────────────────────────
import { executeTreeOp as _op } from './treeOps';

function buildDefault(mode) {
  if (mode === 'general') {
    // Build manually
    const root = { id: 'g1', value: 'A', children: [
      { id: 'g2', value: 'B', children: [
        { id: 'g4', value: 'D', children: [] },
        { id: 'g5', value: 'E', children: [] },
      ]},
      { id: 'g3', value: 'C', children: [
        { id: 'g6', value: 'F', children: [] },
      ]},
    ]};
    return root;
  }
  // BST / AVL: insert sequence [50,30,70,20,40,60,80]
  const vals = [50, 30, 70, 20, 40, 60, 80];
  let root = null;
  for (const v of vals) {
    const r = _op(root, mode, 'insert', { value: String(v) });
    root = r.nextTree;
  }
  return root;
}

// ── SVG Tree Canvas ───────────────────────────────────────────────────────────
const R = 22; // node radius
const PAD = { top: 44, left: 48, right: 48, bottom: 24 };

function TreeCanvas({ root, treeMode, nodeStates, activeEdges, compareLabels, deletingId, insertingId }) {
  const svgRef = useRef(null);
  const [svgSize, setSvgSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const obs = new ResizeObserver(e => {
      const { width, height } = e[0].contentRect;
      setSvgSize({ w: width, h: height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!root) return (
    <div className="tree-canvas-wrapper">
      <div className="tree-canvas-empty">Tree is empty — insert a value to begin</div>
    </div>
  );

  const layout = computeLayout(root, treeMode);
  const edges  = collectEdges(root, treeMode);
  const nodes  = flattenNodes(root, treeMode);

  // Centre the tree horizontally in the SVG
  const xs = Object.values(layout).map(p => p.x);
  const ys = Object.values(layout).map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const treeW = maxX - minX + 1;
  const treeH = maxY + 1;
  const offsetX = (svgSize.w - PAD.left - PAD.right - treeW) / 2 + PAD.left - minX;
  const offsetY = PAD.top;

  const px = id => (layout[id]?.x ?? 0) + offsetX;
  const py = id => (layout[id]?.y ?? 0) + offsetY;

  // Active edge set as "from-to"
  const activeEdgeSet = new Set(activeEdges.map(e => `${e.from}-${e.to}`));
  const notFoundEdgeSet = new Set((activeEdges.filter(e => e.notFound)).map(e => `${e.from}-${e.to}`));
  const traversedEdgeSet = new Set((activeEdges.filter(e => e.traversed)).map(e => `${e.from}-${e.to}`));

  return (
    <div className="tree-canvas-wrapper">
      <div className="tree-canvas-info">
        {treeMode.toUpperCase()} TREE · {nodes.length} nodes
      </div>
      <svg ref={svgRef} className="tree-svg"
        viewBox={`0 0 ${svgSize.w} ${Math.max(svgSize.h, treeH + PAD.top + PAD.bottom)}`}>

        {/* ── Edges ── */}
        {edges.map(e => {
          const key = `${e.from}-${e.to}`;
          const cls = notFoundEdgeSet.has(key) ? 'not-found'
                    : traversedEdgeSet.has(key) ? 'traversed'
                    : activeEdgeSet.has(key)    ? 'active'
                    : '';
          return (
            <line key={key} className={`tree-edge ${cls}`}
              x1={px(e.from)} y1={py(e.from)}
              x2={px(e.to)}   y2={py(e.to)} />
          );
        })}

        {/* ── Compare labels on active edges ── */}
        {compareLabels.map((cl, i) => {
          const mx = (px(cl.from) + px(cl.to)) / 2;
          const my = (py(cl.from) + py(cl.to)) / 2;
          return (
            <text key={i} className="tree-compare-label"
              x={mx + 10} y={my} textAnchor="middle" dominantBaseline="middle">
              {cl.symbol}
            </text>
          );
        })}

        {/* ── Nodes ── */}
        {nodes.map(n => {
          const state = nodeStates[n.id] || '';
          const isDel = deletingId === n.id;
          const isIns = insertingId === n.id;
          const circleCls = [
            'tree-node-circle',
            state,
            isDel ? 'deleting' : '',
            isIns ? 'inserting' : '',
          ].filter(Boolean).join(' ');

          // AVL balance factor
          const bfVal = treeMode === 'avl' && n.left !== undefined
            ? (n.left ? n.left.height : 0) - (n.right ? n.right.height : 0)
            : null;

          return (
            <g key={n.id} className="tree-node-g" transform={`translate(${px(n.id)},${py(n.id)})`}>
              <circle className={circleCls} r={R} />
              <text className={`tree-node-label ${isDel ? 'dim' : ''}`}
                textAnchor="middle" dominantBaseline="central">
                {n.value}
              </text>
              {bfVal !== null && (
                <text className="tree-bf-badge" x={R - 4} y={-(R - 4)}
                  textAnchor="middle" dominantBaseline="central">
                  {bfVal}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Result display ────────────────────────────────────────────────────────────
function ResultDisplay({ result, traversalChips, activeChipIdx }) {
  if (!result && traversalChips.length === 0) return (
    <div className="stv-card" style={{ marginTop: 12 }}>
      <div className="stv-header">Result</div>
      <div style={{ color: '#666', fontStyle: 'italic', padding: '8px 0' }}>No result yet.</div>
    </div>
  );

  const isError = result?.isError;

  return (
    <div className="stv-card" style={{ marginTop: 12 }}>
      <div className="stv-header">Result</div>
      {result && (
        <div>
          <span className="stv-result-val" style={{ color: isError ? '#ff5252' : undefined, fontSize: 22 }}>
            {typeof result.value === 'boolean' ? (result.value ? 'True' : 'False')
              : Array.isArray(result.value) ? `[${result.value.join(', ')}]`
              : result.value === null ? 'None'
              : result.value}
          </span>
          <span className="stv-badge"
            style={isError ? { background: 'rgba(255,82,82,0.1)', color: '#ff5252' } : {}}>
            {isError ? 'error' : result.type}
          </span>
        </div>
      )}
      {traversalChips.length > 0 && (
        <div className="tree-traversal-sequence">
          {traversalChips.map((chip, i) => (
            <span key={i} className={`tree-traversal-chip ${i <= activeChipIdx ? 'active' : ''}`}>
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Operation log ─────────────────────────────────────────────────────────────
function OperationLog({ logs }) {
  return (
    <div className="stv-card" style={{ marginTop: 12, flexShrink: 0 }}>
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

// ── Op form ───────────────────────────────────────────────────────────────────
function OpForm({ op, treeMode, onRun }) {
  const [args, setArgs] = useState({});
  useEffect(() => setArgs({}), [op]);

  const needsValue = ['insert','delete','search','contains'].includes(op);
  const needsParent = op === 'insert' && treeMode === 'general';

  if (!op) return null;
  return (
    <div className="stv-form">
      {needsValue && (
        <input className="stv-form-input" placeholder="value" value={args.value || ''}
          onChange={e => setArgs(p => ({ ...p, value: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && onRun(args)} />
      )}
      {needsParent && (
        <input className="stv-form-input" placeholder="parent value" value={args.parent || ''}
          onChange={e => setArgs(p => ({ ...p, parent: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && onRun(args)} />
      )}
      <button className="stv-btn" onClick={() => onRun(args)}>Run</button>
    </div>
  );
}

function OpItem({ op, activeOp, setActiveOp }) {
  const labels = { isEmpty: 'is empty', isBalanced: 'is balanced', findMin: 'find min', findMax: 'find max', levelorder: 'level order' };
  return (
    <div className={`stv-op-item ${activeOp === op ? 'active' : ''}`} onClick={() => setActiveOp(op)}>
      <span className="stv-op-name" style={{ textTransform: 'capitalize' }}>{labels[op] || op}</span>
    </div>
  );
}

function OpGroup({ label, ops, activeOp, setActiveOp, treeMode, onRun }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="stv-header" onClick={() => setOpen(o => !o)}>
        {label} <span>{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ops.map(op => <OpItem key={op} op={op} activeOp={activeOp} setActiveOp={setActiveOp} />)}
          {ops.includes(activeOp) && <OpForm op={activeOp} treeMode={treeMode} onRun={onRun} />}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const ANIM_MS = 480;

export default function TreeVisualizer() {
  const [treeMode, setTreeMode]     = useState('bst');
  const [root, setRoot]             = useState(() => buildDefault('bst'));
  const [activeOp, setActiveOp]     = useState(null);
  const [nodeStates, setNodeStates] = useState({}); // id → css class
  const [activeEdges, setActiveEdges] = useState([]);
  const [compareLabels, setCompareLabels] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [insertingId, setInsertingId] = useState(null);
  const [traversalChips, setTraversalChips] = useState([]);
  const [activeChipIdx, setActiveChipIdx]   = useState(-1);
  const [result, setResult]         = useState(null);
  const [logs, setLogs]             = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef(null);

  // Clear all animation state
  const resetAnim = useCallback(() => {
    clearInterval(timerRef.current);
    setNodeStates({});
    setActiveEdges([]);
    setCompareLabels([]);
    setDeletingId(null);
    setInsertingId(null);
    setTraversalChips([]);
    setActiveChipIdx(-1);
    setIsAnimating(false);
  }, []);

  const handleTabChange = (mode) => {
    resetAnim();
    setTreeMode(mode);
    setRoot(buildDefault(mode));
    setResult(null);
    setActiveOp(null);
  };

  // ── Play insert path animation ──
  const animateInsert = useCallback((path, insertedId, onDone) => {
    setIsAnimating(true);
    let step = 0;
    const displayedEdges = [];
    const displayedLabels = [];

    timerRef.current = setInterval(() => {
      if (step < path.length) {
        const { nodeId, direction, comparison } = path[step];
        setNodeStates(s => ({ ...s, [nodeId]: 'active' }));

        // Edge to next
        if (step + 1 < path.length) {
          const nextNodeId = path[step + 1].nodeId;
          displayedEdges.push({ from: nodeId, to: nextNodeId });
          displayedLabels.push({ from: nodeId, to: nextNodeId, symbol: comparison });
        } else if (direction) {
          // Last step — show edge to the new node
          displayedLabels.push({ from: nodeId, to: insertedId, symbol: comparison });
        }
        setActiveEdges([...displayedEdges]);
        setCompareLabels([...displayedLabels]);
        step++;
      } else {
        // Final: show inserted node
        setInsertingId(insertedId);
        setNodeStates(s => ({ ...s, [insertedId]: 'active' }));
        clearInterval(timerRef.current);
        setTimeout(() => { resetAnim(); onDone(); }, ANIM_MS * 1.5);
      }
    }, ANIM_MS);
  }, [resetAnim]);

  // ── Play search animation ──
  const animateSearch = useCallback((searchPath, found, foundId, onDone) => {
    setIsAnimating(true);
    let step = 0;
    const displayedEdges = [];

    timerRef.current = setInterval(() => {
      if (step < searchPath.length) {
        const cur = searchPath[step];
        const nextState = cur.found ? 'found'
                        : step === searchPath.length - 1 && !found ? 'not-found'
                        : 'active';
        setNodeStates(s => ({ ...s, [cur.nodeId]: nextState }));

        if (step > 0) {
          const prev = searchPath[step - 1];
          const isNotFound = !found && step === searchPath.length - 1;
          displayedEdges.push({ from: prev.nodeId, to: cur.nodeId, notFound: isNotFound });
          setActiveEdges([...displayedEdges]);
          if (cur.comparison) {
            setCompareLabels(l => [...l, { from: prev.nodeId, to: cur.nodeId, symbol: cur.comparison }]);
          }
        }
        step++;
      } else {
        clearInterval(timerRef.current);
        setTimeout(() => { resetAnim(); onDone(); }, ANIM_MS * 1.5);
      }
    }, ANIM_MS);
  }, [resetAnim]);

  // ── Play traversal animation ──
  const animateTraversal = useCallback((traversalOrder, onDone) => {
    setIsAnimating(true);
    setTraversalChips(traversalOrder.map(n => String(n.value)));
    setActiveChipIdx(-1);
    let step = 0;

    timerRef.current = setInterval(() => {
      if (step < traversalOrder.length) {
        const { id } = traversalOrder[step];
        setNodeStates(s => ({ ...s, [id]: 'traversed' }));
        setActiveChipIdx(step);
        step++;
      } else {
        clearInterval(timerRef.current);
        setTimeout(() => { setIsAnimating(false); onDone(); }, ANIM_MS);
      }
    }, ANIM_MS);
  }, []);

  // ── Handle delete visual ──
  const animateDelete = useCallback((deletedId, deleteCase, successorId, nextTree, onDone) => {
    setIsAnimating(true);
    if (deleteCase === 'twoChildren' && successorId) {
      setNodeStates(s => ({ ...s, [successorId]: 'successor' }));
      setTimeout(() => {
        setDeletingId(deletedId);
        setTimeout(() => { setRoot(nextTree); resetAnim(); onDone(); }, ANIM_MS);
      }, ANIM_MS * 1.2);
    } else {
      setDeletingId(deletedId);
      setTimeout(() => { setRoot(nextTree); resetAnim(); onDone(); }, ANIM_MS);
    }
  }, [resetAnim]);

  // ── Main run handler ──
  const handleRun = useCallback((args) => {
    if (!activeOp || isAnimating) return;
    resetAnim();
    setResult(null);
    setTraversalChips([]);

    const res = executeTreeOp(root, treeMode, activeOp, args);
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const logItem = { timestamp: time, expression: res.logEntry, isError: res.isError };
    setLogs(prev => [logItem, ...prev].slice(0, 6));

    if (res.isError) {
      setResult({ value: res.result, type: 'error', isError: true });
      return;
    }

    // Set scalar result immediately (for non-traversal ops)
    if (!['inorder','preorder','postorder','levelorder'].includes(activeOp)) {
      if (res.result !== null && res.result !== undefined) {
        setResult({ value: res.result, type: res.resultType });
      }
    }

    const commit = () => {
      if (!['delete'].includes(activeOp)) setRoot(res.nextTree);
    };

    if (activeOp === 'insert' && res.insertPath.length > 0) {
      setRoot(res.nextTree); // commit tree first so layout includes new node
      animateInsert(res.insertPath, res.highlightedNodes[0], commit);
    } else if (activeOp === 'delete' && res.deletedId) {
      animateDelete(res.deletedId, res.deleteCase, res.successorId, res.nextTree, () => {});
    } else if (activeOp === 'search') {
      animateSearch(res.searchPath, res.result, res.highlightedNodes[0], commit);
    } else if (['inorder','preorder','postorder','levelorder'].includes(activeOp)) {
      commit();
      setResult({ value: res.result, type: res.resultType });
      animateTraversal(res.traversalOrder, () => {});
    } else if (activeOp === 'contains' || activeOp === 'findMin' || activeOp === 'findMax') {
      // Just highlight
      const ids = res.highlightedNodes;
      setNodeStates(Object.fromEntries(ids.map(id => [id, 'highlighted'])));
      commit();
      setTimeout(resetAnim, 1200);
    } else {
      commit();
    }
  }, [activeOp, isAnimating, root, treeMode, animateInsert, animateSearch, animateDelete, animateTraversal, resetAnim]);

  useEffect(() => { resetAnim(); setResult(null); }, [activeOp]);

  // ── Traversal ops unavailable for general ──
  const traversalOps = treeMode === 'general'
    ? ['preorder', 'postorder', 'levelorder']
    : ['inorder', 'preorder', 'postorder', 'levelorder'];

  const infoOps = treeMode === 'general'
    ? ['height', 'size', 'isEmpty']
    : ['height', 'size', 'isBalanced', 'isEmpty'];

  return (
    <div className="tree-vis-container">
      {/* ── Left: canvas + result ── */}
      <div className="tree-vis-middle">
        <div className="tree-tabs">
          {['bst','avl','general'].map(m => (
            <button key={m} className={`tree-tab ${treeMode === m ? 'active' : ''}`}
              onClick={() => handleTabChange(m)}>
              {m === 'bst' ? 'BST' : m === 'avl' ? 'AVL' : 'General Tree'}
            </button>
          ))}
        </div>

        <TreeCanvas
          root={root}
          treeMode={treeMode}
          nodeStates={nodeStates}
          activeEdges={activeEdges}
          compareLabels={compareLabels}
          deletingId={deletingId}
          insertingId={insertingId}
        />

        <ResultDisplay
          result={result}
          traversalChips={traversalChips}
          activeChipIdx={activeChipIdx}
        />
        <OperationLog logs={logs} />
      </div>

      {/* ── Right: operation panel ── */}
      <div className="tree-vis-right">
        {isAnimating && (
          <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 12, padding: '6px 10px',
            background: 'rgba(245,158,11,0.08)', borderRadius: 4, border: '1px solid rgba(245,158,11,0.2)' }}>
            ⟳ Animation in progress…
          </div>
        )}
        <OpGroup label="Modify"   ops={['insert','delete','clear']} activeOp={activeOp} setActiveOp={setActiveOp} treeMode={treeMode} onRun={handleRun} />
        <OpGroup label="Search"   ops={['search','contains','findMin','findMax']} activeOp={activeOp} setActiveOp={setActiveOp} treeMode={treeMode} onRun={handleRun} />
        <OpGroup label="Traverse" ops={traversalOps} activeOp={activeOp} setActiveOp={setActiveOp} treeMode={treeMode} onRun={handleRun} />
        <OpGroup label="Info"     ops={infoOps} activeOp={activeOp} setActiveOp={setActiveOp} treeMode={treeMode} onRun={handleRun} />
      </div>
    </div>
  );
}
