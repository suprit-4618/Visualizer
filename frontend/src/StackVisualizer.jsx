import React, { useState, useEffect } from 'react';
import './StackVisualizer.css';
import { executeStackOp } from './stackOps';

function StackBlock({ value, index, isTop, highlighted, isPushing, isPeeking }) {
  // Each block stands 64px apart (60px height + 4px spacing)
  const bottomPos = index * 64;

  return (
    <div 
      className={`stack-block ${isTop ? 'top-block' : ''} ${highlighted ? 'highlighted' : ''} ${isPushing ? 'animate-push' : ''} ${isPeeking ? 'animate-peek' : ''}`}
      style={{ bottom: `${bottomPos}px` }}
    >
      <span style={{ fontSize: '15px' }}>{value}</span>
      {isTop && <div className="stack-top-label">TOP</div>}
    </div>
  );
}

function StackCanvas({ 
  stack, 
  maxCapacity, 
  highlightedIndices, 
  pushedIndex, 
  peekedIndex, 
  poppingElement,
  canvasShake,
  canvasFlashRed,
  baseShake
}) {
  const ticks = [];
  const rulerLimit = maxCapacity && maxCapacity > 0 ? maxCapacity : Math.max(5, stack.length + 1);
  for (let i = 0; i <= rulerLimit; i++) {
    ticks.push(i);
  }

  return (
    <div className={`stack-canvas-wrapper ${canvasFlashRed ? 'flash-red' : ''}`}>
      <div className="stv-header" style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, width: 'calc(100% - 32px)' }}>
        Stack Canvas
        <span style={{ fontSize: '11px', color: '#666' }}>
          Size: {stack.length} {maxCapacity > 0 ? `/ Max: ${maxCapacity}` : ''}
        </span>
      </div>

      {/* Vertical Scale / Ruler */}
      <div className="stack-ruler">
        {ticks.map(tick => {
          const isActive = stack.length === tick;
          return (
            <div 
              key={tick} 
              className={`ruler-tick ${isActive ? 'active' : ''}`}
              style={{ bottom: `${tick * 64}px` }}
            >
              <span className="ruler-line"></span>
              <span className="ruler-text">{tick}</span>
            </div>
          );
        })}
      </div>

      {/* Main Stack Column */}
      <div className={`stack-column ${canvasShake ? 'shake' : ''}`}>
        {stack.map((val, idx) => (
          <StackBlock
            key={`block-${idx}-${val}`}
            value={val}
            index={idx}
            isTop={idx === stack.length - 1}
            highlighted={highlightedIndices.includes(idx)}
            isPushing={pushedIndex === idx}
            isPeeking={peekedIndex === idx}
          />
        ))}

        {/* Temporary exiting block for popped element */}
        {poppingElement && (
          <div 
            className="stack-block animate-pop"
            style={{ bottom: `${poppingElement.index * 64}px` }}
          >
            <span>{poppingElement.value}</span>
            <div className="stack-top-label" style={{ color: '#ff5252', background: 'rgba(255,82,82,0.1)', borderColor: 'rgba(255,82,82,0.25)' }}>POP</div>
          </div>
        )}
      </div>

      {/* Bottom Base */}
      <div className={`stack-base ${baseShake ? 'shake' : ''}`}>
        <span className="stack-base-label">BOTTOM</span>
      </div>
    </div>
  );
}

function ResultDisplay({ result }) {
  if (!result) return (
    <div className="stv-card">
      <div className="stv-header">Result</div>
      <div style={{ color: '#666', fontStyle: 'italic', padding: '12px 0' }}>No result yet.</div>
    </div>
  );

  const isError = result.value === 'Stack Overflow' || result.value === 'Stack Underflow' || result.isError;
  const badgeText = isError ? 'error' : result.type;

  return (
    <div className="stv-card">
      <div className="stv-header">Result</div>
      <div>
        <span className="stv-result-val" style={{ color: isError ? '#ff5252' : undefined }}>
          {typeof result.value === 'boolean' ? (result.value ? 'True' : 'False') :
           Array.isArray(result.value) ? `[${result.value.join(', ')}]` :
           result.value}
        </span>
        <span className="stv-badge" style={{ 
          background: isError ? 'rgba(255, 82, 82, 0.1)' : undefined,
          color: isError ? '#ff5252' : undefined 
        }}>{badgeText}</span>
      </div>
    </div>
  );
}

function OperationLog({ logs }) {
  return (
    <div className="stv-card" style={{ flexGrow: 1 }}>
      <div className="stv-header">Operation Log</div>
      <div className="stv-log-container">
        {logs.length === 0 && <span style={{ color: '#666' }}>Log is empty.</span>}
        {logs.map((l, i) => (
          <div key={i} className={l.isError ? 'stv-log-error' : 'stv-log-success'}>
            <span className="stv-log-time">[{l.timestamp}]</span>
            {l.expression}
          </div>
        ))}
      </div>
    </div>
  );
}

function OperationForm({ activeOp, onRun }) {
  const [args, setArgs] = useState({});

  useEffect(() => { setArgs({}); }, [activeOp]);

  if (!activeOp) return null;

  const handleChange = (k, v) => setArgs(prev => ({ ...prev, [k]: v }));

  const params = [];
  if (['push', 'contains'].includes(activeOp)) params.push('value');

  return (
    <div className="stv-form">
      {params.map(p => (
        <input 
          key={p} 
          type="text" 
          className="stv-form-input" 
          placeholder={p} 
          value={args[p] || ''} 
          onChange={e => handleChange(p, e.target.value)} 
          onKeyDown={e => { if (e.key === 'Enter') onRun(args); }}
        />
      ))}
      <button className="stv-btn" onClick={() => onRun(args)}>Run</button>
    </div>
  );
}

function OperationItem({ op, activeOp, setActiveOp }) {
  const isActive = activeOp === op;
  const displayName = op === 'isEmpty' ? 'is empty' : op;
                      
  return (
    <div className={`stv-op-item ${isActive ? 'active' : ''}`} onClick={() => setActiveOp(op)}>
      <span className="stv-op-name" style={{ textTransform: 'capitalize' }}>{displayName}</span>
    </div>
  );
}

function OperationGroup({ label, ops, activeOp, setActiveOp, children }) {
  const [open, setOpen] = useState(true);
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div className="stv-header" onClick={() => setOpen(!open)}>
        {label} <span>{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {ops.map(op => (
            <OperationItem key={op} op={op} activeOp={activeOp} setActiveOp={setActiveOp} />
          ))}
          {children}
        </div>
      )}
    </div>
  );
}

function OperationPanel({ activeOp, setActiveOp, onRun, maxCapacity, setMaxCapacity }) {
  const [maxSizeInput, setMaxSizeInput] = useState(maxCapacity || '');

  const handleSetMaxSize = () => {
    const val = parseInt(maxSizeInput);
    if (!isNaN(val) && val >= 0) {
      setMaxCapacity(val);
    } else {
      setMaxCapacity(0);
      setMaxSizeInput('');
    }
  };

  return (
    <div className="stack-vis-right">
      <OperationGroup label="Core Operations" ops={['push', 'pop', 'peek', 'isEmpty', 'size']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['push', 'pop', 'peek', 'isEmpty', 'size'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
      
      <OperationGroup label="Bulk Operations" ops={['clear', 'contains']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['clear', 'contains'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Advanced Operations" ops={['reverse', 'sort']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['reverse', 'sort'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Settings" ops={[]} activeOp={null} setActiveOp={() => {}}>
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', color: '#888' }}>Max Size (Overflow Demo)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="number" 
              className="stv-form-input" 
              style={{ flexGrow: 1 }} 
              placeholder="e.g. 5 (0 for none)" 
              value={maxSizeInput} 
              onChange={e => setMaxSizeInput(e.target.value)} 
              onKeyDown={e => { if (e.key === 'Enter') handleSetMaxSize(); }}
            />
            <button className="stv-btn" onClick={handleSetMaxSize}>Set</button>
          </div>
        </div>
      </OperationGroup>
    </div>
  );
}

export default function StackVisualizer() {
  const [stack, setStack] = useState(['15', '42', '8']);
  const [maxCapacity, setMaxCapacity] = useState(6);
  const [activeOperation, setActiveOperation] = useState(null);
  const [highlightedIndices, setHighlightedIndices] = useState([]);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Animation Triggers
  const [pushedIndex, setPushedIndex] = useState(null);
  const [peekedIndex, setPeekedIndex] = useState(null);
  const [poppingElement, setPoppingElement] = useState(null);
  const [canvasShake, setCanvasShake] = useState(false);
  const [canvasFlashRed, setCanvasFlashRed] = useState(false);
  const [baseShake, setBaseShake] = useState(false);

  const handleRun = (args) => {
    if (!activeOperation) return;

    // Reset temporary states
    setHighlightedIndices([]);
    setResult(null);

    const { 
      result: resVal, 
      resultType, 
      highlightedIndices: hIndices, 
      logEntry, 
      isError, 
      stackDirection, 
      nextStack 
    } = executeStackOp(stack, maxCapacity, activeOperation, args);

    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const logItem = { timestamp: time, expression: logEntry, isError };

    // Set result and logs
    if (resVal !== undefined) {
      setResult({ value: resVal, type: resultType, isError });
    }
    setLogs(prev => [logItem, ...prev].slice(0, 6));

    if (isError) {
      if (resVal === "Stack Overflow") {
        setCanvasFlashRed(true);
        setCanvasShake(true);
        setTimeout(() => {
          setCanvasFlashRed(false);
          setCanvasShake(false);
        }, 500);
      } else if (resVal === "Stack Underflow") {
        setBaseShake(true);
        setTimeout(() => {
          setBaseShake(false);
        }, 500);
      }
      return;
    }

    // Success paths with animations
    if (stackDirection === 'push') {
      const targetIdx = nextStack.length - 1;
      setStack(nextStack);
      setPushedIndex(targetIdx);
      setTimeout(() => {
        setPushedIndex(null);
      }, 500);
    } else if (stackDirection === 'pop') {
      const poppedVal = stack[stack.length - 1];
      const poppedIdx = stack.length - 1;
      setPoppingElement({ value: poppedVal, index: poppedIdx });
      setStack(nextStack);
      setTimeout(() => {
        setPoppingElement(null);
      }, 400);
    } else {
      // Other operations (peek, isEmpty, contains, reverse, sort, clear)
      setStack(nextStack);
      setHighlightedIndices(hIndices || []);

      if (activeOperation === 'peek') {
        setPeekedIndex(stack.length - 1);
        setTimeout(() => {
          setPeekedIndex(null);
        }, 600);
      }
    }
  };

  // Clear visual highlights on active operation switch
  useEffect(() => {
    setHighlightedIndices([]);
    setResult(null);
  }, [activeOperation]);

  return (
    <div className="stack-vis-container">
      <div className="stack-vis-middle">
        <StackCanvas 
          stack={stack}
          maxCapacity={maxCapacity}
          highlightedIndices={highlightedIndices}
          pushedIndex={pushedIndex}
          peekedIndex={peekedIndex}
          poppingElement={poppingElement}
          canvasShake={canvasShake}
          canvasFlashRed={canvasFlashRed}
          baseShake={baseShake}
        />
        <ResultDisplay result={result} />
        <OperationLog logs={logs} />
      </div>
      
      <OperationPanel 
        activeOp={activeOperation} 
        setActiveOp={setActiveOperation} 
        onRun={handleRun} 
        maxCapacity={maxCapacity}
        setMaxCapacity={setMaxCapacity}
      />
    </div>
  );
}
