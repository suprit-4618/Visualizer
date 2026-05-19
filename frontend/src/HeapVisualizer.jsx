import React, { useState, useRef, useCallback, useEffect } from 'react';
import './HeapVisualizer.css';
import './StackVisualizer.css';   // stv-* panel classes
import './GraphVisualizer.css';   // graph-step-* controls
import { executeHeapOp, heapNodePos } from './heapOps';

// ── Constants ──────────────────────────────────────────────────────────────────
const R = 22;
const SVG_W = 800;
const TREE_H = 290;          // y space for tree
const DIVIDER_Y = TREE_H + 10;
const ARRAY_Y   = DIVIDER_Y + 24;  // top of array cells
const CELL_H    = 48;
const CELL_W    = 48;
const SVG_H     = ARRAY_Y + CELL_H + 28;

// Default heaps
const DEFAULT_MAX = [80, 60, 70, 30, 50, 20, 40];
const DEFAULT_MIN = [10, 20, 30, 40, 50, 60, 70];

// ── Compute cell centre-x for index i in heap of size n ───────────────────────
function cellCX(i, n) {
  const totalW = Math.min(n, 20) * CELL_W;
  const startX = (SVG_W - totalW) / 2;
  return startX + i * CELL_W + CELL_W / 2;
}

// ── Unified SVG Canvas ────────────────────────────────────────────────────────
function HeapCanvas({ heap, isMax, swapping, newNode, initNode }) {
  const n = heap.length;

  // Classify each node
  const nodeClass = i => {
    if (swapping.includes(i)) return 'hn-swapping';
    if (i === newNode)        return 'hn-new';
    if (i === initNode)       return 'hn-init';
    if (i === 0 && n > 0)     return isMax ? 'hn-root-max' : 'hn-root-min';
    return 'hn-default';
  };
  const cellClass = i => {
    if (swapping.includes(i)) return 'swapping';
    if (i === newNode)        return 'new-node';
    if (i === initNode)       return 'init-node';
    return '';
  };
  const edgeClass = (i, j) => {
    if (swapping.includes(i) && swapping.includes(j)) return 'he-swapping';
    return 'he-default';
  };

  // Tree positions (capped at 31 nodes = 4 full levels + partial)
  const visN = Math.min(n, 31);
  const positions = Array.from({ length: visN }, (_, i) => heapNodePos(i, visN, SVG_W));

  if (n === 0) return (
    <div className="heap-canvas-wrapper">
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#444', fontSize: 14, fontStyle: 'italic' }}>
        Heap is empty — insert a value to begin
      </div>
    </div>
  );

  return (
    <div className="heap-canvas-wrapper">
      <div className="heap-canvas-info">
        {isMax ? 'MAX-HEAP' : 'MIN-HEAP'} · {n} elements
      </div>
      <svg className="heap-svg" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>

        {/* ── Section labels ── */}
        <text className="heap-section-label" x={12} y={DIVIDER_Y + 2}>Array representation</text>
        <line x1={0} y1={DIVIDER_Y} x2={SVG_W} y2={DIVIDER_Y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />

        {/* ── Connector lines: tree node → array cell ── */}
        {Array.from({ length: visN }, (_, i) => {
          const { x, y } = positions[i];
          const cx = cellCX(i, n);
          const cy = ARRAY_Y;
          return (
            <line key={`conn-${i}`} className="heap-connector"
              x1={x} y1={y + R + 2} x2={cx} y2={cy} />
          );
        })}

        {/* ── Tree edges ── */}
        {Array.from({ length: visN }, (_, i) => {
          if (i === 0) return null;
          const p = Math.floor((i - 1) / 2);
          const { x: x1, y: y1 } = positions[p];
          const { x: x2, y: y2 } = positions[i];
          return (
            <line key={`edge-${i}`} className={edgeClass(p, i)}
              x1={x1} y1={y1} x2={x2} y2={y2} />
          );
        })}

        {/* ── Tree nodes ── */}
        {Array.from({ length: visN }, (_, i) => {
          const { x, y } = positions[i];
          const cls = nodeClass(i);
          const isNew = i === newNode;
          return (
            <g key={`node-${i}`} transform={`translate(${x},${y})`}>
              <circle className={cls} r={R}
                style={isNew ? { animation: 'heapNodePop 0.4s cubic-bezier(0.34,1.56,0.64,1)' } : {}} />
              <text className="heap-node-label" textAnchor="middle" dominantBaseline="central">
                {heap[i]}
              </text>
            </g>
          );
        })}

        {/* ── Array section ── */}
        {Array.from({ length: Math.min(n, 20) }, (_, i) => {
          const cx = cellCX(i, n);
          const x  = cx - CELL_W / 2 + 2;
          const cc = cellClass(i);
          return (
            <g key={`cell-${i}`}>
              <rect className={`heap-cell-rect ${cc}`}
                x={x} y={ARRAY_Y} width={CELL_W - 4} height={CELL_H} rx={5} />
              <text className="heap-cell-val" x={cx} y={ARRAY_Y + CELL_H / 2}
                textAnchor="middle" dominantBaseline="central">
                {heap[i]}
              </text>
              <text className="heap-cell-idx" x={cx} y={ARRAY_Y + CELL_H + 12}
                textAnchor="middle">
                {i}
              </text>
            </g>
          );
        })}

        {/* ── Overflow indicator ── */}
        {n > 20 && (
          <text fill="#555" fontSize={11} fontFamily="monospace"
            x={SVG_W - 8} y={ARRAY_Y + CELL_H / 2} textAnchor="end" dominantBaseline="central">
            +{n - 20} more…
          </text>
        )}
      </svg>
    </div>
  );
}

// ── Step controls ─────────────────────────────────────────────────────────────
function StepControls({ stepIdx, total, isPlaying, speed, onPrev, onNext, onPlay, onSpeedChange }) {
  if (total === 0) return null;
  return (
    <div className="graph-step-controls">
      <button className="graph-step-btn" onClick={onPrev} disabled={stepIdx <= 0}>◀</button>
      <button className="graph-step-btn play-btn" onClick={onPlay}>{isPlaying ? '⏸' : '▶'}</button>
      <button className="graph-step-btn" onClick={onNext} disabled={stepIdx >= total - 1}>▶</button>
      <span style={{ fontSize: 11, color: '#555' }}>Speed</span>
      <input type="range" className="graph-speed-slider" min={150} max={1200} step={50} value={speed}
        onChange={e => onSpeedChange(Number(e.target.value))} />
      <span className="graph-step-counter">{stepIdx + 1} / {total}</span>
    </div>
  );
}

// ── Result display ────────────────────────────────────────────────────────────
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
        <span className="stv-result-val"
          style={{ color: isErr ? '#ff5252' : undefined, fontSize: 22 }}>
          {typeof result.value === 'boolean' ? (result.value ? 'True' : 'False')
            : result.value === null ? 'None'
            : String(result.value)}
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
function OpForm({ op, onRun }) {
  const [args, setArgs] = useState({});
  useEffect(() => setArgs({}), [op]);
  if (!op) return null;

  const fields = {
    insert:     [['value', 'number']],
    buildHeap:  [['array', 'e.g. 3,1,4,1,5,9']],
    contains:   [['value', 'number']],
  };
  const f = fields[op] ?? [];

  return (
    <div className="stv-form">
      {f.map(([k, ph]) => (
        <input key={k} className="stv-form-input" placeholder={ph}
          value={args[k] ?? ''}
          onChange={e => setArgs(p => ({ ...p, [k]: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && onRun(args)} />
      ))}
      <button className="stv-btn" onClick={() => onRun(args)}>Run</button>
    </div>
  );
}

function OpItem({ op, activeOp, setActiveOp }) {
  const labels = { extractRoot: 'extract root', isEmpty: 'is empty', buildHeap: 'build heap' };
  return (
    <div className={`stv-op-item ${activeOp === op ? 'active' : ''}`} onClick={() => setActiveOp(op)}>
      <span className="stv-op-name">{labels[op] || op}</span>
    </div>
  );
}

function OpGroup({ label, ops, activeOp, setActiveOp, onRun }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="stv-header" onClick={() => setOpen(o => !o)}>
        {label} <span>{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ops.map(op => <OpItem key={op} op={op} activeOp={activeOp} setActiveOp={setActiveOp} />)}
          {ops.includes(activeOp) && <OpForm op={activeOp} onRun={onRun} />}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HeapVisualizer() {
  const [isMax, setIsMax]       = useState(true);
  const [heap, setHeap]         = useState(DEFAULT_MAX);
  const [activeOp, setActiveOp] = useState(null);
  const [result, setResult]     = useState(null);
  const [logs, setLogs]         = useState([]);

  // Animation / step player
  const [accStates, setAccStates] = useState([]);
  const [stepIdx, setStepIdx]     = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed]         = useState(500);
  const playRef  = useRef(null);

  // Visual states derived from current step
  const [visHeap, setVisHeap]     = useState(DEFAULT_MAX);
  const [swapping, setSwapping]   = useState([]);
  const [newNode, setNewNode]     = useState(null);
  const [initNode, setInitNode]   = useState(null);

  const applyStep = useCallback((idx, states) => {
    if (!states || idx < 0 || idx >= states.length) return;
    const s = states[idx];
    setVisHeap(s.arr);
    setSwapping(s.swapping ?? []);
    setNewNode(s.newNode ?? null);
    setInitNode(s.step?.type === 'initNode' ? s.step.idx : null);
  }, []);

  const stopPlay = useCallback(() => {
    clearInterval(playRef.current);
    setIsPlaying(false);
  }, []);

  const startPlay = useCallback((states) => {
    clearInterval(playRef.current);
    setIsPlaying(true);
    playRef.current = setInterval(() => {
      setStepIdx(prev => {
        const next = prev + 1;
        if (next >= states.length) { clearInterval(playRef.current); setIsPlaying(false); return prev; }
        applyStep(next, states);
        return next;
      });
    }, speed);
  }, [speed, applyStep]);

  useEffect(() => () => clearInterval(playRef.current), []);

  useEffect(() => {
    stopPlay(); setAccStates([]); setStepIdx(-1);
    setSwapping([]); setNewNode(null); setInitNode(null);
    setResult(null);
  }, [activeOp]);

  const handleModeSwitch = (max) => {
    stopPlay(); setIsMax(max);
    const def = max ? DEFAULT_MAX : DEFAULT_MIN;
    setHeap(def); setVisHeap(def);
    setAccStates([]); setStepIdx(-1); setSwapping([]); setNewNode(null); setInitNode(null);
    setResult(null); setActiveOp(null);
  };

  const handleRun = useCallback((args) => {
    if (!activeOp) return;
    stopPlay();
    const res = executeHeapOp(heap, isMax, activeOp, args);
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [{ timestamp: time, expression: res.logEntry, isError: res.isError }, ...prev].slice(0, 6));

    if (res.isError) {
      setResult({ value: res.result, type: 'error', isError: true });
      return;
    }

    if (res.result !== null && res.result !== undefined) {
      setResult({ value: res.result, type: res.resultType });
    }

    // Non-animated ops
    if (['size','isEmpty','contains','peek'].includes(activeOp)) {
      setHeap(res.nextHeap);
      setVisHeap(res.nextHeap);
      return;
    }

    // Animated: set up step player
    setHeap(res.nextHeap);
    const states = res.accStates;
    setAccStates(states);
    if (states.length > 0) {
      setStepIdx(0);
      applyStep(0, states);
    }
  }, [activeOp, heap, isMax, stopPlay, applyStep]);

  const handlePrev = () => { stopPlay(); const n = Math.max(0, stepIdx - 1); setStepIdx(n); applyStep(n, accStates); };
  const handleNext = () => { stopPlay(); const n = Math.min(accStates.length - 1, stepIdx + 1); setStepIdx(n); applyStep(n, accStates); };
  const handlePlayPause = () => isPlaying ? stopPlay() : startPlay(accStates);

  // When no animation active, show committed heap
  const displayHeap = accStates.length > 0 && stepIdx >= 0 ? visHeap : heap;

  return (
    <div className="heap-vis-container">
      {/* ── Left: dual canvas ── */}
      <div className="heap-vis-middle">
        {/* Mode bar */}
        <div className="heap-mode-bar">
          <button className={`heap-mode-btn max ${isMax ? 'active' : ''}`}
            onClick={() => handleModeSwitch(true)}>Max-Heap</button>
          <button className={`heap-mode-btn min ${!isMax ? 'active' : ''}`}
            onClick={() => handleModeSwitch(false)}>Min-Heap</button>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#555' }}>
            {displayHeap.length} / ∞ elements
          </span>
        </div>

        {/* Dual canvas: SVG tree + array */}
        <HeapCanvas
          heap={displayHeap}
          isMax={isMax}
          swapping={swapping}
          newNode={newNode}
          initNode={initNode}
        />

        {/* Step controls */}
        <StepControls stepIdx={stepIdx} total={accStates.length} isPlaying={isPlaying} speed={speed}
          onPrev={handlePrev} onNext={handleNext} onPlay={handlePlayPause} onSpeedChange={setSpeed} />

        {/* Result + Log */}
        <ResultDisplay result={result} />
        <OperationLog logs={logs} />
      </div>

      {/* ── Right: op panel ── */}
      <div className="heap-vis-right">
        <OpGroup label="Core"  ops={['insert','extractRoot','peek','size','isEmpty']}
          activeOp={activeOp} setActiveOp={setActiveOp} onRun={handleRun} />
        <OpGroup label="Build" ops={['buildHeap']}
          activeOp={activeOp} setActiveOp={setActiveOp} onRun={handleRun} />
        <OpGroup label="Info"  ops={['contains','clear']}
          activeOp={activeOp} setActiveOp={setActiveOp} onRun={handleRun} />
      </div>
    </div>
  );
}
