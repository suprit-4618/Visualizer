import React, { useState, useEffect } from 'react';
import './TupleVisualizer.css';
import { executeTupleOp } from './tupleOps';

function TupleCell({ value, index, highlighted, shake, negativeIdx, unpackVar }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className={`tv-char-cell ${highlighted ? 'highlighted' : ''} ${shake ? 'shake-error' : ''}`}>
        {/* Faint Lock SVG */}
        <svg className="tv-lock-icon" viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span className="tv-char-val">{value}</span>
        <div className="tv-indices-wrapper">
          <span className="tv-char-idx">{index}</span>
          {negativeIdx !== null && negativeIdx !== undefined && (
            <span className="tv-char-neg-idx">{negativeIdx}</span>
          )}
        </div>
      </div>

      {unpackVar && (
        <div className="tv-unpack-wrapper">
          <span className="tv-unpack-arrow">↓</span>
          <span className="tv-unpack-var">{unpackVar}</span>
        </div>
      )}
    </div>
  );
}

function TupleDisplay({ array, highlightedIndices, negativeIndices, shakeIndex, unpackVars, mutErrorMsg }) {
  const isFanned = unpackVars && unpackVars.length > 0;
  
  // Calculate bracket dimensions if slicing
  let bracketStyle = null;
  if (highlightedIndices.length > 1) {
    const sortedHl = [...highlightedIndices].sort((a, b) => a - b);
    const startIdx = sortedHl[0];
    const endIdx = sortedHl[sortedHl.length - 1];
    
    // Width = 56px, Gap = isFanned ? 36px : 12px
    const gap = isFanned ? 36 : 12;
    const leftOffset = startIdx * (56 + gap) + 16; // Add card padding offset
    const width = (endIdx - startIdx + 1) * 56 + (endIdx - startIdx) * gap;
    
    bracketStyle = {
      left: `${leftOffset}px`,
      width: `${width}px`
    };
  }

  return (
    <div className="tv-card">
      <div className="tv-header">
        Tuple Canvas
        <span style={{ fontSize: '11px', color: '#666' }}>
          Size: {array.length} (Immutable Sequence)
        </span>
      </div>

      {/* Render bracket for contiguous slice highlighting */}
      {bracketStyle && (
        <div className="tv-bracket-container" style={bracketStyle} />
      )}

      {/* Mutability Error tooltip popup */}
      {mutErrorMsg && (
        <div className="tv-tooltip">
          {mutErrorMsg}
        </div>
      )}

      <div className={`tv-cells-container ${isFanned ? 'fanned' : ''}`}>
        {array.map((val, i) => {
          const hasNegLabel = negativeIndices.length > i;
          const negIdxVal = hasNegLabel ? negativeIndices[i] : null;
          const unpackName = unpackVars && unpackVars.length > i ? unpackVars[i] : null;
          const isShaking = shakeIndex === i || (shakeIndex === -1 && mutErrorMsg !== null);

          return (
            <TupleCell 
              key={i}
              value={val}
              index={i}
              highlighted={highlightedIndices.includes(i)}
              shake={isShaking}
              negativeIdx={negIdxVal}
              unpackVar={unpackName}
            />
          );
        })}
      </div>
    </div>
  );
}

function ResultDisplay({ result }) {
  if (!result) return (
    <div className="tv-card">
      <div className="tv-header">Result</div>
      <div style={{ color: '#666', fontStyle: 'italic', padding: '12px 0' }}>No result yet.</div>
    </div>
  );

  return (
    <div className="tv-card">
      <div className="tv-header">Result</div>
      <div>
        <span className="tv-result-val">
          {typeof result.value === 'boolean' ? (result.value ? 'True' : 'False') :
           Array.isArray(result.value) ? `(${result.value.join(', ')})` :
           result.value}
        </span>
        <span className="tv-badge">{result.type}</span>
      </div>
    </div>
  );
}

function OperationLog({ logs }) {
  return (
    <div className="tv-card" style={{ flexGrow: 1 }}>
      <div className="tv-header">Operation Log</div>
      <div className="tv-log-container">
        {logs.length === 0 && <span style={{ color: '#666' }}>Log is empty.</span>}
        {logs.map((l, i) => (
          <div key={i} className={l.isError ? 'tv-log-error' : 'tv-log-success'}>
            <span className="tv-log-time">[{l.timestamp}]</span>
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
  if (['get', 'attempt_set'].includes(activeOp)) params.push('index');
  if (['attempt_set', 'attempt_append', 'attempt_remove', 'index', 'count', 'in_operator', 'unpack'].includes(activeOp)) params.push('value');
  if (['slice'].includes(activeOp)) params.push('start', 'end');

  const getPlaceholder = (p) => {
    if (activeOp === 'unpack' && p === 'value') return 'var names (e.g. x, y, z)';
    return p;
  };

  return (
    <div className="tv-form">
      {params.map(p => (
        <input 
          key={p} 
          type="text" 
          className="tv-form-input" 
          placeholder={getPlaceholder(p)} 
          value={args[p] || ''} 
          onChange={e => handleChange(p, e.target.value)} 
        />
      ))}
      <button className="tv-btn" onClick={() => onRun(args)}>Run</button>
    </div>
  );
}

function OperationItem({ op, activeOp, setActiveOp }) {
  const isActive = activeOp === op;
  const displayName = op === 'in_operator' ? 'in operator' : 
                      op === 'type_check' ? 'type check' : 
                      op === 'attempt_set' ? 'attempt set' : 
                      op === 'attempt_append' ? 'attempt append' : 
                      op === 'attempt_remove' ? 'attempt remove' : 
                      op === 'to_list' ? 'to list' : 
                      op === 'to_set' ? 'to set' : op;
                      
  return (
    <div className={`tv-op-item ${isActive ? 'active' : ''}`} onClick={() => setActiveOp(op)}>
      <span className="tv-op-name" style={{ textTransform: 'capitalize' }}>{displayName}</span>
    </div>
  );
}

function OperationGroup({ label, ops, activeOp, setActiveOp, children }) {
  const [open, setOpen] = useState(true);
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div className="tv-header" onClick={() => setOpen(!open)}>
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

function OperationPanel({ activeOp, setActiveOp, onRun }) {
  return (
    <div className="tuple-vis-right">
      <OperationGroup label="Access" ops={['get', 'slice']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['get', 'slice'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
      
      <OperationGroup label="Search" ops={['index', 'count', 'in_operator']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['index', 'count', 'in_operator'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Info" ops={['len', 'min', 'max', 'sum', 'type_check']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['len', 'min', 'max', 'sum', 'type_check'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Convert" ops={['to_list', 'to_set']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['to_list', 'to_set'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Unpack" ops={['unpack']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['unpack'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Immutability" ops={['attempt_set', 'attempt_append', 'attempt_remove']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['attempt_set', 'attempt_append', 'attempt_remove'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
    </div>
  );
}

export default function TupleVisualizer() {
  const [tuple, setTuple] = useState(['15', '42', '8']);
  const [activeOperation, setActiveOperation] = useState(null);
  const [highlightedIndices, setHighlightedIndices] = useState([]);
  const [negativeIndices, setNegativeIndices] = useState([]);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Immutability shakes & tooltips
  const [shakeIndex, setShakeIndex] = useState(-2); // -2 is inactive
  const [mutErrorMsg, setMutErrorMsg] = useState(null);
  const [unpackVars, setUnpackVars] = useState(null);

  const handleRun = (args) => {
    if (!activeOperation) return;

    // Reset animations
    setHighlightedIndices([]);
    setNegativeIndices([]);
    setResult(null);
    setShakeIndex(-2);
    setMutErrorMsg(null);
    setUnpackVars(null);

    const { 
      result: resVal, 
      resultType, 
      highlightedIndices: hIndices, 
      negativeIndices: nIndices,
      logEntry, 
      isError, 
      errorMessage,
      unpackVars: uVars
    } = executeTupleOp(tuple, activeOperation, args);

    const time = new Date().toLocaleTimeString('en-US', { hour12: false });

    if (isError) {
      // Trigger error animations
      if (activeOperation === 'attempt_set') {
        const parsedIdx = args.index ? parseInt(args.index) : 0;
        setShakeIndex(isNaN(parsedIdx) ? 0 : parsedIdx);
      } else {
        setShakeIndex(-1); // shake all
      }
      setMutErrorMsg(errorMessage);
      setLogs(prev => [{ timestamp: time, expression: logEntry, isError: true }, ...prev].slice(0, 6));
      return;
    }

    if (nIndices && nIndices.length > 0) {
      setNegativeIndices(nIndices);
    }

    if (uVars && uVars.length > 0) {
      setUnpackVars(uVars);
    }

    setHighlightedIndices(hIndices || []);
    if (resVal !== null && resVal !== undefined) {
      setResult({ value: resVal, type: resultType });
    }

    setLogs(prev => [{ timestamp: time, expression: logEntry, isError: false }, ...prev].slice(0, 6));
  };

  useEffect(() => {
    setHighlightedIndices([]);
    setNegativeIndices([]);
    setResult(null);
    setShakeIndex(-2);
    setMutErrorMsg(null);
    setUnpackVars(null);
  }, [activeOperation]);

  return (
    <div className="tuple-vis-container">
      <div className="tuple-vis-middle">
        <TupleDisplay 
          array={tuple}
          highlightedIndices={highlightedIndices}
          negativeIndices={negativeIndices}
          shakeIndex={shakeIndex}
          unpackVars={unpackVars}
          mutErrorMsg={mutErrorMsg}
        />

        <ResultDisplay result={result} />
        
        <OperationLog logs={logs} />
      </div>
      
      <OperationPanel 
        activeOp={activeOperation} 
        setActiveOp={setActiveOperation} 
        onRun={handleRun} 
      />
    </div>
  );
}
