import React, { useState, useEffect, useRef } from 'react';
import './ListVisualizer.css';
import { executeListOp } from './listOps';

function ListCell({ value, index, ghost, highlighted, removeMark, negativeIdx }) {
  return (
    <div className={`lv-char-cell ${ghost ? 'ghost' : ''} ${highlighted ? 'highlighted' : ''} ${removeMark ? 'remove-mark' : ''}`}>
      <span className="lv-char-val">{ghost ? '-' : value}</span>
      <div className="lv-indices-wrapper">
        <span className="lv-char-idx">{index}</span>
        {negativeIdx !== undefined && negativeIdx !== null && (
          <span className="lv-char-neg-idx">{negativeIdx}</span>
        )}
      </div>
    </div>
  );
}

function ListDisplay({ array, capacity, highlightedIndices, negativeIndices, isResizeStep, removeMarkIndex }) {
  const cells = [];
  
  for (let i = 0; i < array.length; i++) {
    const isRemoving = removeMarkIndex === i;
    const hasNegLabel = negativeIndices.length > i;
    const negIdxVal = hasNegLabel ? negativeIndices[i] : null;

    cells.push(
      <ListCell 
        key={`filled-${i}`}
        value={array[i]}
        index={i}
        ghost={false}
        highlighted={highlightedIndices.includes(i)}
        removeMark={isRemoving}
        negativeIdx={negIdxVal}
      />
    );
  }

  for (let i = array.length; i < capacity; i++) {
    cells.push(
      <ListCell 
        key={`ghost-${i}`}
        value="-"
        index={i}
        ghost={true}
        highlighted={false}
        removeMark={false}
        negativeIdx={null}
      />
    );
  }

  return (
    <div className={`lv-card ${isResizeStep ? 'resizing' : ''}`}>
      <div className="lv-header">
        List Canvas
        <span style={{fontSize: '11px', color: '#666'}}>
          Size: {array.length} / Allocated (Capacity): {capacity}
        </span>
      </div>
      <div className="lv-cells-container">
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
      }, 700);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [playing, steps]);

  return (
    <div className="lv-player">
      <span className="lv-player-info">
        Step {currentStepIdx + 1} of {steps.length}: {activeMessage}
      </span>
      <div className="lv-player-controls">
        <button className="lv-player-btn" onClick={handlePrev} disabled={currentStepIdx === 0}>Prev</button>
        <button className="lv-player-btn" onClick={handleTogglePlay}>
          {playing ? 'Pause' : 'Auto Play'}
        </button>
        <button className="lv-player-btn" onClick={handleNext} disabled={currentStepIdx === steps.length - 1}>Next</button>
        <button className="lv-player-btn" onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}

function ResultDisplay({ result }) {
  if (!result) return (
    <div className="lv-card">
      <div className="lv-header">Result</div>
      <div style={{color: '#666', fontStyle: 'italic', padding: '12px 0'}}>No result yet.</div>
    </div>
  );

  return (
    <div className="lv-card">
      <div className="lv-header">Result</div>
      <div>
        <span className="lv-result-val">
          {typeof result.value === 'boolean' ? (result.value ? 'True' : 'False') :
           Array.isArray(result.value) ? `[${result.value.join(', ')}]` :
           result.value}
        </span>
        <span className="lv-badge">{result.type}</span>
      </div>
    </div>
  );
}

function OperationLog({ logs }) {
  return (
    <div className="lv-card" style={{flexGrow: 1}}>
      <div className="lv-header">Operation Log</div>
      <div className="lv-log-container">
        {logs.length === 0 && <span style={{color: '#666'}}>Log is empty.</span>}
        {logs.map((l, i) => (
          <div key={i} className={l.isError ? 'lv-log-error' : 'lv-log-success'}>
            <span className="lv-log-time">[{l.timestamp}]</span>
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
  if (['get', 'set', 'insert', 'pop'].includes(activeOp)) params.push('index');
  if (['set', 'insert', 'append', 'extend', 'remove', 'count', 'index', 'in_operator', 'fill'].includes(activeOp)) params.push('value');
  if (['slice_copy'].includes(activeOp)) params.push('start', 'end');

  return (
    <div className="lv-form">
      {params.map(p => (
        <input 
          key={p} 
          type="text" 
          className="lv-form-input" 
          placeholder={p} 
          value={args[p] || ''} 
          onChange={e => handleChange(p, e.target.value)} 
        />
      ))}
      <button className="lv-btn" onClick={() => onRun(args)}>Run</button>
    </div>
  );
}

function OperationItem({ op, activeOp, setActiveOp }) {
  const isActive = activeOp === op;
  const displayName = op === 'in_operator' ? 'in operator' : 
                      op === 'slice_copy' ? 'slice copy' : 
                      op === 'sorted' ? 'sorted copy' : op;
                      
  return (
    <div className={`lv-op-item ${isActive ? 'active' : ''}`} onClick={() => setActiveOp(op)}>
      <span className="lv-op-name" style={{textTransform: 'capitalize'}}>{displayName}</span>
    </div>
  );
}

function OperationGroup({ label, ops, activeOp, setActiveOp, children }) {
  const [open, setOpen] = useState(true);
  
  return (
    <div style={{marginBottom: '16px'}}>
      <div className="lv-header" onClick={() => setOpen(!open)}>
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
    <div className="list-vis-right">
      <OperationGroup label="Add" ops={['append', 'insert', 'extend']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['append', 'insert', 'extend'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
      
      <OperationGroup label="Remove" ops={['remove', 'pop', 'clear']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['remove', 'pop', 'clear'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Access" ops={['get', 'set', 'index', 'count']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['get', 'set', 'index', 'count'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Order" ops={['reverse', 'sort', 'sorted']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['reverse', 'sort', 'sorted'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Info" ops={['len', 'in_operator', 'min', 'max', 'sum']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['len', 'in_operator', 'min', 'max', 'sum'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Copy" ops={['copy', 'slice_copy']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['copy', 'slice_copy'].includes(activeOp) && <OperationForm activeOp={activeOp} onRun={onRun} />}
      </OperationGroup>
    </div>
  );
}

export default function ListVisualizer() {
  const [list, setList] = useState(['15', '42', '8', '99']);
  const [capacity, setCapacity] = useState(4);
  const [activeOperation, setActiveOperation] = useState(null);
  const [highlightedIndices, setHighlightedIndices] = useState([]);
  const [negativeIndices, setNegativeIndices] = useState([]);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Stepping traces
  const [steps, setSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const handleRun = (args) => {
    if (!activeOperation) return;
    
    // Clear previous highlights & traces
    setSteps([]);
    setCurrentStepIdx(0);
    setHighlightedIndices([]);
    setNegativeIndices([]);
    setResult(null);

    const { 
      result: resVal, 
      resultType, 
      highlightedIndices: hIndices, 
      negativeIndices: nIndices,
      logEntry, 
      isError, 
      steps: algSteps, 
      nextArr,
      nextCapacity
    } = executeListOp(list, capacity, activeOperation, args);

    if (isError) {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => [{ timestamp: time, expression: logEntry, isError: true }, ...prev].slice(0, 6));
      return;
    }

    if (nIndices && nIndices.length > 0) {
      setNegativeIndices(nIndices);
    }

    if (algSteps && algSteps.length > 0) {
      setSteps(algSteps);
      setCurrentStepIdx(0);
      
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => [{ timestamp: time, expression: logEntry, isError: false }, ...prev].slice(0, 6));
      
      // Update once operations complete
      setList(nextArr);
      if (nextCapacity) {
        setCapacity(nextCapacity);
      }
    } else {
      setHighlightedIndices(hIndices || []);
      if (resVal !== null && resVal !== undefined) {
        if (resultType === 'list') {
          setList(resVal);
          if (nextCapacity) {
            setCapacity(nextCapacity);
          }
        } else {
          setResult({ value: resVal, type: resultType });
        }
      }
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => [{ timestamp: time, expression: logEntry, isError: false }, ...prev].slice(0, 6));
    }
  };

  useEffect(() => {
    setSteps([]);
    setCurrentStepIdx(0);
    setHighlightedIndices([]);
    setNegativeIndices([]);
    setResult(null);
  }, [activeOperation]);

  // Derive steps
  const activeStep = steps[currentStepIdx];
  const renderedList = activeStep ? activeStep.arrayState : list;
  const renderedCapacity = activeStep ? activeStep.capacity : capacity;
  const renderedHighlights = activeStep ? activeStep.highlightedIndices : highlightedIndices;
  const activeMessage = activeStep ? activeStep.message : '';
  const isResizeStep = activeStep && activeStep.resize;
  const removeMarkIndex = activeStep && activeStep.removeMark && activeStep.highlightedIndices.length > 0 ? activeStep.highlightedIndices[0] : -1;

  return (
    <div className="list-vis-container">
      <div className="list-vis-middle">
        <ListDisplay 
          array={renderedList}
          capacity={renderedCapacity}
          highlightedIndices={renderedHighlights}
          negativeIndices={negativeIndices}
          isResizeStep={isResizeStep}
          removeMarkIndex={removeMarkIndex}
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
