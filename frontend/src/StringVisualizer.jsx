import React, { useState, useEffect } from 'react';
import './StringVisualizer.css';
import { executeStringOp } from './stringOps';

function CharCell({ char, index, highlighted }) {
  return (
    <div className={`sv-char-cell ${highlighted ? 'highlighted' : ''}`}>
      <span className="sv-char-val">{char === ' ' ? '␣' : char}</span>
      <span className="sv-char-idx">{index}</span>
    </div>
  );
}

function StringInput({ currentString, pendingString, setPendingString, onSet, onClear, highlightedIndices, flash }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSet();
  };

  return (
    <div className="sv-card">
      <div className="sv-string-toolbar">
        <input 
          type="text" 
          className="sv-input-bar" 
          placeholder="Enter string here..." 
          value={pendingString} 
          onChange={e => setPendingString(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="sv-btn sv-btn-set" onClick={onSet} title="Load this string">
          Set
        </button>
        <button className="sv-btn sv-btn-clear" onClick={onClear} title="Clear string">
          ×
        </button>
      </div>

      <div className="sv-current-label">
        <span>Current String</span>
        <span className="sv-len-badge">{currentString.length} chars</span>
      </div>

      <div className={`sv-cells-container ${flash ? 'sv-flash' : ''}`}>
        {currentString.split('').map((char, i) => (
          <CharCell 
            key={`${i}-${char}`} 
            char={char} 
            index={i} 
            highlighted={highlightedIndices.includes(i)} 
          />
        ))}
        {currentString.length === 0 && <div style={{color: '#666', padding: '16px', fontStyle: 'italic'}}>Empty String — type above and click Set</div>}
      </div>
    </div>
  );
}

function ResultDisplay({ result }) {
  if (!result) return (
    <div className="sv-card">
      <div className="sv-header">Result</div>
      <div style={{color: '#666', fontStyle: 'italic', padding: '12px 0'}}>No result yet.</div>
    </div>
  );

  let typeBadge = typeof result.value;
  if (Array.isArray(result.value)) typeBadge = 'list';
  if (result.value === null) typeBadge = 'None';

  return (
    <div className="sv-card">
      <div className="sv-header">Result</div>
      <div>
        <span className="sv-result-val">
          {typeof result.value === 'string' ? `"${result.value}"` : 
           typeof result.value === 'boolean' ? (result.value ? 'True' : 'False') :
           Array.isArray(result.value) ? JSON.stringify(result.value) :
           result.value}
        </span>
        <span className="sv-badge">{typeBadge}</span>
      </div>
      
      {typeof result.value === 'string' && result.value.length > 0 && (
        <div className="sv-cells-container" style={{marginTop: '16px'}}>
          {result.value.split('').map((char, i) => (
            <CharCell key={`res-${i}`} char={char} index={i} highlighted={false} />
          ))}
        </div>
      )}
    </div>
  );
}

function OperationLog({ logs }) {
  return (
    <div className="sv-card" style={{flexGrow: 1}}>
      <div className="sv-header">Operation Log</div>
      <div className="sv-log-container">
        {logs.length === 0 && <span style={{color: '#666'}}>Log is empty.</span>}
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

  const params = [];
  if (['index_access'].includes(activeOp)) params.push('index');
  if (['slice'].includes(activeOp)) params.push('start', 'end');
  if (['count', 'find', 'index', 'startswith', 'endswith', 'in', 'anagram'].includes(activeOp)) params.push('target');
  if (['center', 'ljust', 'rjust', 'zfill'].includes(activeOp)) params.push('width', 'fill');
  if (['replace'].includes(activeOp)) params.push('old', 'new');
  if (['concat'].includes(activeOp)) params.push('str');
  if (['repeat'].includes(activeOp)) params.push('times');
  if (['split'].includes(activeOp)) params.push('sep');
  if (['join'].includes(activeOp)) params.push('iterable');

  return (
    <div className="sv-form">
      {params.map(p => (
        <input 
          key={p} 
          type="text" 
          className="sv-form-input" 
          placeholder={p} 
          value={args[p] || ''} 
          onChange={e => handleChange(p, e.target.value)} 
        />
      ))}
      <button className="sv-btn" onClick={() => onRun(args)}>Run</button>
    </div>
  );
}

function OperationItem({ op, activeOp, setActiveOp }) {
  const isActive = activeOp === op;
  return (
    <div className={`sv-op-item ${isActive ? 'active' : ''}`} onClick={() => setActiveOp(op)}>
      <span className="sv-op-name">{op}</span>
    </div>
  );
}

function OperationGroup({ label, ops, activeOp, setActiveOp, children }) {
  const [open, setOpen] = useState(true);
  
  return (
    <div style={{marginBottom: '16px'}}>
      <div className="sv-header" onClick={() => setOpen(!open)}>
        {label} <span>{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
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
    <div className="string-vis-right">
      <OperationGroup label="Access & Info" ops={['len', 'index_access', 'slice', 'count']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['len', 'index_access', 'slice', 'count'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
      
      <OperationGroup label="Search & Check" ops={['find', 'index', 'startswith', 'endswith', 'in', 'isalpha', 'isdigit', 'isalnum', 'isspace', 'isupper', 'islower']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['find', 'index', 'startswith', 'endswith', 'in', 'isalpha', 'isdigit', 'isalnum', 'isspace', 'isupper', 'islower'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Case" ops={['upper', 'lower', 'title', 'capitalize', 'swapcase']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['upper', 'lower', 'title', 'capitalize', 'swapcase'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Trim & Pad" ops={['strip', 'lstrip', 'rstrip', 'center', 'ljust', 'rjust', 'zfill']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['strip', 'lstrip', 'rstrip', 'center', 'ljust', 'rjust', 'zfill'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Modify & Replace" ops={['replace', 'concat', 'repeat']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['replace', 'concat', 'repeat'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Split & Join" ops={['split', 'splitlines', 'join']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['split', 'splitlines', 'join'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Convert" ops={['ord', 'chr', 'int', 'float', 'list']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['ord', 'chr', 'int', 'float', 'list'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Algorithms" ops={['reverse', 'palindrome', 'anagram', 'run-length']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['reverse', 'palindrome', 'anagram', 'run-length'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
    </div>
  );
}

export default function StringVisualizer() {
  const [currentString, setCurrentString] = useState('Hello World');
  const [pendingString, setPendingString] = useState('Hello World');
  const [activeOperation, setActiveOperation] = useState(null);
  const [highlightedIndices, setHighlightedIndices] = useState([]);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [flash, setFlash] = useState(false);

  const handleSet = () => {
    setCurrentString(pendingString);
    setHighlightedIndices([]);
    setResult(null);
    // Flash animation to confirm the string was loaded
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [{ timestamp: time, expression: `→ String set to "${pendingString}"`, isError: false }, ...prev].slice(0, 6));
  };

  const handleClear = () => {
    setPendingString('');
    setCurrentString('');
    setHighlightedIndices([]);
    setResult(null);
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [{ timestamp: time, expression: '→ String cleared', isError: false }, ...prev].slice(0, 6));
  };

  const handleRun = (args) => {
    if (!activeOperation) return;
    
    // Clear previous
    setHighlightedIndices([]);
    setResult(null);

    const { result: resValue, highlightedIndices: hIndices, logEntry, isError } = executeStringOp(currentString, activeOperation, args);
    
    setHighlightedIndices(hIndices || []);
    if (!isError && resValue !== undefined) {
      setResult({ value: resValue });
    }

    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLog = { timestamp: time, expression: logEntry, isError };
    setLogs(prev => [newLog, ...prev].slice(0, 6));
  };

  // When active operation changes, clear highlights and result
  useEffect(() => {
    setHighlightedIndices([]);
    setResult(null);
  }, [activeOperation]);

  return (
    <div className="string-vis-container">
      <div className="string-vis-middle">
        <StringInput 
          currentString={currentString}
          pendingString={pendingString}
          setPendingString={setPendingString}
          onSet={handleSet}
          onClear={handleClear}
          highlightedIndices={highlightedIndices}
          flash={flash}
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
