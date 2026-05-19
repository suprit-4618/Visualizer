import React, { useState, useEffect } from 'react';
import './LinkedListVisualizer.css';
import { executeLinkedListOp } from './linkedListOps';

function ArrowConnector({ isDoubly }) {
  return (
    <div className="ll-connector">
      {isDoubly ? (
        <svg className="ll-arrow-svg doubly" viewBox="0 0 36 28">
          <path d="M 4 10 L 32 10" stroke="#2dd4bf" strokeWidth="2" fill="none" />
          <path d="M 32 10 L 26 6" stroke="#2dd4bf" strokeWidth="2" fill="none" />
          <path d="M 32 10 L 26 14" stroke="#2dd4bf" strokeWidth="2" fill="none" />
          
          <path d="M 32 18 L 4 18" stroke="#2dd4bf" strokeWidth="2" fill="none" />
          <path d="M 4 18 L 10 14" stroke="#2dd4bf" strokeWidth="2" fill="none" />
          <path d="M 4 18 L 10 22" stroke="#2dd4bf" strokeWidth="2" fill="none" />
        </svg>
      ) : (
        <svg className="ll-arrow-svg" viewBox="0 0 36 20">
          <path d="M 4 10 L 32 10" stroke="#2dd4bf" strokeWidth="2" fill="none" />
          <path d="M 32 10 L 26 6" stroke="#2dd4bf" strokeWidth="2" fill="none" />
          <path d="M 32 10 L 26 14" stroke="#2dd4bf" strokeWidth="2" fill="none" />
        </svg>
      )}
    </div>
  );
}

function NodeBox({ 
  val, 
  index, 
  totalNodes, 
  isGlow, 
  isDeleted, 
  spawnType, 
  isDoubly, 
  pointerIndex,
  slowIndex,
  fastIndex
}) {
  const isHead = index === 0;
  const isTail = index === totalNodes - 1;

  let wrapperCls = "ll-node-wrapper";
  if (spawnType) wrapperCls += ` ${spawnType}`;

  let boxCls = "ll-node-box";
  if (isGlow) boxCls += " glow-teal";
  if (isDeleted) boxCls += " fade-delete";

  return (
    <div className={wrapperCls}>
      {/* Pointer labels */}
      {isHead && (
        <div className="ll-pointer-label head">
          <span>HEAD</span>
          <span className="ll-arrow-down">↓</span>
        </div>
      )}
      {isTail && (
        <div className="ll-pointer-label tail">
          <span className="ll-arrow-up">↑</span>
          <span>TAIL</span>
        </div>
      )}

      {/* Traversal pointer diamond */}
      {pointerIndex === index && (
        <div className="ll-diamond-pointer" />
      )}

      {/* Slow/Fast advanced pointers */}
      {slowIndex === index && (
        <div className="ll-slow-ptr">slow</div>
      )}
      {fastIndex === index && (
        <div className="ll-fast-ptr">fast</div>
      )}

      <div className={boxCls}>
        <div className="ll-node-left">{val}</div>
        <div className="ll-node-right">
          {isDoubly && <span style={{ color: '#666', fontSize: '8px' }}>← prev</span>}
          <span>next →</span>
        </div>
      </div>
    </div>
  );
}

function ResultDisplay({ result, errorMsg }) {
  if (errorMsg) return (
    <div className="ll-card">
      <div className="ll-header">Result</div>
      <div className="ll-result-error">{errorMsg}</div>
    </div>
  );

  if (!result) return (
    <div className="ll-card">
      <div className="ll-header">Result</div>
      <div style={{ color: '#666', fontStyle: 'italic', padding: '12px 0' }}>No result yet.</div>
    </div>
  );

  return (
    <div className="ll-card">
      <div className="ll-header">Result</div>
      <div>
        <span className="ll-result-val">
          {typeof result.value === 'boolean' ? (result.value ? 'True' : 'False') : result.value}
        </span>
        <span className="ll-badge">{result.type}</span>
      </div>
    </div>
  );
}

function OperationLog({ logs }) {
  return (
    <div className="ll-card" style={{ flexGrow: 1 }}>
      <div className="ll-header">Operation Log</div>
      <div className="ll-log-container">
        {logs.length === 0 && <span style={{ color: '#666' }}>Log is empty.</span>}
        {logs.map((l, i) => (
          <div key={i} className={l.isError ? 'll-log-error' : 'll-log-success'}>
            <span className="ll-log-time">[{l.timestamp}]</span>
            {l.expression}
          </div>
        ))}
      </div>
    </div>
  );
}

function OperationForm({ activeOp, onRun, animating }) {
  const [args, setArgs] = useState({});

  useEffect(() => { setArgs({}); }, [activeOp]);

  if (!activeOp) return null;

  const handleChange = (k, v) => setArgs(prev => ({ ...prev, [k]: v }));

  const hasValue = ['insertHead', 'insertTail', 'insertAt', 'deleteVal', 'search', 'contains'].includes(activeOp);
  const hasIndex = ['insertAt', 'deleteAt', 'get'].includes(activeOp);

  return (
    <div className="ll-form">
      {hasValue && (
        <input 
          type="text" 
          className="ll-form-input" 
          placeholder="value" 
          value={args.value || ''} 
          disabled={animating}
          onChange={e => handleChange('value', e.target.value)} 
        />
      )}
      {hasIndex && (
        <input 
          type="number" 
          className="ll-form-input" 
          placeholder="index" 
          value={args.index || ''} 
          disabled={animating}
          onChange={e => handleChange('index', e.target.value)} 
        />
      )}
      <button className="ll-btn" onClick={() => onRun(args)} disabled={animating}>Run</button>
    </div>
  );
}

function OperationItem({ op, activeOp, setActiveOp }) {
  const isActive = activeOp === op;
  const displayName = op === 'insertHead' ? 'insert head' : 
                      op === 'insertTail' ? 'insert tail' : 
                      op === 'insertAt' ? 'insert at index' : 
                      op === 'deleteHead' ? 'delete head' : 
                      op === 'deleteTail' ? 'delete tail' : 
                      op === 'deleteAt' ? 'delete at index' : 
                      op === 'deleteVal' ? 'delete value' : 
                      op === 'isEmpty' ? 'is empty' : 
                      op === 'detectCycle' ? 'detect cycle' : 
                      op === 'findMiddle' ? 'find middle' : op;
                      
  return (
    <div className={`ll-op-item ${isActive ? 'active' : ''}`} onClick={() => setActiveOp(op)}>
      <span className="ll-op-name" style={{ textTransform: 'capitalize' }}>{displayName}</span>
    </div>
  );
}

function OperationGroup({ label, ops, activeOp, setActiveOp, children }) {
  const [open, setOpen] = useState(true);
  
  return (
    <div style={{ marginBottom: '12px' }}>
      <div className="ll-header" onClick={() => setOpen(!open)}>
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

export default function LinkedListVisualizer() {
  const [items, setItems] = useState(['15', '42', '8', '23']);
  const [activeOperation, setActiveOperation] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isDoubly, setIsDoubly] = useState(false);

  // Playback & Animation states
  const [animating, setAnimating] = useState(false);
  const [pointerIndex, setPointerIndex] = useState(null);
  const [slowIndex, setSlowIndex] = useState(null);
  const [fastIndex, setFastIndex] = useState(null);
  const [glowIndex, setGlowIndex] = useState(null);
  const [deletedIndex, setDeletedIndex] = useState(null);
  const [spawnIndex, setSpawnIndex] = useState(null);
  const [spawnType, setSpawnType] = useState(null); // 'spawn-head', 'spawn-tail', 'spawn-drop'
  const [playMessage, setPlayMessage] = useState('Ready to simulate.');

  const resetTransitions = () => {
    setPointerIndex(null);
    setSlowIndex(null);
    setFastIndex(null);
    setGlowIndex(null);
    setDeletedIndex(null);
    setSpawnIndex(null);
    setSpawnType(null);
    setErrorMsg(null);
    setPlayMessage('Ready to simulate.');
  };

  const handleRun = async (args) => {
    if (animating) return;
    resetTransitions();
    setResult(null);

    const { 
      result: resVal, 
      highlightedNodes, 
      removedNodes, 
      logEntry, 
      newItems, 
      steps, 
      isError, 
      errorMessage 
    } = executeLinkedListOp(items, activeOperation, args, isDoubly);

    const time = new Date().toLocaleTimeString('en-US', { hour12: false });

    if (isError) {
      setErrorMsg(errorMessage);
      setLogs(prev => [{ timestamp: time, expression: logEntry, isError: true }, ...prev].slice(0, 6));
      return;
    }

    setAnimating(true);

    // Play Traversal steps
    if (steps && steps.length > 0) {
      for (const step of steps) {
        setPlayMessage(step.message);
        if (step.type === 'traverse') {
          setPointerIndex(step.pointerIndex);
          await new Promise(r => setTimeout(r, 600));
        } else if (step.type === 'pointers') {
          setSlowIndex(step.slowIndex);
          setFastIndex(step.fastIndex);
          await new Promise(r => setTimeout(r, 800));
        } else if (step.type === 'glow') {
          setGlowIndex(step.glowIndex);
          setPointerIndex(null);
          await new Promise(r => setTimeout(r, 800));
        } else if (step.type === 'insert') {
          setSpawnIndex(step.insertIndex);
          setSpawnType('spawn-drop');
          setItems(newItems);
          await new Promise(r => setTimeout(r, 500));
        } else if (step.type === 'delete') {
          setDeletedIndex(step.deleteIndex);
          await new Promise(r => setTimeout(r, 500));
          setItems(newItems);
        } else if (step.type === 'failed') {
          await new Promise(r => setTimeout(r, 800));
        }
      }
    } else {
      // Immediate Operations
      if (activeOperation === 'insertHead') {
        setSpawnIndex(0);
        setSpawnType('spawn-head');
        setItems(newItems);
        await new Promise(r => setTimeout(r, 500));
      } else if (activeOperation === 'insertTail') {
        setSpawnIndex(newItems.length - 1);
        setSpawnType('spawn-tail');
        setItems(newItems);
        await new Promise(r => setTimeout(r, 500));
      } else if (removedNodes.length > 0) {
        setDeletedIndex(removedNodes[0]);
        await new Promise(r => setTimeout(r, 400));
        setItems(newItems);
      } else {
        setItems(newItems);
      }
    }

    if (resVal !== null && resVal !== undefined) {
      setResult({ value: resVal, type: typeof resVal });
    }

    if (highlightedNodes.length > 0) {
      setGlowIndex(highlightedNodes[0]);
    }

    setLogs(prev => [{ timestamp: time, expression: logEntry, isError: false }, ...prev].slice(0, 6));
    setAnimating(false);
  };

  useEffect(() => {
    resetTransitions();
    setResult(null);
  }, [activeOperation]);

  return (
    <div className="ll-vis-container">
      <div className="ll-vis-middle">
        <div className="ll-card">
          <div className="ll-header">
            <span>Linked List Representation</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="ll-badge" style={{ background: isDoubly ? 'rgba(236, 72, 153, 0.15)' : 'rgba(45, 212, 191, 0.15)', color: isDoubly ? '#ec4899' : '#2dd4bf', border: `1px solid ${isDoubly ? 'rgba(236, 72, 153, 0.3)' : 'rgba(45, 212, 191, 0.3)'}` }}>
                {isDoubly ? 'Doubly Linked List' : 'Singly Linked List'}
              </span>
              <span className="ll-badge">Nodes: {items.length}</span>
            </div>
          </div>
          <div className="ll-viewport">
            {items.length === 0 && (
              <div style={{ color: '#666', fontStyle: 'italic', width: '100%', textAlign: 'center', fontSize: '13px' }}>
                Empty List
              </div>
            )}
            {items.map((val, idx) => {
              const isGlow = glowIndex === idx;
              const isDeleted = deletedIndex === idx;
              const isSpawned = spawnIndex === idx;

              return (
                <React.Fragment key={idx}>
                  <NodeBox 
                    val={val}
                    index={idx}
                    totalNodes={items.length}
                    isGlow={isGlow}
                    isDeleted={isDeleted}
                    spawnType={isSpawned ? spawnType : null}
                    isDoubly={isDoubly}
                    pointerIndex={pointerIndex}
                    slowIndex={slowIndex}
                    fastIndex={fastIndex}
                  />
                  {idx < items.length - 1 && (
                    <ArrowConnector isDoubly={isDoubly} />
                  )}
                </React.Fragment>
              );
            })}
            
            {items.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', width: '24px' }}>
                  <svg className="ll-arrow-svg" viewBox="0 0 24 20" style={{ opacity: 0.4 }}>
                    <path d="M 0 10 L 20 10" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" />
                  </svg>
                </div>
                <div className="ll-null-box">NULL</div>
              </>
            )}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', marginTop: '4px' }}>
            {animating ? `⚡ Animating: ${playMessage}` : `ℹ️ Info: ${playMessage}`}
          </div>
        </div>

        <ResultDisplay result={result} errorMsg={errorMsg} />

        <OperationLog logs={logs} />
      </div>

      <div className="ll-vis-right">
        {/* Toggle Mode Singly vs Doubly */}
        <div className="ll-card" style={{ marginBottom: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div className="ll-header">Mode Selector</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              className="ll-btn" 
              onClick={() => setIsDoubly(false)} 
              disabled={animating}
              style={{
                background: !isDoubly ? 'rgba(45, 212, 191, 0.15)' : 'transparent',
                borderColor: !isDoubly ? 'rgba(45, 212, 191, 0.5)' : 'rgba(255, 255, 255, 0.07)',
                color: !isDoubly ? '#2dd4bf' : '#888'
              }}
            >
              Singly List
            </button>
            <button 
              className="ll-btn" 
              onClick={() => setIsDoubly(true)} 
              disabled={animating}
              style={{
                background: isDoubly ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
                borderColor: isDoubly ? 'rgba(236, 72, 153, 0.5)' : 'rgba(255, 255, 255, 0.07)',
                color: isDoubly ? '#ec4899' : '#888'
              }}
            >
              Doubly List
            </button>
          </div>
        </div>

        <OperationGroup label="Insert" ops={['insertHead', 'insertTail', 'insertAt']} activeOp={activeOperation} setActiveOp={setActiveOperation}>
          {['insertHead', 'insertTail', 'insertAt'].includes(activeOperation) && <OperationForm activeOp={activeOperation} onRun={handleRun} animating={animating} />}
        </OperationGroup>
        
        <OperationGroup label="Delete" ops={['deleteHead', 'deleteTail', 'deleteAt', 'deleteVal']} activeOp={activeOperation} setActiveOp={setActiveOperation}>
          {['deleteHead', 'deleteTail', 'deleteAt', 'deleteVal'].includes(activeOperation) && <OperationForm activeOp={activeOperation} onRun={handleRun} animating={animating} />}
        </OperationGroup>

        <OperationGroup label="Access" ops={['get', 'search', 'traverse']} activeOp={activeOperation} setActiveOp={setActiveOperation}>
          {['get', 'search', 'traverse'].includes(activeOperation) && <OperationForm activeOp={activeOperation} onRun={handleRun} animating={animating} />}
        </OperationGroup>

        <OperationGroup label="Check" ops={['len', 'isEmpty', 'contains']} activeOp={activeOperation} setActiveOp={setActiveOperation}>
          {['len', 'isEmpty', 'contains'].includes(activeOperation) && <OperationForm activeOp={activeOperation} onRun={handleRun} animating={animating} />}
        </OperationGroup>

        <OperationGroup label="Advanced" ops={['reverse', 'detectCycle', 'findMiddle']} activeOp={activeOperation} setActiveOp={setActiveOperation}>
          {['reverse', 'detectCycle', 'findMiddle'].includes(activeOperation) && <OperationForm activeOp={activeOperation} onRun={handleRun} animating={animating} />}
        </OperationGroup>
      </div>
    </div>
  );
}
