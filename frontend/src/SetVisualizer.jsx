import React, { useState, useEffect } from 'react';
import './SetVisualizer.css';
import { executeSetOp } from './setOps';

function SetChip({ val, isNew, isDuplicate, isDeleted, isDimmed, isGlow }) {
  let cls = 'set-chip';
  if (isNew) cls += ' set-chip-new';
  if (isDuplicate) cls += ' ripple-error';
  if (isDeleted) cls += ' set-chip-deleted';
  if (isDimmed) cls += ' dimmed';
  if (isGlow) cls += ' glow-teal';

  return (
    <div className={cls}>
      {val}
      {isDuplicate && (
        <span className="set-tooltip-error">Already exists, ignored</span>
      )}
    </div>
  );
}

function SetCanvas({ 
  items, 
  title, 
  newVal, 
  duplicateVal, 
  deletedVal, 
  dimmedVals = [], 
  glowVals = [] 
}) {
  return (
    <div className="sv-card">
      <div className="sv-header">
        {title}
        <span style={{ fontSize: '11px', color: '#666' }}>Size: {items.length}</span>
      </div>
      <div className="set-wrap-canvas">
        {items.length === 0 && (
          <div style={{ color: '#666', fontStyle: 'italic', fontSize: '13px' }}>Empty Set</div>
        )}
        {items.map(val => {
          const isNew = newVal === val;
          const isDuplicate = duplicateVal === val;
          const isDeleted = deletedVal === val;
          const isDimmed = dimmedVals.includes(val);
          const isGlow = glowVals.includes(val);

          return (
            <SetChip 
              key={val}
              val={val}
              isNew={isNew}
              isDuplicate={isDuplicate}
              isDeleted={isDeleted}
              isDimmed={isDimmed}
              isGlow={isGlow}
            />
          );
        })}
      </div>
    </div>
  );
}

function ResultDisplay({ result, errorMsg }) {
  if (errorMsg) return (
    <div className="sv-card">
      <div className="sv-header">Result</div>
      <div className="sv-result-error">{errorMsg}</div>
    </div>
  );

  if (!result) return (
    <div className="sv-card">
      <div className="sv-header">Result</div>
      <div style={{ color: '#666', fontStyle: 'italic', padding: '12px 0' }}>No result yet.</div>
    </div>
  );

  return (
    <div className="sv-card">
      <div className="sv-header">Result</div>
      <div>
        <span className="sv-result-val">
          {typeof result.value === 'boolean' ? (result.value ? 'True' : 'False') : result.value}
        </span>
        <span className="sv-badge">{result.type}</span>
      </div>
    </div>
  );
}

function OperationLog({ logs }) {
  return (
    <div className="sv-card" style={{ flexGrow: 1 }}>
      <div className="sv-header">Operation Log</div>
      <div className="sv-log-container">
        {logs.length === 0 && <span style={{ color: '#666' }}>Log is empty.</span>}
        {logs.map((l, i) => (
          <div key={i} className={l.isError ? 'sv-log-error' : 'sv-log-success'}>
            <span className="sv-log-time">[{l.timestamp}]</span>
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

  const hasValue = ['add', 'remove', 'discard', 'in_operator', 'union', 'intersection', 'difference', 'symmetric_difference', 'issubset', 'issuperset', 'isdisjoint'].includes(activeOp);

  const getPlaceholder = () => {
    if (['union', 'intersection', 'difference', 'symmetric_difference', 'issubset', 'issuperset', 'isdisjoint'].includes(activeOp)) {
      return 'other set (e.g. 3, 4, 5)';
    }
    return 'value';
  };

  return (
    <div className="sv-form">
      {hasValue && (
        <input 
          type="text" 
          className="sv-form-input" 
          placeholder={getPlaceholder()} 
          value={args.value || ''} 
          onChange={e => handleChange('value', e.target.value)} 
        />
      )}
      <button className="sv-btn" onClick={() => onRun(args)}>Run</button>
    </div>
  );
}

function OperationItem({ op, activeOp, setActiveOp }) {
  const isActive = activeOp === op;
  const displayName = op === 'in_operator' ? 'in operator' : 
                      op === 'to_sorted_list' ? 'to sorted list' : 
                      op === 'to_list' ? 'to list' : 
                      op === 'symmetric_difference' ? 'symmetric diff' : op;
                      
  return (
    <div className={`sv-op-item ${isActive ? 'active' : ''}`} onClick={() => setActiveOp(op)}>
      <span className="sv-op-name" style={{ textTransform: 'capitalize' }}>{displayName}</span>
    </div>
  );
}

function OperationGroup({ label, ops, activeOp, setActiveOp, children }) {
  const [open, setOpen] = useState(true);
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div className="sv-header" onClick={() => setOpen(!open)}>
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
    <div className="set-vis-right">
      <OperationGroup label="Modify" ops={['add', 'remove', 'discard', 'clear', 'pop']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['add', 'remove', 'discard', 'clear', 'pop'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
      
      <OperationGroup label="Set Math" ops={['union', 'intersection', 'difference', 'symmetric_difference']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['union', 'intersection', 'difference', 'symmetric_difference'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Check" ops={['in_operator', 'issubset', 'issuperset', 'isdisjoint', 'len']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['in_operator', 'issubset', 'issuperset', 'isdisjoint', 'len'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Convert" ops={['to_list', 'to_sorted_list']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['to_list', 'to_sorted_list'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
    </div>
  );
}

export default function SetVisualizer() {
  const [items, setItems] = useState(['15', '42', '8', '23']);
  const [activeOperation, setActiveOperation] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [logs, setLogs] = useState([]);

  // Pill Chip transitions state
  const [newVal, setNewVal] = useState(null);
  const [duplicateVal, setDuplicateVal] = useState(null);
  const [deletedVal, setDeletedVal] = useState(null);

  // Set Math side-by-side states
  const [showMathView, setShowMathView] = useState(false);
  const [otherItems, setOtherItems] = useState([]);
  const [dimmedItems, setDimmedItems] = useState([]);
  const [glowItems, setGlowItems] = useState([]);

  const resetTransitions = () => {
    setNewVal(null);
    setDuplicateVal(null);
    setDeletedVal(null);
    setShowMathView(false);
    setOtherItems([]);
    setDimmedItems([]);
    setGlowItems([]);
    setErrorMsg(null);
  };

  const handleRun = (args) => {
    resetTransitions();
    setResult(null);

    const { 
      result: resVal, 
      resultType, 
      logEntry, 
      isError, 
      errorMessage, 
      affectedValue, 
      newItems, 
      otherSetItems, 
      isDuplicate 
    } = executeSetOp(items, activeOperation, args);

    const time = new Date().toLocaleTimeString('en-US', { hour12: false });

    // KeyError validation
    if (isError) {
      setErrorMsg(errorMessage);
      setLogs(prev => [{ timestamp: time, expression: logEntry, isError: true }, ...prev].slice(0, 6));
      return;
    }

    // 1. Duplicate Merge Ripple
    if (isDuplicate && affectedValue) {
      setDuplicateVal(affectedValue);
      setLogs(prev => [{ timestamp: time, expression: logEntry, isError: false }, ...prev].slice(0, 6));
      return;
    }

    // 2. Set Math Highlights
    const isSetMath = ['union', 'intersection', 'difference', 'symmetric_difference'].includes(activeOperation);
    if (isSetMath) {
      setShowMathView(true);
      setOtherItems(otherSetItems);

      if (activeOperation === 'union') {
        // Union highlights shared elements in glow
        const shared = items.filter(x => otherSetItems.includes(x));
        setGlowItems(shared);
      } else if (activeOperation === 'intersection') {
        // Intersection dims non-shared, shared glows
        const nonShared = items.filter(x => !otherSetItems.includes(x));
        const shared = items.filter(x => otherSetItems.includes(x));
        setDimmedItems(nonShared);
        setGlowItems(shared);
      } else if (activeOperation === 'difference') {
        // Difference: elements unique to Set A glow, rest dim
        const uniqueA = items.filter(x => !otherSetItems.includes(x));
        const nonUnique = items.filter(x => otherSetItems.includes(x));
        setGlowItems(uniqueA);
        setDimmedItems(nonUnique);
      } else if (activeOperation === 'symmetric_difference') {
        // Symmetric: unique to either set glows
        const uniqueA = items.filter(x => !otherSetItems.includes(x));
        setGlowItems(uniqueA);
      }
    }

    // 3. Spawns / Deletes Transitions
    if (activeOperation === 'add') {
      setNewVal(affectedValue);
      setItems(newItems);
    } else if (activeOperation === 'remove' || activeOperation === 'discard' || activeOperation === 'pop') {
      if (affectedValue) {
        setDeletedVal(affectedValue);
        setTimeout(() => {
          setItems(newItems);
          setDeletedVal(null);
        }, 400);
      } else {
        setItems(newItems);
      }
    } else {
      // General operations
      setItems(newItems);
    }

    if (resVal !== null && resVal !== undefined) {
      setResult({ value: resVal, type: resultType });
    }

    setLogs(prev => [{ timestamp: time, expression: logEntry, isError: false }, ...prev].slice(0, 6));
  };

  useEffect(() => {
    resetTransitions();
    setResult(null);
  }, [activeOperation]);

  return (
    <div className="set-vis-container">
      <div className="set-vis-middle">
        {!showMathView ? (
          <SetCanvas 
            items={items}
            title="Set Representation (Flow Wrap)"
            newVal={newVal}
            duplicateVal={duplicateVal}
            deletedVal={deletedVal}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="set-math-grid">
              <SetCanvas 
                items={items}
                title="Set A"
                dimmedVals={dimmedItems}
                glowVals={glowItems}
              />
              <SetCanvas 
                items={otherItems}
                title="Set B"
              />
            </div>
            
            <div className="set-math-arrow-down">↓</div>
            
            <div className="sv-card" style={{ borderColor: 'rgba(45, 212, 191, 0.4)' }}>
              <div className="sv-header">Result Set</div>
              <div className="set-wrap-canvas" style={{ background: 'rgba(45, 212, 191, 0.02)' }}>
                {result && result.value && result.value !== '{}' ? (
                  result.value.replace(/[{}]/g, '').split(',').map(s => s.trim().replace(/'/g, '')).map(val => (
                    <SetChip key={val} val={val} isGlow={true} />
                  ))
                ) : (
                  <div style={{ color: '#666', fontStyle: 'italic', fontSize: '13px' }}>Empty Set</div>
                )}
              </div>
            </div>
          </div>
        )}

        <ResultDisplay result={result} errorMsg={errorMsg} />

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
