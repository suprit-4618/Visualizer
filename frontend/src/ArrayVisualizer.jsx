import React, { useState, useEffect, useRef } from 'react';
import './ArrayVisualizer.css';
import { executeArrayOp } from './arrayOps';

function ArrayCell({ value, index, ghost, highlighted, pointers, pulse }) {
  // Determine if there are active pointers on this cell
  const ptrList = [];
  if (pointers) {
    if (pointers.low === index) ptrList.push({ name: 'low', type: 'low' });
    if (pointers.high === index) ptrList.push({ name: 'high', type: 'high' });
    if (pointers.mid === index) ptrList.push({ name: 'mid', type: 'mid' });
    if (pointers.active === index) ptrList.push({ name: 'i', type: 'active' });
  }

  return (
    <div className={`av-char-cell ${ghost ? 'ghost' : ''} ${highlighted ? 'highlighted' : ''} ${pulse ? 'pulse' : ''}`}>
      {ptrList.map((ptr, idx) => (
        <span 
          key={idx} 
          className={`av-pointer-badge ${ptr.type}`} 
          style={{ top: `${-20 - idx * 16}px` }}
        >
          {ptr.name}
        </span>
      ))}
      <span className="av-char-val">{ghost ? '-' : value}</span>
      <span className="av-char-idx">{index}</span>
    </div>
  );
}

function ArrayDisplay({ array, capacity, highlightedIndices, pointers, successIndex }) {
  const cells = [];
  
  // Render filled slots
  for (let i = 0; i < array.length; i++) {
    cells.push(
      <ArrayCell 
        key={`filled-${i}`}
        value={array[i]}
        index={i}
        ghost={false}
        highlighted={highlightedIndices.includes(i)}
        pointers={pointers}
        pulse={successIndex === i}
      />
    );
  }

  // Render empty capacity slots as ghost cells
  for (let i = array.length; i < capacity; i++) {
    cells.push(
      <ArrayCell 
        key={`ghost-${i}`}
        value="-"
        index={i}
        ghost={true}
        highlighted={false}
        pointers={null}
        pulse={false}
      />
    );
  }

  return (
    <div className="av-card">
      <div className="av-header">
        Array Canvas
        <span style={{fontSize: '11px', color: '#666'}}>Length: {array.length} / Capacity: {capacity}</span>
      </div>
      <div className="av-cells-container">
        {cells}
      </div>
    </div>
  );
}

function AlgorithmPlayer({ steps, currentStepIdx, setCurrentStepIdx, activeMessage }) {
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      setPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleTogglePlay = () => {
    setPlaying(!playing);
  };

  const handleReset = () => {
    setPlaying(false);
    setCurrentStepIdx(0);
  };

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev >= steps.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 600);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [playing, steps]);

  return (
    <div className="av-player">
      <span className="av-player-info">
        Step {currentStepIdx + 1} of {steps.length}: {activeMessage}
      </span>
      <div className="av-player-controls">
        <button className="av-player-btn" onClick={handlePrev} disabled={currentStepIdx === 0}>Prev</button>
        <button className="av-player-btn" onClick={handleTogglePlay}>
          {playing ? 'Pause' : 'Auto Play'}
        </button>
        <button className="av-player-btn" onClick={handleNext} disabled={currentStepIdx === steps.length - 1}>Next</button>
        <button className="av-player-btn" onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}

function ResultDisplay({ result }) {
  if (!result) return (
    <div className="av-card">
      <div className="av-header">Result</div>
      <div style={{color: '#666', fontStyle: 'italic', padding: '12px 0'}}>No result yet.</div>
    </div>
  );

  return (
    <div className="av-card">
      <div className="av-header">Result</div>
      <div>
        <span className="av-result-val">
          {typeof result.value === 'boolean' ? (result.value ? 'True' : 'False') :
           Array.isArray(result.value) ? `[${result.value.join(', ')}]` :
           result.value}
        </span>
        <span className="av-badge">{result.type}</span>
      </div>
    </div>
  );
}

function OperationLog({ logs }) {
  return (
    <div className="av-card" style={{flexGrow: 1}}>
      <div className="av-header">Operation Log</div>
      <div className="av-log-container">
        {logs.length === 0 && <span style={{color: '#666'}}>Log is empty.</span>}
        {logs.map((l, i) => (
          <div key={i} className={l.isError ? 'av-log-error' : 'av-log-success'}>
            <span className="av-log-time">[{l.timestamp}]</span>
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
  if (['get', 'set', 'insert', 'remove'].includes(activeOp)) params.push('index');
  if (['set', 'insert', 'contains', 'append', 'linear_search', 'binary_search', 'fill', 'extend'].includes(activeOp)) params.push('value');
  if (['slice'].includes(activeOp)) params.push('start', 'end');

  return (
    <div className="av-form">
      {params.map(p => (
        <input 
          key={p} 
          type="text" 
          className="av-form-input" 
          placeholder={p} 
          value={args[p] || ''} 
          onChange={e => handleChange(p, e.target.value)} 
        />
      ))}
      <button className="av-btn" onClick={() => onRun(args)}>Run</button>
    </div>
  );
}

function OperationItem({ op, activeOp, setActiveOp }) {
  const isActive = activeOp === op;
  const displayName = op === 'linear_search' ? 'linear search' : 
                      op === 'binary_search' ? 'binary search' : 
                      op === 'bubble_sort' ? 'bubble sort' : 
                      op === 'selection_sort' ? 'selection sort' : 
                      op === 'insertion_sort' ? 'insertion sort' : op;
                      
  return (
    <div className={`av-op-item ${isActive ? 'active' : ''}`} onClick={() => setActiveOp(op)}>
      <span className="av-op-name" style={{textTransform: 'capitalize'}}>{displayName}</span>
    </div>
  );
}

function OperationGroup({ label, ops, activeOp, setActiveOp, children }) {
  const [open, setOpen] = useState(true);
  
  return (
    <div style={{marginBottom: '16px'}}>
      <div className="av-header" onClick={() => setOpen(!open)}>
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
    <div className="array-vis-right">
      <OperationGroup label="Access & Info" ops={['get', 'set', 'len', 'contains']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['get', 'set', 'len', 'contains'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
      
      <OperationGroup label="Modify" ops={['append', 'insert', 'remove', 'pop', 'clear']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['append', 'insert', 'remove', 'pop', 'clear'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Search" ops={['linear_search', 'binary_search']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['linear_search', 'binary_search'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Sort" ops={['bubble_sort', 'selection_sort', 'insertion_sort']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['bubble_sort', 'selection_sort', 'insertion_sort'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Slice" ops={['slice', 'copy']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['slice', 'copy'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Bulk" ops={['reverse', 'fill', 'extend']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['reverse', 'fill', 'extend'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
    </div>
  );
}

export default function ArrayVisualizer() {
  const [array, setArray] = useState(['45', '12', '89', '7', '56']);
  const [capacity, setCapacity] = useState(8);
  const [activeOperation, setActiveOperation] = useState(null);
  const [highlightedIndices, setHighlightedIndices] = useState([]);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Algorithm Step player states
  const [steps, setSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const handleRun = (args) => {
    if (!activeOperation) return;
    
    // Clear player and highlights
    setSteps([]);
    setCurrentStepIdx(0);
    setHighlightedIndices([]);
    setResult(null);

    const { 
      result: resVal, 
      resultType, 
      highlightedIndices: hIndices, 
      logEntry, 
      isError, 
      steps: algSteps, 
      nextArr 
    } = executeArrayOp(array, capacity, activeOperation, args);

    if (isError) {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => [{ timestamp: time, expression: logEntry, isError: true }, ...prev].slice(0, 6));
      return;
    }

    if (algSteps && algSteps.length > 0) {
      // Step-by-step algorithms
      setSteps(algSteps);
      setCurrentStepIdx(0);
      
      // Determine final result value
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => [{ timestamp: time, expression: logEntry, isError: false }, ...prev].slice(0, 6));
      
      // Update state to final array once sort completes
      if (['bubble_sort', 'selection_sort', 'insertion_sort'].includes(activeOperation)) {
        setArray(nextArr);
      }
    } else {
      // Simple immediate operations
      setHighlightedIndices(hIndices || []);
      if (resVal !== null && resVal !== undefined) {
        if (resultType === 'array') {
          setArray(resVal);
        } else {
          setResult({ value: resVal, type: resultType });
        }
      }
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => [{ timestamp: time, expression: logEntry, isError: false }, ...prev].slice(0, 6));
    }
  };

  // Clear states when toggling operation
  useEffect(() => {
    setSteps([]);
    setCurrentStepIdx(0);
    setHighlightedIndices([]);
    setResult(null);
  }, [activeOperation]);

  // Derived state from algorithm step player
  const activeStep = steps[currentStepIdx];
  const renderedArray = activeStep ? activeStep.arrayState : array;
  const renderedHighlights = activeStep ? activeStep.highlightedIndices : highlightedIndices;
  const renderedPointers = activeStep ? activeStep.pointers : null;
  const activeMessage = activeStep ? activeStep.message : '';
  const successIndex = activeStep && activeStep.success && activeStep.highlightedIndices.length > 0 ? activeStep.highlightedIndices[0] : -1;

  return (
    <div className="array-vis-container">
      <div className="array-vis-middle">
        {/* Capacity controller at the top of canvas */}
        <div className="av-card av-state-bar">
          <span style={{fontSize: '13px', color: '#ccc'}}>Initialize/Set Array Capacity:</span>
          <input 
            type="number" 
            className="av-capacity-input" 
            value={capacity} 
            onChange={e => setCapacity(Math.max(array.length, parseInt(e.target.value) || array.length))} 
          />
        </div>

        <ArrayDisplay 
          array={renderedArray}
          capacity={capacity}
          highlightedIndices={renderedHighlights}
          pointers={renderedPointers}
          successIndex={successIndex}
        />

        {steps.length > 0 && (
          <AlgorithmPlayer 
            steps={steps}
            currentStepIdx={currentStepIdx}
            setCurrentStepIdx={setCurrentStepIdx}
            activeMessage={activeMessage}
          />
        )}

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
