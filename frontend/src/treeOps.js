// ── ID counter ────────────────────────────────────────────────────────────────
let _uid = 0;
const uid = () => `n${++_uid}`;

// ── Node helpers ──────────────────────────────────────────────────────────────
const h = n => (n ? n.height : 0);
function updH(n) { if (n) n.height = 1 + Math.max(h(n.left), h(n.right)); }
const bf = n => (n ? h(n.left) - h(n.right) : 0);
const numVal = v => (isNaN(Number(v)) ? v : Number(v));

// ── AVL rotations ─────────────────────────────────────────────────────────────
function rotR(y) {
  const x = { ...y.left };
  y = { ...y, left: x.right };
  updH(y);
  x.right = y;
  updH(x);
  return x;
}
function rotL(x) {
  const y = { ...x.right };
  x = { ...x, right: y.left };
  updH(x);
  y.left = x;
  updH(y);
  return y;
}
function rebal(n) {
  updH(n);
  const b = bf(n);
  if (b > 1)  { if (bf(n.left)  < 0) n = { ...n, left:  rotL(n.left)  }; return rotR(n); }
  if (b < -1) { if (bf(n.right) > 0) n = { ...n, right: rotR(n.right) }; return rotL(n); }
  return n;
}

// ── BST insert ────────────────────────────────────────────────────────────────
function _bstIns(node, val, path, avl) {
  if (!node) {
    const n = { id: uid(), value: val, left: null, right: null, height: 1 };
    return { node: n, insertedId: n.id };
  }
  if (val < node.value) {
    path.push({ nodeId: node.id, direction: 'left', comparison: '<' });
    const { node: left, insertedId } = _bstIns(node.left, val, path, avl);
    let r = { ...node, left };
    updH(r); if (avl) r = rebal(r);
    return { node: r, insertedId };
  } else if (val > node.value) {
    path.push({ nodeId: node.id, direction: 'right', comparison: '>' });
    const { node: right, insertedId } = _bstIns(node.right, val, path, avl);
    let r = { ...node, right };
    updH(r); if (avl) r = rebal(r);
    return { node: r, insertedId };
  } else {
    throw new Error(`Value ${val} already exists`);
  }
}

// ── BST search ────────────────────────────────────────────────────────────────
function _bstSearch(node, val, path) {
  if (!node) return { found: false, path };
  if (val === node.value) {
    path.push({ nodeId: node.id, found: true });
    return { found: true, foundId: node.id, path };
  }
  if (val < node.value) {
    path.push({ nodeId: node.id, direction: 'left', comparison: '<', found: false });
    return _bstSearch(node.left, val, path);
  } else {
    path.push({ nodeId: node.id, direction: 'right', comparison: '>', found: false });
    return _bstSearch(node.right, val, path);
  }
}

// ── BST delete ────────────────────────────────────────────────────────────────
function _findMin(n) { while (n.left) n = n.left; return n; }
function _findMax(n) { while (n.right) n = n.right; return n; }

function _bstDel(node, val, avl) {
  if (!node) return { node: null, deletedId: null, deleteCase: null, successorId: null };
  if (val < node.value) {
    const { node: left, ...rest } = _bstDel(node.left, val, avl);
    let r = { ...node, left }; updH(r); if (avl) r = rebal(r);
    return { node: r, ...rest };
  } else if (val > node.value) {
    const { node: right, ...rest } = _bstDel(node.right, val, avl);
    let r = { ...node, right }; updH(r); if (avl) r = rebal(r);
    return { node: r, ...rest };
  } else {
    const deletedId = node.id;
    if (!node.left && !node.right)
      return { node: null, deletedId, deleteCase: 'leaf', successorId: null };
    if (!node.left)
      return { node: node.right, deletedId, deleteCase: 'oneChild', successorId: node.right.id };
    if (!node.right)
      return { node: node.left, deletedId, deleteCase: 'oneChild', successorId: node.left.id };
    const succ = _findMin(node.right);
    const { node: newRight } = _bstDel(node.right, succ.value, avl);
    let r = { ...node, value: succ.value, right: newRight };
    updH(r); if (avl) r = rebal(r);
    return { node: r, deletedId, deleteCase: 'twoChildren', successorId: succ.id };
  }
}

// ── General tree helpers ──────────────────────────────────────────────────────
function _replaceNode(root, targetId, replacement) {
  if (!root) return null;
  if (root.id === targetId) return replacement;
  return { ...root, children: root.children.map(c => _replaceNode(c, targetId, replacement)) };
}

function _genIns(root, val, parentVal) {
  if (!root) {
    const n = { id: uid(), value: val, children: [] };
    return { node: n, insertedId: n.id };
  }
  const queue = [root];
  while (queue.length) {
    const n = queue.shift();
    if (String(n.value) === String(parentVal)) {
      const child = { id: uid(), value: val, children: [] };
      const updated = { ...n, children: [...n.children, child] };
      return { node: _replaceNode(root, n.id, updated), insertedId: child.id };
    }
    n.children.forEach(c => queue.push(c));
  }
  throw new Error(`Parent "${parentVal}" not found`);
}

function _genDel(root, val) {
  if (!root) return { node: null, deletedId: null };
  if (String(root.value) === String(val)) return { node: null, deletedId: root.id };
  function delChild(node) {
    for (let i = 0; i < node.children.length; i++) {
      if (String(node.children[i].value) === String(val)) {
        const deletedId = node.children[i].id;
        return { node: { ...node, children: [...node.children.slice(0, i), ...node.children.slice(i + 1)] }, deletedId };
      }
      const r = delChild(node.children[i]);
      if (r.deletedId) {
        const newChildren = [...node.children.slice(0, i), r.node, ...node.children.slice(i + 1)];
        return { node: { ...node, children: newChildren }, deletedId: r.deletedId };
      }
    }
    return { node, deletedId: null };
  }
  return delChild(root);
}

function _genSearch(root, val) {
  if (!root) return { found: false, path: [] };
  const queue = [{ node: root, path: [] }];
  while (queue.length) {
    const { node, path } = queue.shift();
    const cur = [...path, { nodeId: node.id }];
    if (String(node.value) === String(val)) return { found: true, foundId: node.id, path: cur };
    node.children.forEach(c => queue.push({ node: c, path: cur }));
  }
  return { found: false, path: [] };
}

// ── Traversals ────────────────────────────────────────────────────────────────
function inorder(n, out = [])   { if (!n) return out; inorder(n.left, out); out.push({ id: n.id, value: n.value }); inorder(n.right, out); return out; }
function preorder(n, out = [])  { if (!n) return out; out.push({ id: n.id, value: n.value }); preorder(n.left, out); preorder(n.right, out); return out; }
function postorder(n, out = []) { if (!n) return out; postorder(n.left, out); postorder(n.right, out); out.push({ id: n.id, value: n.value }); return out; }
function levelorder(root) {
  if (!root) return [];
  const out = [], q = [root];
  while (q.length) { const n = q.shift(); out.push({ id: n.id, value: n.value }); if (n.left) q.push(n.left); if (n.right) q.push(n.right); }
  return out;
}
function genPreorder(n, out = [])  { if (!n) return out; out.push({ id: n.id, value: n.value }); n.children.forEach(c => genPreorder(c, out)); return out; }
function genPostorder(n, out = []) { if (!n) return out; n.children.forEach(c => genPostorder(c, out)); out.push({ id: n.id, value: n.value }); return out; }
function genLevel(root) {
  if (!root) return [];
  const out = [], q = [root];
  while (q.length) { const n = q.shift(); out.push({ id: n.id, value: n.value }); n.children.forEach(c => q.push(c)); }
  return out;
}

// ── Tree info ─────────────────────────────────────────────────────────────────
function treeH(n)     { if (!n) return 0; return n.children ? 1 + Math.max(0, ...n.children.map(treeH)) : 1 + Math.max(treeH(n.left), treeH(n.right)); }
function treeSize(n)  { if (!n) return 0; return n.children ? 1 + n.children.reduce((s, c) => s + treeSize(c), 0) : 1 + treeSize(n.left) + treeSize(n.right); }
function isBal(n) {
  function chk(n) { if (!n) return 0; const l = chk(n.left), r = chk(n.right); if (l === -1 || r === -1 || Math.abs(l - r) > 1) return -1; return 1 + Math.max(l, r); }
  return chk(n) !== -1;
}

// ── Layout (exported for React) ───────────────────────────────────────────────
export function computeLayout(root, treeMode) {
  if (!root) return {};
  const layout = {};
  const HGAP = 64, VGAP = 80;

  if (treeMode === 'general') {
    let slot = 0;
    function genLayout(node, depth) {
      if (!node) return;
      if (!node.children || node.children.length === 0) {
        layout[node.id] = { x: slot * HGAP, y: depth * VGAP };
        slot++;
        return;
      }
      const start = slot;
      node.children.forEach(c => genLayout(c, depth + 1));
      const end = slot - 1;
      layout[node.id] = { x: ((start + end) / 2) * HGAP, y: depth * VGAP };
    }
    genLayout(root, 0);
  } else {
    let counter = 0;
    function bstLayout(node, depth) {
      if (!node) return;
      bstLayout(node.left, depth + 1);
      layout[node.id] = { x: counter * HGAP, y: depth * VGAP };
      counter++;
      bstLayout(node.right, depth + 1);
    }
    bstLayout(root, 0);
  }
  return layout;
}

export function collectEdges(root, treeMode) {
  const edges = [];
  function walk(n) {
    if (!n) return;
    if (treeMode === 'general') {
      n.children.forEach(c => { edges.push({ from: n.id, to: c.id }); walk(c); });
    } else {
      if (n.left)  { edges.push({ from: n.id, to: n.left.id,  dir: 'left'  }); walk(n.left);  }
      if (n.right) { edges.push({ from: n.id, to: n.right.id, dir: 'right' }); walk(n.right); }
    }
  }
  walk(root);
  return edges;
}

export function flattenNodes(root, treeMode) {
  const nodes = [];
  function walk(n) {
    if (!n) return;
    nodes.push(n);
    if (treeMode === 'general') n.children.forEach(c => walk(c));
    else { walk(n.left); walk(n.right); }
  }
  walk(root);
  return nodes;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function executeTreeOp(root, treeMode, opName, args = {}) {
  let result = null, resultType = '', traversalOrder = [], insertPath = [],
      searchPath = [], deletedId = null, deleteCase = null, successorId = null,
      highlightedNodes = [], logEntry = '', isError = false, nextTree = root;

  try {
    const avl = treeMode === 'avl';

    switch (opName) {
      case 'insert': {
        const val = numVal(args.value);
        if (args.value === '' || args.value === undefined) throw new Error('Value required');
        if (treeMode === 'general') {
          if (!root) {
            const n = { id: uid(), value: val, children: [] };
            nextTree = n; insertPath = []; highlightedNodes = [n.id];
          } else {
            const parent = args.parent;
            if (!parent) throw new Error('Parent value required for General Tree');
            const { node, insertedId } = _genIns(root, val, parent);
            nextTree = node; insertPath = []; highlightedNodes = [insertedId];
          }
          result = val; resultType = typeof val;
          logEntry = `tree.insert(${val}${args.parent ? `, parent="${args.parent}"` : ''})`;
        } else {
          const path = [];
          const { node, insertedId } = _bstIns(root, val, path, avl);
          nextTree = node; insertPath = path; highlightedNodes = [insertedId];
          result = val; resultType = typeof val;
          logEntry = `${avl ? 'avl' : 'bst'}.insert(${val})`;
        }
        break;
      }
      case 'delete': {
        const val = numVal(args.value);
        if (args.value === '' || args.value === undefined) throw new Error('Value required');
        if (treeMode === 'general') {
          const { node, deletedId: dId } = _genDel(root, val);
          if (!dId) throw new Error(`${val} not found`);
          nextTree = node; deletedId = dId; deleteCase = 'general';
        } else {
          const { node, deletedId: dId, deleteCase: dc, successorId: sId } = _bstDel(root, val, avl);
          if (!dId) throw new Error(`${val} not found`);
          nextTree = node; deletedId = dId; deleteCase = dc; successorId = sId;
        }
        result = args.value; resultType = 'str';
        logEntry = `tree.delete(${val})${deleteCase ? ` [${deleteCase}]` : ''}`;
        break;
      }
      case 'search': {
        const val = numVal(args.value);
        if (args.value === '' || args.value === undefined) throw new Error('Value required');
        if (treeMode === 'general') {
          const { found, foundId, path } = _genSearch(root, val);
          result = found; resultType = 'bool'; searchPath = path;
          highlightedNodes = found ? [foundId] : [];
          logEntry = `tree.search(${val}) → ${found ? 'Found' : 'Not Found'}`;
        } else {
          const path = [];
          const { found, foundId } = _bstSearch(root, val, path);
          result = found; resultType = 'bool'; searchPath = path;
          highlightedNodes = found ? [foundId] : [];
          logEntry = `bst.search(${val}) → ${found ? 'Found' : 'Not Found'}`;
        }
        break;
      }
      case 'contains': {
        const val = numVal(args.value);
        if (args.value === '' || args.value === undefined) throw new Error('Value required');
        const path = [];
        const r = treeMode === 'general' ? _genSearch(root, val) : _bstSearch(root, val, path);
        result = r.found; resultType = 'bool';
        highlightedNodes = r.found ? [r.foundId] : [];
        logEntry = `${val} in tree → ${r.found}`;
        break;
      }
      case 'findMin': {
        if (!root) throw new Error('Tree is empty');
        if (treeMode === 'general') {
          const all = genLevel(root);
          const min = all.reduce((a, b) => (b.value < a.value ? b : a));
          result = min.value; resultType = typeof min.value; highlightedNodes = [min.id];
        } else {
          const mn = _findMin(root);
          result = mn.value; resultType = typeof mn.value; highlightedNodes = [mn.id];
        }
        logEntry = `tree.findMin() → ${result}`;
        break;
      }
      case 'findMax': {
        if (!root) throw new Error('Tree is empty');
        if (treeMode === 'general') {
          const all = genLevel(root);
          const max = all.reduce((a, b) => (b.value > a.value ? b : a));
          result = max.value; resultType = typeof max.value; highlightedNodes = [max.id];
        } else {
          const mx = _findMax(root);
          result = mx.value; resultType = typeof mx.value; highlightedNodes = [mx.id];
        }
        logEntry = `tree.findMax() → ${result}`;
        break;
      }
      case 'inorder': {
        if (treeMode === 'general') throw new Error('Inorder N/A for General Tree');
        traversalOrder = inorder(root);
        result = traversalOrder.map(n => n.value);
        resultType = 'list';
        logEntry = `inorder() → [${result.join(', ')}]`;
        break;
      }
      case 'preorder': {
        traversalOrder = treeMode === 'general' ? genPreorder(root) : preorder(root);
        result = traversalOrder.map(n => n.value);
        resultType = 'list';
        logEntry = `preorder() → [${result.join(', ')}]`;
        break;
      }
      case 'postorder': {
        traversalOrder = treeMode === 'general' ? genPostorder(root) : postorder(root);
        result = traversalOrder.map(n => n.value);
        resultType = 'list';
        logEntry = `postorder() → [${result.join(', ')}]`;
        break;
      }
      case 'levelorder': {
        traversalOrder = treeMode === 'general' ? genLevel(root) : levelorder(root);
        result = traversalOrder.map(n => n.value);
        resultType = 'list';
        logEntry = `levelorder() → [${result.join(', ')}]`;
        break;
      }
      case 'height': {
        result = treeH(root); resultType = 'int';
        logEntry = `tree.height() → ${result}`;
        break;
      }
      case 'size': {
        result = treeSize(root); resultType = 'int';
        logEntry = `tree.size() → ${result}`;
        break;
      }
      case 'isBalanced': {
        if (treeMode === 'general') throw new Error('isBalanced N/A for General Tree');
        result = isBal(root); resultType = 'bool';
        logEntry = `tree.isBalanced() → ${result}`;
        break;
      }
      case 'isEmpty': {
        result = !root; resultType = 'bool';
        logEntry = `tree.isEmpty() → ${result}`;
        break;
      }
      case 'clear': {
        nextTree = null; result = null; resultType = 'None';
        logEntry = 'tree.clear()';
        break;
      }
      default:
        throw new Error('Unknown operation');
    }
  } catch (e) {
    isError = true; result = e.message; resultType = 'str';
    logEntry = `Error: ${e.message}`;
  }

  return { result, resultType, traversalOrder, insertPath, searchPath,
           deletedId, deleteCase, successorId, highlightedNodes,
           logEntry, isError, nextTree };
}
