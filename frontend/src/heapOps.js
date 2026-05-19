// ── Heap helpers ──────────────────────────────────────────────────────────────
const cmp = (a, b, isMax) => isMax ? a > b : a < b;

function siftUp(arr, i, isMax, steps) {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (cmp(arr[i], arr[p], isMax)) {
      steps.push({ type: 'comparing', swapping: [i, p], arr: [...arr] });
      [arr[i], arr[p]] = [arr[p], arr[i]];
      steps.push({ type: 'swapped',   swapping: [i, p], arr: [...arr] });
      i = p;
    } else break;
  }
  steps.push({ type: 'settled', swapping: [], arr: [...arr] });
}

function siftDown(arr, i, n, isMax, steps) {
  while (true) {
    const l = 2 * i + 1, r = 2 * i + 2;
    let best = i;
    if (l < n && cmp(arr[l], arr[best], isMax)) best = l;
    if (r < n && cmp(arr[r], arr[best], isMax)) best = r;
    if (best !== i) {
      steps.push({ type: 'comparing', swapping: [i, best], arr: [...arr] });
      [arr[i], arr[best]] = [arr[best], arr[i]];
      steps.push({ type: 'swapped',   swapping: [i, best], arr: [...arr] });
      i = best;
    } else break;
  }
  steps.push({ type: 'settled', swapping: [], arr: [...arr] });
}

// ── Accumulated states builder ────────────────────────────────────────────────
function buildAccStates(rawSteps) {
  const acc = [];
  let curArr = rawSteps[0]?.arr ?? [];
  let swapping = [];
  let newNode = null;
  let dim = null; // dimmed index (extracted root placeholder)

  for (const s of rawSteps) {
    if (s.arr) curArr = s.arr;
    switch (s.type) {
      case 'newNode':   newNode = s.idx;  swapping = []; break;
      case 'comparing': swapping = s.swapping; newNode = null; break;
      case 'swapped':   swapping = s.swapping; break;
      case 'settled':   swapping = []; newNode = null; break;
      case 'movedToRoot': newNode = 0; swapping = []; dim = null; break;
      case 'extracted': dim = s.idx; swapping = []; break;
      case 'initNode':  newNode = s.idx; swapping = []; break;
      default: swapping = []; break;
    }
    acc.push({ arr: [...curArr], swapping: [...swapping], newNode, dim, step: s });
  }
  return acc;
}

// ── Heap layout (compute x,y for index i in heap of size n, in a 800-wide SVG) ──
export function heapNodePos(i, n, svgW = 800) {
  if (n === 0) return { x: svgW / 2, y: 40 };
  const level    = Math.floor(Math.log2(i + 1));
  const maxLevel = Math.max(0, Math.floor(Math.log2(n)));
  const nodesAtBottom = Math.pow(2, maxLevel);
  const leafSpacing   = Math.min(64, (svgW - 40) / nodesAtBottom);
  const nodesAtLevel  = Math.pow(2, level);
  const slotsPerNode  = nodesAtBottom / nodesAtLevel;
  const posInLevel    = i - (nodesAtLevel - 1);
  const x = 20 + (posInLevel * slotsPerNode + slotsPerNode / 2) * leafSpacing;
  const y = 40 + level * 72;
  return { x, y };
}

// ── Main export ───────────────────────────────────────────────────────────────
export function executeHeapOp(heap, isMax, opName, args = {}) {
  let result = null, resultType = '', logEntry = '', isError = false;
  let nextHeap = [...heap];
  let rawSteps = [];

  try {
    switch (opName) {
      case 'insert': {
        const val = Number(args.value);
        if (args.value === '' || isNaN(val)) throw new Error('Numeric value required');
        rawSteps.push({ type: 'newNode', idx: nextHeap.length, arr: [...nextHeap, val] });
        nextHeap.push(val);
        siftUp(nextHeap, nextHeap.length - 1, isMax, rawSteps);
        result = val; resultType = 'int';
        logEntry = `heap.insert(${val})`;
        break;
      }
      case 'extractRoot': {
        if (nextHeap.length === 0) throw new Error('Heap is empty');
        const rootVal = nextHeap[0];
        rawSteps.push({ type: 'extracted', idx: 0, arr: [...nextHeap] });
        const last = nextHeap.pop();
        if (nextHeap.length > 0) {
          nextHeap[0] = last;
          rawSteps.push({ type: 'movedToRoot', arr: [...nextHeap] });
          siftDown(nextHeap, 0, nextHeap.length, isMax, rawSteps);
        } else {
          rawSteps.push({ type: 'settled', swapping: [], arr: [] });
        }
        result = rootVal; resultType = 'int';
        logEntry = `heap.extractRoot() → ${rootVal}`;
        break;
      }
      case 'peek': {
        if (nextHeap.length === 0) throw new Error('Heap is empty');
        result = nextHeap[0]; resultType = 'int';
        rawSteps.push({ type: 'settled', swapping: [], arr: [...nextHeap], highlight: [0] });
        logEntry = `heap.peek() → ${result}`;
        break;
      }
      case 'size': {
        result = nextHeap.length; resultType = 'int';
        logEntry = `heap.size() → ${result}`;
        break;
      }
      case 'isEmpty': {
        result = nextHeap.length === 0; resultType = 'bool';
        logEntry = `heap.isEmpty() → ${result}`;
        break;
      }
      case 'contains': {
        const val = Number(args.value);
        if (isNaN(val)) throw new Error('Numeric value required');
        result = nextHeap.includes(val); resultType = 'bool';
        logEntry = `heap.contains(${val}) → ${result}`;
        break;
      }
      case 'clear': {
        nextHeap = []; result = null; resultType = 'None';
        rawSteps.push({ type: 'settled', swapping: [], arr: [] });
        logEntry = 'heap.clear()';
        break;
      }
      case 'buildHeap': {
        // Parse comma-separated values
        const parts = String(args.array || '').split(',').map(v => v.trim()).filter(Boolean);
        if (parts.length === 0) throw new Error('Provide comma-separated numbers');
        nextHeap = parts.map(Number);
        if (nextHeap.some(isNaN)) throw new Error('All values must be numbers');
        rawSteps.push({ type: 'newNode', idx: -1, arr: [...nextHeap] }); // init state

        // Floyd's algorithm: heapify from n/2-1 down to 0
        for (let i = Math.floor(nextHeap.length / 2) - 1; i >= 0; i--) {
          rawSteps.push({ type: 'initNode', idx: i, arr: [...nextHeap] });
          siftDown(nextHeap, i, nextHeap.length, isMax, rawSteps);
        }
        result = `[${nextHeap.join(', ')}]`; resultType = 'list';
        logEntry = `buildHeap([${parts.join(', ')}])`;
        break;
      }
      default: throw new Error('Unknown operation');
    }
  } catch (e) {
    isError = true; result = e.message; resultType = 'str';
    logEntry = `Error: ${e.message}`;
  }

  const accStates = rawSteps.length > 0 ? buildAccStates(rawSteps) : [];

  return { result, resultType, nextHeap, accStates, logEntry, isError };
}
