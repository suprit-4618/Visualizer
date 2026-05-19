import React, { useState, useEffect } from 'react';
import './QueueVisualizer.css';
import { executeQueueOp } from './queueOps';

const getInitialState = (type) => {
  if (type === 'simple') {
    return { type: 'simple', elements: ['A', 'B', 'C'], front: 0, rear: 2 };
  } else if (type === 'circular') {
    return { type: 'circular', elements: ['A', 'B', 'C', null, null, null, null, null], front: 0, rear: 2 };
  } else if (type === 'priority') {
    return {
      type: 'priority',
      elements: [
        { value: 'C', priority: 1 },
        { value: 'A', priority: 2 },
        { value: 'B', priority: 4 }
      ],
      front: 0,
      rear: 2
    };
  }
};

function QueueBlock({ value, index, priority, isFront, isRear, highlighted, isEnqueuing, isPeeking, type }) {
  const isHighPriority = type === 'priority' && index === 0;

  return (
    <div className={`queue-block ${isHighPriority ? 'priority-glow' : ''} ${highlighted ? 'highlighted' : ''} ${isEnqueuing ? 'animate-enqueue' : ''} ${isPeeking ? 'animate-peek' : ''}`}>
      <span style={{ fontSize: '15px' }}>{value}</span>
      {priority !== undefined && (
        <span className="priority-badge">P{priority}</span>
      )}
    </div>
  );
}

function QueueCanvas({ 
  queueState, 
  highlightedIndices, 
  enqueuedIndex, 
  peekedIndex, 
  poppingElement,
  canvasShake,
  canvasFlashRed,
  baseShake
}) {
  const { type, elements, front, rear } = queueState;

  // Simple and Priority View
  const renderHorizontalQueue = () => {
    const size = elements.length;
    return (
      <div className="queue-lane">
        <div className="queue-conveyor-belt"></div>

        {/* FRONT pointer on the left side of elements */}
        {size > 0 && (
          <div className="queue-pointer front-pointer">
            ← FRONT
          </div>
        )}

        {/* Temporary exiting element for dequeue pop */}
        {poppingElement && (
          <div className="queue-block animate-dequeue" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <span>{poppingElement.value}</span>
            {poppingElement.priority !== undefined && (
              <span className="priority-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                P{poppingElement.priority}
              </span>
            )}
          </div>
        )}

        {elements.length === 0 && !poppingElement && (
          <div style={{ color: '#666', fontStyle: 'italic', fontSize: '14px', zIndex: 5 }}>
            Queue is Empty
          </div>
        )}

        {elements.map((item, idx) => {
          const val = type === 'priority' ? item.value : item;
          const prio = type === 'priority' ? item.priority : undefined;
          return (
            <QueueBlock
              key={`block-${idx}-${val}`}
              value={val}
              index={idx}
              priority={prio}
              isFront={idx === 0}
              isRear={idx === elements.length - 1}
              highlighted={highlightedIndices.includes(idx)}
              isEnqueuing={enqueuedIndex === idx}
              isPeeking={peekedIndex === idx}
              type={type}
            />
          );
        })}

        {/* REAR pointer on the right side of elements */}
        {size > 0 && (
          <div className="queue-pointer rear-pointer">
            REAR →
          </div>
        )}
      </div>
    );
  };

  // Circular Queue Ring View
  const renderCircularRing = () => {
    // Math to position slots in a circle
    const slots = [];
    for (let i = 0; i < 8; i++) {
      const val = elements[i];
      const isFilled = val !== null && val !== undefined;

      const angle = (i * 45 * Math.PI) / 180 - Math.PI / 2;
      const x = Math.cos(angle) * 88;
      const y = Math.sin(angle) * 88;

      const highlighted = highlightedIndices.includes(i);
      const isEnqueuing = enqueuedIndex === i;
      const isPeeking = peekedIndex === i;

      slots.push(
        <div 
          key={`slot-${i}`}
          className={`circular-slot ${isFilled ? 'filled' : 'empty'} ${highlighted ? 'highlighted' : ''} ${isEnqueuing ? 'animate-enqueue' : ''} ${isPeeking ? 'animate-peek' : ''}`}
          style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
        >
          {isFilled ? <span>{val}</span> : <span style={{ opacity: 0.2 }}>•</span>}
          <div className="circular-slot-index">{i}</div>
        </div>
      );
    }

    // Generate F & R pointers dynamically at radius 136px
    const renderCircularPointers = () => {
      if (front === -1) return null;
      const pointers = [];
      const isBoth = front === rear;

      if (isBoth) {
        const angle = (front * 45 * Math.PI) / 180 - Math.PI / 2;
        const x = Math.cos(angle) * 136;
        const y = Math.sin(angle) * 136;
        pointers.push(
          <div 
            key="both"
            className="circular-pointer c-both"
            style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
          >
            F & R
          </div>
        );
      } else {
        // Front pointer
        const fAngle = (front * 45 * Math.PI) / 180 - Math.PI / 2;
        const fx = Math.cos(fAngle) * 136;
        const fy = Math.sin(fAngle) * 136;
        pointers.push(
          <div 
            key="front"
            className="circular-pointer c-front"
            style={{ transform: `translate(calc(-50% + ${fx}px), calc(-50% + ${fy}px))` }}
          >
            FRONT
          </div>
        );

        // Rear pointer
        const rAngle = (rear * 45 * Math.PI) / 180 - Math.PI / 2;
        const rx = Math.cos(rAngle) * 136;
        const ry = Math.sin(rAngle) * 136;
        pointers.push(
          <div 
            key="rear"
            className="circular-pointer c-rear"
            style={{ transform: `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px))` }}
          >
            REAR
          </div>
        );
      }
      return pointers;
    };

    return (
      <div className="circular-ring-container">
        <div className="circular-center-label">
          <span>CIRCULAR</span>QUEUE
        </div>
        {slots}
        {renderCircularPointers()}
      </div>
    );
  };

  return (
    <div className={`queue-canvas-wrapper ${canvasFlashRed ? 'flash-red-border' : ''} ${canvasShake ? 'canvas-shake' : ''} ${baseShake ? 'base-shake' : ''}`}>
      <div className="stv-header" style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, width: 'calc(100% - 32px)' }}>
        Queue Canvas
        <span style={{ fontSize: '11px', color: '#666' }}>
          Type: {type.toUpperCase()} | Size: {
            type === 'circular' ? (
              front === -1 ? 0 : (rear >= front ? rear - front + 1 : 8 - front + rear + 1)
            ) : elements.length
          } / Max: 8
        </span>
      </div>

      {type === 'circular' ? renderCircularRing() : renderHorizontalQueue()}
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

  const isError = result.value === 'Queue Overflow' || result.value === 'Queue Underflow' || result.isError;
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

function OperationForm({ activeOp, queueType, onRun }) {
  const [args, setArgs] = useState({});

  useEffect(() => { setArgs({}); }, [activeOp]);

  if (!activeOp) return null;

  const handleChange = (k, v) => setArgs(prev => ({ ...prev, [k]: v }));

  const inputs = [];
  if (['enqueue', 'contains'].includes(activeOp)) {
    inputs.push('value');
  }
  if (activeOp === 'enqueue' && queueType === 'priority') {
    inputs.push('priority');
  }

  return (
    <div className="stv-form">
      {inputs.map(p => (
        <input 
          key={p} 
          type="text" 
          className="stv-form-input" 
          placeholder={p === 'priority' ? 'priority (e.g. 1, 2)' : p} 
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

function OperationPanel({ activeOp, setActiveOp, queueType, onRun }) {
  // Simple & Circular Core operations: enqueue, dequeue, peek, isEmpty, size
  // Priority mode replaces enqueue in Core with Priority group
  const coreOps = queueType === 'priority'
    ? ['dequeue', 'peek', 'isEmpty', 'size']
    : ['enqueue', 'dequeue', 'peek', 'isEmpty', 'size'];

  return (
    <div className="queue-vis-right">
      <OperationGroup label="Core Operations" ops={coreOps} activeOp={activeOp} setActiveOp={setActiveOp}>
        {coreOps.includes(activeOp) && <OperationForm activeOp={activeOp} queueType={queueType} onRun={onRun} />}
      </OperationGroup>

      {queueType === 'priority' && (
        <OperationGroup label="Priority Operations" ops={['enqueue']} activeOp={activeOp} setActiveOp={setActiveOp}>
          {activeOp === 'enqueue' && <OperationForm activeOp={activeOp} queueType={queueType} onRun={onRun} />}
        </OperationGroup>
      )}
      
      <OperationGroup label="Info Operations" ops={['contains', 'clear']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {['contains', 'clear'].includes(activeOp) && <OperationForm activeOp={activeOp} queueType={queueType} onRun={onRun} />}
      </OperationGroup>

      <OperationGroup label="Advanced Operations" ops={queueType === 'circular' ? [] : ['reverse']} activeOp={activeOp} setActiveOp={setActiveOp}>
        {activeOp === 'reverse' && <OperationForm activeOp={activeOp} queueType={queueType} onRun={onRun} />}
        {queueType === 'circular' && (
          <div style={{ padding: '8px 12px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
            Advanced ops not supported on Circular Queue.
          </div>
        )}
      </OperationGroup>
    </div>
  );
}

export default function QueueVisualizer() {
  const [activeTab, setActiveTab] = useState('simple');
  const [queueState, setQueueState] = useState(() => getInitialState('simple'));
  const [activeOperation, setActiveOperation] = useState(null);
  const [highlightedIndices, setHighlightedIndices] = useState([]);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Animation states
  const [enqueuedIndex, setEnqueuedIndex] = useState(null);
  const [peekedIndex, setPeekedIndex] = useState(null);
  const [poppingElement, setPoppingElement] = useState(null);
  const [canvasShake, setCanvasShake] = useState(false);
  const [canvasFlashRed, setCanvasFlashRed] = useState(false);
  const [baseShake, setBaseShake] = useState(false);

  // Switch tabs resetting queue data
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setQueueState(getInitialState(tab));
    setHighlightedIndices([]);
    setResult(null);
    setActiveOperation(null);
  };

  const handleRun = (args) => {
    if (!activeOperation) return;

    setHighlightedIndices([]);
    setResult(null);

    const { 
      result: resVal, 
      resultType, 
      highlightedIndices: hIndices, 
      logEntry, 
      isError, 
      queueDirection, 
      nextQueueState 
    } = executeQueueOp(queueState, activeOperation, args);

    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const logItem = { timestamp: time, expression: logEntry, isError };

    // Set result and logs
    if (resVal !== undefined) {
      setResult({ value: resVal, type: resultType, isError });
    }
    setLogs(prev => [logItem, ...prev].slice(0, 6));

    if (isError) {
      if (resVal === "Queue Overflow") {
        setCanvasFlashRed(true);
        setCanvasShake(true);
        setTimeout(() => {
          setCanvasFlashRed(false);
          setCanvasShake(false);
        }, 500);
      } else if (resVal === "Queue Underflow" || resVal.startsWith("IndexError")) {
        setBaseShake(true);
        setTimeout(() => {
          setBaseShake(false);
        }, 500);
      }
      return;
    }

    // Success paths with animations
    if (queueDirection === 'enqueue') {
      let targetIdx = -1;
      if (queueState.type === 'circular') {
        targetIdx = nextQueueState.rear;
      } else if (queueState.type === 'priority') {
        // Find index where this value landed
        targetIdx = nextQueueState.elements.findIndex(item => item.value === args.value);
      } else {
        targetIdx = nextQueueState.elements.length - 1;
      }

      setQueueState(nextQueueState);
      setEnqueuedIndex(targetIdx);
      setTimeout(() => {
        setEnqueuedIndex(null);
      }, 500);
    } else if (queueDirection === 'dequeue') {
      let poppedVal = null;
      let poppedPrio = undefined;

      if (queueState.type === 'circular') {
        poppedVal = queueState.elements[queueState.front];
      } else if (queueState.type === 'priority') {
        poppedVal = queueState.elements[0].value;
        poppedPrio = queueState.elements[0].priority;
      } else {
        poppedVal = queueState.elements[0];
      }

      // Dequeue exit animation triggers
      if (queueState.type !== 'circular') {
        setPoppingElement({ value: poppedVal, priority: poppedPrio });
        setTimeout(() => {
          setPoppingElement(null);
        }, 350);
      }
      
      setQueueState(nextQueueState);
    } else {
      // Other operations (peek, isEmpty, contains, reverse, clear)
      setQueueState(nextQueueState);
      setHighlightedIndices(hIndices || []);

      if (activeOperation === 'peek') {
        const peakIdx = queueState.type === 'circular' ? queueState.front : 0;
        setPeekedIndex(peakIdx);
        setTimeout(() => {
          setPeekedIndex(null);
        }, 600);
      }
    }
  };

  useEffect(() => {
    setHighlightedIndices([]);
    setResult(null);
  }, [activeOperation]);

  return (
    <div className="queue-vis-container">
      <div className="queue-vis-middle">
        {/* Toggle tabs for queue styles */}
        <div className="queue-tabs">
          <button className={`queue-tab ${activeTab === 'simple' ? 'active' : ''}`} onClick={() => handleTabChange('simple')}>Simple Queue</button>
          <button className={`queue-tab ${activeTab === 'circular' ? 'active' : ''}`} onClick={() => handleTabChange('circular')}>Circular Queue</button>
          <button className={`queue-tab ${activeTab === 'priority' ? 'active' : ''}`} onClick={() => handleTabChange('priority')}>Priority Queue</button>
        </div>

        <QueueCanvas 
          queueState={queueState}
          highlightedIndices={highlightedIndices}
          enqueuedIndex={enqueuedIndex}
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
        queueType={activeTab}
        onRun={handleRun}
      />
    </div>
  );
}
