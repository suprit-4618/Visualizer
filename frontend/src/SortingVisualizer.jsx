import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './SortingVisualizer.css';
import { generateSteps, makeArray, ALGO_INFO } from './sortOps';

// ── Constants ──────────────────────────────────────────────────────────────────
const PAD = { top: 24, bottom: 36, left: 16, right: 16 };
const ALGOS = ['bubble','selection','insertion','merge','quick','heap'];
const SETUPS = ['random','reversed','nearly','custom'];
const SETUP_LABELS = { random: 'Random', reversed: 'Reversed', nearly: 'Nearly Sorted', custom: 'Custom' };

// ── Bar chart SVG ─────────────────────────────────────────────────────────────
function BarCanvas({ step, n }) {
  const svgRef = useRef(null);
  const [svgW, setSvgW] = useState(800);
  const [svgH, setSvgH] = useState(340);

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const obs = new ResizeObserver(e => {
      const { width, height } = e[0].contentRect;
      setSvgW(width); setSvgH(height);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!step) return <div className="sort-canvas-wrapper" />;

  const { arr, type, indices, sorted } = step;
  const actualN  = arr.length;
  const maxVal   = Math.max(...arr, 1);
  const drawW    = svgW - PAD.left - PAD.right;
  const drawH    = svgH - PAD.top - PAD.bottom;
  const gap      = Math.max(1, Math.floor(drawW / actualN * 0.12));
  const barW     = (drawW - gap * (actualN - 1)) / actualN;
  const showVals = barW >= 18;
  const showIdx  = barW >= 14;
  const baselineY = PAD.top + drawH;

  const sortedSet = new Set(sorted);
  const indexSet  = new Set(indices);

  const barClass = i => {
    if (type === 'done') return 'sb-done';
    if (sortedSet.has(i)) return 'sb-sorted';
    if (indexSet.has(i)) {
      if (type === 'pivot')   return 'sb-pivot';
      if (type === 'swap')    return 'sb-swap';
      if (type === 'compare') return 'sb-compare';
      if (type === 'sorted')  return 'sb-sorted';
    }
    return 'sb-default';
  };

  return (
    <div className="sort-canvas-wrapper">
      <svg ref={svgRef} className="sort-svg" viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Baseline */}
        <line className="sort-baseline"
          x1={PAD.left} y1={baselineY} x2={svgW - PAD.right} y2={baselineY} />

        {arr.map((v, i) => {
          const bh  = Math.max(2, (v / maxVal) * drawH);
          const bx  = PAD.left + i * (barW + gap);
          const by  = baselineY - bh;
          const cx  = bx + barW / 2;
          const cls = barClass(i);
          return (
            <g key={i}>
              <rect className={`sort-bar ${cls}`}
                x={bx} y={by} width={barW} height={bh} rx={barW > 8 ? 3 : 1} />
              {showVals && (
                <text className="sort-bar-val" x={cx} y={by - 4}
                  textAnchor="middle">{v}</text>
              )}
              {showIdx && (
                <text className="sort-bar-idx" x={cx} y={baselineY + 14}
                  textAnchor="middle">{i}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Step controls ──────────────────────────────────────────────────────────────
function StepControls({ stepIdx, total, isPlaying, speed, onPrev, onNext, onPlay, onSpeedChange }) {
  return (
    <div className="sort-step-controls">
      <button className="sort-step-btn" onClick={onPrev} disabled={stepIdx <= 0}>◀</button>
      <button className="sort-play-btn" onClick={onPlay}>{isPlaying ? '⏸' : '▶'}</button>
      <button className="sort-step-btn" onClick={onNext} disabled={stepIdx >= total - 1}>▶</button>
      <span style={{ fontSize: 11, color: '#555' }}>Speed</span>
      <input type="range" className="sort-speed-slider"
        min={20} max={800} step={20} value={speed}
        onChange={e => onSpeedChange(Number(e.target.value))} />
      <span className="sort-step-counter">
        {total > 0 ? `${stepIdx + 1} / ${total}` : '—'}
      </span>
    </div>
  );
}

// ── Stats panel ────────────────────────────────────────────────────────────────
function StatsPanel({ algo, steps, stepIdx }) {
  const info = ALGO_INFO[algo];
  const compares = useMemo(() =>
    steps.slice(0, stepIdx + 1).filter(s => s.type === 'compare').length,
    [steps, stepIdx]
  );
  const swaps = useMemo(() =>
    steps.slice(0, stepIdx + 1).filter(s => s.type === 'swap').length,
    [steps, stepIdx]
  );
  return (
    <div className="sort-stats-card">
      <div className="sort-section-title">Stats — {info.label}</div>
      <div className="sort-stats-row">
        <span className="sort-stats-label">Comparisons</span>
        <span className="sort-stats-val amber">{compares}</span>
      </div>
      <div className="sort-stats-row">
        <span className="sort-stats-label">Swaps</span>
        <span className="sort-stats-val teal">{swaps}</span>
      </div>
      <hr className="sort-stats-divider" />
      <div className="sort-stats-row">
        <span className="sort-stats-label">Best</span>
        <span className="sort-stats-val">{info.best}</span>
      </div>
      <div className="sort-stats-row">
        <span className="sort-stats-label">Average</span>
        <span className="sort-stats-val">{info.avg}</span>
      </div>
      <div className="sort-stats-row">
        <span className="sort-stats-label">Worst</span>
        <span className="sort-stats-val">{info.worst}</span>
      </div>
      <div className="sort-stats-row">
        <span className="sort-stats-label">Space</span>
        <span className="sort-stats-val purple">{info.space}</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SortingVisualizer() {
  const [algo, setAlgo]     = useState('bubble');
  const [setup, setSetup]   = useState('random');
  const [size, setSize]     = useState(20);
  const [arr, setArr]       = useState(() => makeArray('random', 20));
  const [customInput, setCustomInput] = useState('');
  const [steps, setSteps]   = useState(() => generateSteps('bubble', makeArray('random', 20)));
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed]   = useState(200); // ms per step
  const playRef = useRef(null);

  // ── Recompute steps when algo or arr changes ──
  const recompute = useCallback((newAlgo, newArr) => {
    stopPlay();
    const s = generateSteps(newAlgo, newArr);
    setSteps(s);
    setStepIdx(0);
  }, []); // eslint-disable-line

  const stopPlay = useCallback(() => {
    clearInterval(playRef.current);
    setIsPlaying(false);
  }, []);

  useEffect(() => () => clearInterval(playRef.current), []);

  // ── Array setup ──
  const applySetup = useCallback((newSetup, newSize, custom) => {
    let newArr;
    if (newSetup === 'custom') {
      const parsed = custom.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0);
      newArr = parsed.length >= 2 ? parsed.slice(0, 50) : makeArray('random', newSize);
    } else {
      newArr = makeArray(newSetup, newSize);
    }
    setArr(newArr);
    stopPlay();
    const s = generateSteps(algo, newArr);
    setSteps(s); setStepIdx(0);
  }, [algo, stopPlay]);

  const handleAlgo = (a) => {
    setAlgo(a);
    stopPlay();
    const s = generateSteps(a, arr);
    setSteps(s); setStepIdx(0);
  };

  const handleSetup = (s) => {
    setSetup(s);
    if (s !== 'custom') applySetup(s, size, customInput);
  };

  const handleSize = (n) => {
    setSize(n);
    if (setup !== 'custom') applySetup(setup, n, customInput);
  };

  // ── Step player ──
  const startPlay = useCallback(() => {
    clearInterval(playRef.current);
    setIsPlaying(true);
    playRef.current = setInterval(() => {
      setStepIdx(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(playRef.current);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);
  }, [steps.length, speed]);

  const handlePlay = () => {
    if (isPlaying) { stopPlay(); return; }
    if (stepIdx >= steps.length - 1) { setStepIdx(0); }
    startPlay();
  };

  // Re-start play with new speed if currently playing
  useEffect(() => {
    if (isPlaying) { clearInterval(playRef.current); startPlay(); }
  }, [speed]); // eslint-disable-line

  const handlePrev = () => { stopPlay(); setStepIdx(i => Math.max(0, i - 1)); };
  const handleNext = () => { stopPlay(); setStepIdx(i => Math.min(steps.length - 1, i + 1)); };

  const currentStep = steps[stepIdx] ?? steps[0];

  return (
    <div className="sort-vis-container">
      {/* ── Left: canvas + controls ── */}
      <div className="sort-vis-middle">
        <BarCanvas step={currentStep} n={arr.length} />

        <StepControls
          stepIdx={stepIdx} total={steps.length}
          isPlaying={isPlaying} speed={speed}
          onPrev={handlePrev} onNext={handleNext}
          onPlay={handlePlay} onSpeedChange={setSpeed}
        />
      </div>

      {/* ── Right panel ── */}
      <div className="sort-vis-right">
        {/* Algorithm */}
        <div>
          <div className="sort-section-title">Algorithm</div>
          <div className="sort-algo-grid">
            {ALGOS.map(a => (
              <button key={a} className={`sort-algo-btn ${algo === a ? 'active' : ''}`}
                onClick={() => handleAlgo(a)}>
                {ALGO_INFO[a].label.replace(' Sort', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Array setup */}
        <div>
          <div className="sort-section-title">Array Setup</div>
          <div className="sort-setup-grid">
            {SETUPS.map(s => (
              <button key={s} className={`sort-setup-btn ${setup === s ? 'active' : ''}`}
                onClick={() => handleSetup(s)}>
                {SETUP_LABELS[s]}
              </button>
            ))}
          </div>
          {setup === 'custom' && (
            <>
              <input className="sort-custom-input" placeholder="e.g. 5, 3, 8, 1, 9, 2"
                value={customInput} onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applySetup('custom', size, customInput)} />
              <button className="sort-custom-apply"
                onClick={() => applySetup('custom', size, customInput)}>
                Apply Custom Array
              </button>
            </>
          )}
        </div>

        {/* Size */}
        {setup !== 'custom' && (
          <div>
            <div className="sort-section-title">Array Size</div>
            <div className="sort-slider-row">
              <input type="range" className="sort-slider"
                min={5} max={50} step={1} value={size}
                onChange={e => handleSize(Number(e.target.value))} />
              <span className="sort-slider-val">{size}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <StatsPanel algo={algo} steps={steps} stepIdx={stepIdx} />

        {/* Color legend */}
        <div>
          <div className="sort-section-title">Legend</div>
          {[
            ['#f59e0b', 'Comparing'],
            ['#fb923c', 'Swapping'],
            ['#2dd4bf', 'Sorted'],
            ['#a855f7', 'Pivot (Quick)'],
          ].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#888' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
