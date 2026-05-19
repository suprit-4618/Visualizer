import React, { useState, useEffect } from 'react';
import './DictVisualizer.css';
import { executeDictOp } from './dictOps';

function DictPairRow({ pairKey, pairValue, glow, pulse, flashAmber, isDeleted, isNew, isIterating }) {
  let rowCls = 'dict-pair-row';
  if (isNew) rowCls += ' dict-row-new';
  if (isDeleted) rowCls += ' dict-row-deleted';
  if (isIterating) rowCls += ' dict-row-iterating';

  return (
    <div className={rowCls} style={{ borderLeft: isIterating ? '3px solid #2dd4bf' : undefined }}>
      {/* Key cell bg (#1e2020) */}
      <div className={`dict-key-cell ${glow ? 'glow-teal' : ''}`}>
        <span>{pairKey}</span>
        <span style={{ fontSize: '9px', color: '#666', fontWeight: 'normal' }}>key</span>
      </div>

      <span className="dict-arrow">→</span>

      {/* Value cell normal surface bg */}
      <div className={`dict-val-cell ${pulse ? 'pulse' : ''} ${flashAmber ? 'flash-amber' : ''}`}>
        <span>{pairValue}</span>
      </div>
    </div>
  );
}

function DictPairsCanvas({ 
  pairs, 
  glowKey, 
  pulseValue, 
  flashAmberValue, 
  deletedKey, 
  canvasErrorFlash, 
  iteratingIdx 
}) {
  return (
    <div className={`dv-card ${canvasErrorFlash ? 'flash-red' : ''}`}>
      <div className="dv-header">
        Dictionary Canvas
        <span style={{ fontSize: '11px', color: '#666' }}>
          Size: {pairs.length} (Key-Value Hash Map)
        </span>
      </div>

      <div className="dict-pairs-container">
        {pairs.length === 0 && (
          <div style={{ color: '#666', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
            Empty dictionary.
          </div>
        )}
        {pairs.map((p, i) => {
          const isDeleted = deletedKey === p.key;
          const isGlow = glowKey === p.key;
          const isPulse = pulseValue === p.key;
          const isFlashAmber = flashAmberValue === p.key;
          const isIterating = iteratingIdx === i;

          return (
            <DictPairRow 
              key={p.key}
              pairKey={p.key}
              pairValue={p.value}
              glow={isGlow}
              pulse={isPulse}
              flashAmber={isFlashAmber}
              isDeleted={isDeleted}
              isNew={p.isNew}
              isIterating={isIterating}
            />
          );
        })}
      </div>
    </div>
  );
}

function CollapsedFlatList({ label, items, expand, setExpand, highlightAll }) {
  return (
    <div className={`dict-collapsed-card ${expand ? 'glow-active' : ''}`}>
      <div className="dv-header" onClick={() => setExpand(!expand)}>
        <span>{label} List ({items.length})</span>
        <span>{expand ? '▼' : '▶'}</span>
      </div>
      
      {expand && (
        <div className="dict-flat-list">
          {items.length === 0 && (
            <span style={{ color: '#666', fontStyle: 'italic', fontSize: '12px' }}>Empty</span>
          )}
          {items.map((item, i) => (
            <div key={i} className={`dict-flat-item ${highlightAll ? 'glow-teal' : ''}`}>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultDisplay({ result, errorMsg }) {
  if (errorMsg) return (
    <div className="dv-card">
      <div className="dv-header">Result</div>
      <div className="dv-result-error">{errorMsg}</div>
    </div>
  );

  if (!result) return (
    <div className="dv-card">
      <div className="dv-header">Result</div>
      <div style={{ color: '#666', fontStyle: 'italic', padding: '12px 0' }}>No result yet.</div>
    </div>
  );

  return (
    <div className="dv-card">
      <div className="dv-header">Result</div>
      <div>
        <span className="dv-result-val">
          {typeof result.value === 'boolean' ? (result.value ? 'True' : 'False') :
           Array.isArray(result.value) ? `[${result.value.join(', ')}]` :
           result.value}
        </span>
        <span className="dv-badge">{result.type}</span>
      </div>
    </div>
  );
}

function OperationLog({ logs }) {
  return (
    <div className="dv-card" style={{ flexGrow: 1 }}>
      <div className="dv-header">Operation Log</div>
      <div className="dv-log-container">
        {logs.length === 0 && <span style={{ color: '#666' }}>Log is empty.</span>}
        {logs.map((l, i) => (
          <div key={i} className={l.isError ? 'dv-log-error' : 'dv-log-success'}>
            <span className="dv-log-time">[{l.timestamp}]</span>
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
  if (['get', 'get_default', 'set', 'delete', 'pop', 'in_operator'].includes(activeOp)) params.push('key');
  if (['get_default', 'set', 'update', 'fromkeys'].includes(activeOp)) params.push('value');

  const getPlaceholder = (p) => {
    if (activeOp === 'update' && p === 'value') return 'JSON (e.g. {"c": 3, "d": 4})';
    if (activeOp === 'fromkeys' && p === 'key') return 'keys (e.g. a, b, c)';
    if (activeOp === 'fromkeys' && p === 'value') return 'default val';
    return p;
  };

  return (
    <div className="dv-form">
      {params.map(p => (
        <input 
          key={p} 
          type="text" 
          className="dv-form-input" 
          placeholder={getPlaceholder(p)} 
          value={args[p] || ''} 
          onChange={e => handleChange(p, e.target.value)} 
        />
      ))}
      <button className="dv-btn" onClick={() => onRun(args)}>Run</button>
    </div>
  );
}

function OperationItem({ op, activeOp, setActiveOp }) {
  const isActive = activeOp === op;
  const displayName = op === 'in_operator' ? 'in operator (key exists)' : 
                      op === 'get_default' ? 'get(key, default)' : 
                      op === 'to_list_tuples' ? 'to list of tuples' : 
                      op === 'iterate' ? 'show iteration order' : op;
                      
  return (
    <div className={`dv-op-item ${isActive ? 'active' : ''}`} onClick={() => setActiveOp(op)}>
      <span className="dv-op-name" style={{ textTransform: 'capitalize' }}>{displayName}</span>
    </div>
  );
}

function OperationGroup({ label, ops, activeOp, setActiveOp, children }) {
  const [open, setOpen] = useState(true);
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div className="dv-header" onClick={() => setOpen(!open)}>
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
    <div className="dict-vis-right">
      <OperationGroup label="Access" ops={['get', 'get_default', 'keys', 'values', 'items']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['get', 'get_default', 'keys', 'values', 'items'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
      
      <OperationGroup label="Modify" ops={['set', 'update', 'delete', 'pop', 'clear']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['set', 'update', 'delete', 'pop', 'clear'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Check" ops={['in_operator', 'len']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['in_operator', 'len'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Iterate" ops={['iterate']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['iterate'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Convert" ops={['to_list_tuples', 'fromkeys']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['to_list_tuples', 'fromkeys'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
    </div>
  );
}

export default function DictVisualizer() {
  const [pairs, setPairs] = useState([
    { key: 'name', value: 'Alice' },
    { key: 'age', value: '25' },
    { key: 'role', value: 'Admin' }
  ]);
  const [activeOperation, setActiveOperation] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [logs, setLogs] = useState([]);

  // Accordion lists
  const [expandKeys, setExpandKeys] = useState(false);
  const [expandValues, setExpandValues] = useState(false);
  const [highlightAllFlat, setHighlightAllFlat] = useState(false);

  // Grid animations
  const [glowKey, setGlowKey] = useState(null);
  const [pulseValue, setPulseValue] = useState(null);
  const [flashAmberValue, setFlashAmberValue] = useState(null);
  const [deletedKey, setDeletedKey] = useState(null);
  const [canvasErrorFlash, setCanvasErrorFlash] = useState(false);
  const [iteratingIdx, setIteratingIdx] = useState(-1);

  const resetAnimations = () => {
    setGlowKey(null);
    setPulseValue(null);
    setFlashAmberValue(null);
    setDeletedKey(null);
    setCanvasErrorFlash(false);
    setIteratingIdx(-1);
    setHighlightAllFlat(false);
    setErrorMsg(null);
  };

  const handleRun = (args) => {
    resetAnimations();
    setResult(null);

    const { 
      result: resVal, 
      resultType, 
      logEntry, 
      isError, 
      errorMessage, 
      affectedKey, 
      newPairs, 
      expandSection 
    } = executeDictOp(pairs, activeOperation, args);

    const time = new Date().toLocaleTimeString('en-US', { hour12: false });

    // 1. Error KeyError trigger red canvas flash
    if (isError) {
      setCanvasErrorFlash(true);
      setErrorMsg(errorMessage);
      setLogs(prev => [{ timestamp: time, expression: logEntry, isError: true }, ...prev].slice(0, 6));
      return;
    }

    // 2. Sequential iteration animation
    if (activeOperation === 'iterate') {
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < pairs.length) {
          setIteratingIdx(idx);
          idx++;
        } else {
          clearInterval(interval);
          setIteratingIdx(-1);
          setResult({ value: resVal, type: resultType });
          setLogs(prev => [{ timestamp: time, expression: logEntry, isError: false }, ...prev].slice(0, 6));
        }
      }, 400);
      return;
    }

    // 3. Highlight flat list expansions
    if (expandSection === 'keys') {
      setExpandKeys(true);
      setExpandValues(false);
      setHighlightAllFlat(true);
    } else if (expandSection === 'values') {
      setExpandValues(true);
      setExpandKeys(false);
      setHighlightAllFlat(true);
    }

    // 4. Mutation & Access key effects
    if (activeOperation === 'get' || activeOperation === 'get_default') {
      if (affectedKey) {
        setGlowKey(affectedKey);
        setPulseValue(affectedKey);
      }
    } else if (activeOperation === 'set') {
      const isExisting = pairs.some(p => p.key === args.key);
      if (isExisting) {
        setFlashAmberValue(args.key);
      }
    } else if (activeOperation === 'delete' || activeOperation === 'pop') {
      if (affectedKey) {
        setDeletedKey(affectedKey);
        setTimeout(() => {
          setPairs(newPairs);
          setDeletedKey(null);
        }, 400);
      }
    }

    // Apply updates (excluding delete which has a delay above)
    if (activeOperation !== 'delete' && activeOperation !== 'pop') {
      setPairs(newPairs);
    }

    if (resVal !== null && resVal !== undefined) {
      setResult({ value: resVal, type: resultType });
    }

    setLogs(prev => [{ timestamp: time, expression: logEntry, isError: false }, ...prev].slice(0, 6));
  };

  useEffect(() => {
    resetAnimations();
    setResult(null);
  }, [activeOperation]);

  return (
    <div className="dict-vis-container">
      <div className="dict-vis-middle">
        <DictPairsCanvas 
          pairs={pairs}
          glowKey={glowKey}
          pulseValue={pulseValue}
          flashAmberValue={flashAmberValue}
          deletedKey={deletedKey}
          canvasErrorFlash={canvasErrorFlash}
          iteratingIdx={iteratingIdx}
        />

        <CollapsedFlatList 
          label="Keys"
          items={pairs.map(p => p.key)}
          expand={expandKeys}
          setExpand={setExpandKeys}
          highlightAll={highlightAllFlat}
        />

        <CollapsedFlatList 
          label="Values"
          items={pairs.map(p => p.value)}
          expand={expandValues}
          setExpand={setExpandValues}
          highlightAll={highlightAllFlat}
        />

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
