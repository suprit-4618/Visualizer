// ── Step builder ──────────────────────────────────────────────────────────────
const snap = (arr, type, indices, sorted) => ({
  type, indices: [...indices], arr: [...arr], sorted: [...sorted]
});

// ── Array generators ──────────────────────────────────────────────────────────
export function makeArray(setup, size) {
  const n = Math.max(2, Math.min(50, size));
  // Unique values in [4, 100], shuffled for random
  const vals = Array.from({ length: n }, (_, i) => Math.round(4 + (96 / (n - 1)) * i));
  switch (setup) {
    case 'random': {
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [vals[i], vals[j]] = [vals[j], vals[i]];
      }
      return vals;
    }
    case 'reversed': return [...vals].reverse();
    case 'nearly': {
      // sorted with ~10% random swaps
      const a = [...vals];
      const swaps = Math.max(1, Math.floor(n * 0.1));
      for (let s = 0; s < swaps; s++) {
        const i = Math.floor(Math.random() * n);
        const j = Math.floor(Math.random() * n);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    default: return vals; // sorted
  }
}

// ── Algorithms ────────────────────────────────────────────────────────────────
function bubbleSort(input) {
  const arr = [...input], steps = [], sorted = [];
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push(snap(arr, 'compare', [j, j + 1], sorted));
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        steps.push(snap(arr, 'swap', [j, j + 1], sorted));
      }
    }
    sorted.push(n - i - 1);
    steps.push(snap(arr, 'sorted', [n - i - 1], sorted));
  }
  sorted.push(0);
  steps.push(snap(arr, 'done', [], sorted));
  return steps;
}

function selectionSort(input) {
  const arr = [...input], steps = [], sorted = [];
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      steps.push(snap(arr, 'compare', [minIdx, j], sorted));
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      steps.push(snap(arr, 'swap', [i, minIdx], sorted));
    }
    sorted.push(i);
    steps.push(snap(arr, 'sorted', [i], sorted));
  }
  sorted.push(n - 1);
  steps.push(snap(arr, 'done', [], sorted));
  return steps;
}

function insertionSort(input) {
  const arr = [...input], steps = [];
  const n = arr.length;
  const sorted = [0];
  steps.push(snap(arr, 'sorted', [0], sorted));
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      steps.push(snap(arr, 'compare', [j, j - 1], sorted));
      if (arr[j] < arr[j - 1]) {
        [arr[j], arr[j - 1]] = [arr[j - 1], arr[j]];
        steps.push(snap(arr, 'swap', [j, j - 1], sorted));
        j--;
      } else break;
    }
    sorted.push(i);
    steps.push(snap(arr, 'sorted', [i], sorted));
  }
  steps.push(snap(arr, 'done', [], [...Array(n).keys()]));
  return steps;
}

function mergeSort(input) {
  const arr = [...input], steps = [], sortedSet = new Set();
  const n = arr.length;

  function merge(left, mid, right) {
    const L = arr.slice(left, mid + 1);
    const R = arr.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;
    while (i < L.length && j < R.length) {
      const li = left + i, rj = mid + 1 + j;
      steps.push(snap(arr, 'compare', [li, rj], [...sortedSet]));
      if (L[i] <= R[j]) { arr[k] = L[i++]; }
      else               { arr[k] = R[j++]; }
      steps.push(snap(arr, 'swap', [k], [...sortedSet]));
      k++;
    }
    while (i < L.length) { arr[k++] = L[i++]; }
    while (j < R.length) { arr[k++] = R[j++]; }
    for (let x = left; x <= right; x++) sortedSet.add(x);
    steps.push(snap(arr, 'sorted', [left, right], [...sortedSet]));
  }

  function sort(left, right) {
    if (left >= right) { sortedSet.add(left); return; }
    const mid = Math.floor((left + right) / 2);
    sort(left, mid);
    sort(mid + 1, right);
    merge(left, mid, right);
  }

  sort(0, n - 1);
  steps.push(snap(arr, 'done', [], [...Array(n).keys()]));
  return steps;
}

function quickSort(input) {
  const arr = [...input], steps = [], sortedSet = new Set();
  const n = arr.length;

  function partition(low, high) {
    const pivot = arr[high];
    steps.push(snap(arr, 'pivot', [high], [...sortedSet]));
    let i = low - 1;
    for (let j = low; j < high; j++) {
      steps.push(snap(arr, 'compare', [j, high], [...sortedSet]));
      if (arr[j] <= pivot) {
        i++;
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          steps.push(snap(arr, 'swap', [i, j], [...sortedSet]));
        }
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    const pivotPos = i + 1;
    sortedSet.add(pivotPos);
    steps.push(snap(arr, 'sorted', [pivotPos], [...sortedSet]));
    return pivotPos;
  }

  function sort(low, high) {
    if (low >= high) { if (low === high) sortedSet.add(low); return; }
    const pi = partition(low, high);
    sort(low, pi - 1);
    sort(pi + 1, high);
  }

  sort(0, n - 1);
  steps.push(snap(arr, 'done', [], [...Array(n).keys()]));
  return steps;
}

function heapSort(input) {
  const arr = [...input], steps = [], sortedSet = new Set();
  const n = arr.length;

  function siftDown(i, heapSize) {
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let best = i;
      if (l < heapSize && arr[l] > arr[best]) best = l;
      if (r < heapSize && arr[r] > arr[best]) best = r;
      if (best !== i) {
        steps.push(snap(arr, 'compare', [i, best], [...sortedSet]));
        [arr[i], arr[best]] = [arr[best], arr[i]];
        steps.push(snap(arr, 'swap', [i, best], [...sortedSet]));
        i = best;
      } else break;
    }
  }

  // Build max-heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(i, n);
  steps.push(snap(arr, 'compare', [], [...sortedSet])); // phase marker

  // Extract
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    steps.push(snap(arr, 'swap', [0, i], [...sortedSet]));
    sortedSet.add(i);
    steps.push(snap(arr, 'sorted', [i], [...sortedSet]));
    siftDown(0, i);
  }
  sortedSet.add(0);
  steps.push(snap(arr, 'done', [], [...Array(n).keys()]));
  return steps;
}

// ── Complexity info ───────────────────────────────────────────────────────────
export const ALGO_INFO = {
  bubble:    { label: 'Bubble Sort',    best: 'O(n)',        avg: 'O(n²)',      worst: 'O(n²)',      space: 'O(1)' },
  selection: { label: 'Selection Sort', best: 'O(n²)',       avg: 'O(n²)',      worst: 'O(n²)',      space: 'O(1)' },
  insertion: { label: 'Insertion Sort', best: 'O(n)',        avg: 'O(n²)',      worst: 'O(n²)',      space: 'O(1)' },
  merge:     { label: 'Merge Sort',     best: 'O(n log n)',  avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  quick:     { label: 'Quick Sort',     best: 'O(n log n)',  avg: 'O(n log n)', worst: 'O(n²)',      space: 'O(log n)' },
  heap:      { label: 'Heap Sort',      best: 'O(n log n)',  avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
};

// ── Main export ───────────────────────────────────────────────────────────────
export function generateSteps(algo, arr) {
  switch (algo) {
    case 'bubble':    return bubbleSort(arr);
    case 'selection': return selectionSort(arr);
    case 'insertion': return insertionSort(arr);
    case 'merge':     return mergeSort(arr);
    case 'quick':     return quickSort(arr);
    case 'heap':      return heapSort(arr);
    default:          return bubbleSort(arr);
  }
}
