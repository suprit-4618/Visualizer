// linkedListOps.js

export function executeLinkedListOp(items, opName, args, isDoubly = false) {
  let result = null;
  let logEntry = '';
  let highlightedNodes = []; // Indices of highlighted nodes in the final list
  let removedNodes = [];     // Nodes to show fading out
  let newItems = [...items];
  let steps = [];            // Animation steps for traversal/search/middle/cycle
  let isError = false;
  let errorMessage = '';

  try {
    switch (opName) {
      // Insert
      case 'insertHead': {
        const val = args.value;
        if (!val) throw new Error("Value is required");
        newItems.unshift(val);
        logEntry = `ll.insert_head("${val}")`;
        // Traversal animation: none needed, drops in at start
        break;
      }
      case 'insertTail': {
        const val = args.value;
        if (!val) throw new Error("Value is required");
        newItems.push(val);
        logEntry = `ll.insert_tail("${val}")`;
        break;
      }
      case 'insertAt': {
        const val = args.value;
        const idx = parseInt(args.index, 10);
        if (!val || isNaN(idx)) throw new Error("Value and index are required");
        if (idx < 0 || idx > items.length) {
          throw new Error(`IndexError: Index ${idx} out of range [0, ${items.length}]`);
        }
        newItems.splice(idx, 0, val);
        logEntry = `ll.insert_at(${idx}, "${val}")`;
        
        // Traverse steps up to index idx
        for (let i = 0; i <= idx; i++) {
          steps.push({
            type: 'traverse',
            pointerIndex: Math.min(i, items.length - 1),
            message: `Traversing to position ${i}...`
          });
        }
        steps.push({
          type: 'insert',
          insertIndex: idx,
          message: `Inserting "${val}" at index ${idx}...`
        });
        break;
      }

      // Delete
      case 'deleteHead': {
        if (items.length === 0) throw new Error("IndexError: delete from empty list");
        const popped = newItems.shift();
        result = popped;
        removedNodes = [0];
        logEntry = `ll.delete_head() → "${popped}"`;
        break;
      }
      case 'deleteTail': {
        if (items.length === 0) throw new Error("IndexError: delete from empty list");
        const popped = newItems.pop();
        result = popped;
        removedNodes = [items.length - 1];
        logEntry = `ll.delete_tail() → "${popped}"`;
        break;
      }
      case 'deleteAt': {
        const idx = parseInt(args.index, 10);
        if (isNaN(idx)) throw new Error("Index is required");
        if (idx < 0 || idx >= items.length) {
          throw new Error(`IndexError: Index ${idx} out of range`);
        }
        
        // Traverse steps up to index idx
        for (let i = 0; i <= idx; i++) {
          steps.push({
            type: 'traverse',
            pointerIndex: i,
            message: `Traversing to position ${i}...`
          });
        }
        const popped = newItems[idx];
        steps.push({
          type: 'delete',
          deleteIndex: idx,
          message: `Deleting "${popped}" from index ${idx}...`
        });
        
        newItems.splice(idx, 1);
        result = popped;
        removedNodes = [idx];
        logEntry = `ll.delete_at(${idx}) → "${popped}"`;
        break;
      }
      case 'deleteVal': {
        const val = args.value;
        if (!val) throw new Error("Value is required");
        const idx = items.indexOf(val);
        if (idx === -1) {
          throw new Error(`ValueError: "${val}" not in list`);
        }
        
        // Traverse steps up to index idx
        for (let i = 0; i <= idx; i++) {
          steps.push({
            type: 'traverse',
            pointerIndex: i,
            message: `Traversing: checking element at ${i}...`
          });
        }
        steps.push({
          type: 'delete',
          deleteIndex: idx,
          message: `Match found! Deleting "${val}"...`
        });

        newItems.splice(idx, 1);
        removedNodes = [idx];
        logEntry = `ll.delete_value("${val}")`;
        break;
      }

      // Access
      case 'get': {
        const idx = parseInt(args.index, 10);
        if (isNaN(idx)) throw new Error("Index is required");
        if (idx < 0 || idx >= items.length) {
          throw new Error(`IndexError: Index ${idx} out of range`);
        }
        
        for (let i = 0; i <= idx; i++) {
          steps.push({
            type: 'traverse',
            pointerIndex: i,
            message: `Searching index ${i}...`
          });
        }
        steps.push({
          type: 'glow',
          glowIndex: idx,
          message: `Found element at index ${idx}: "${items[idx]}"`
        });

        result = items[idx];
        highlightedNodes = [idx];
        logEntry = `ll.get(${idx}) → "${items[idx]}"`;
        break;
      }
      case 'search': {
        const val = args.value;
        if (!val) throw new Error("Value is required");
        const idx = items.indexOf(val);
        
        if (idx === -1) {
          for (let i = 0; i < items.length; i++) {
            steps.push({
              type: 'traverse',
              pointerIndex: i,
              message: `Checking node ${i}: "${items[i]}" !== "${val}"`
            });
          }
          steps.push({
            type: 'failed',
            message: `ValueError: "${val}" not found in list`
          });
          throw new Error(`ValueError: "${val}" not in list`);
        }

        for (let i = 0; i <= idx; i++) {
          steps.push({
            type: 'traverse',
            pointerIndex: i,
            message: `Checking node ${i}: "${items[i]}"`
          });
        }
        steps.push({
          type: 'glow',
          glowIndex: idx,
          message: `Match found! Element "${val}" is at index ${idx}`
        });

        result = idx;
        highlightedNodes = [idx];
        logEntry = `ll.search("${val}") → index ${idx}`;
        break;
      }
      case 'traverse': {
        for (let i = 0; i < items.length; i++) {
          steps.push({
            type: 'traverse',
            pointerIndex: i,
            message: `Visiting index ${i}: "${items[i]}"`
          });
        }
        logEntry = `ll.traverse()`;
        break;
      }

      // Info
      case 'len': {
        result = items.length;
        logEntry = `len(ll) → ${items.length}`;
        break;
      }
      case 'isEmpty': {
        result = items.length === 0;
        logEntry = `ll.is_empty() → ${items.length === 0 ? 'True' : 'False'}`;
        break;
      }
      case 'contains': {
        const val = args.value;
        if (!val) throw new Error("Value is required");
        const has = items.includes(val);
        result = has;
        logEntry = `"${val}" in ll → ${has ? 'True' : 'False'}`;
        break;
      }

      // Advanced
      case 'reverse': {
        newItems.reverse();
        logEntry = `ll.reverse()`;
        break;
      }
      case 'detectCycle': {
        if (items.length < 2) {
          result = "False (List too short)";
          logEntry = `ll.detect_cycle() → False`;
          break;
        }
        // Floyd's Cycle detection traversal simulation
        // slow moves 1 step, fast moves 2 steps
        let slow = 0;
        let fast = 0;
        while (fast < items.length - 1) {
          slow += 1;
          fast += 2;
          steps.push({
            type: 'pointers',
            slowIndex: slow,
            fastIndex: Math.min(fast, items.length - 1),
            message: `Slow ptr index: ${slow}, Fast ptr index: ${Math.min(fast, items.length - 1)}`
          });
        }
        result = "False (No cycle detected)";
        logEntry = `ll.detect_cycle() → False`;
        break;
      }
      case 'findMiddle': {
        if (items.length === 0) throw new Error("List is empty");
        let slow = 0;
        let fast = 0;
        steps.push({
          type: 'pointers',
          slowIndex: slow,
          fastIndex: fast,
          message: `Slow pointer at ${slow}, Fast pointer at ${fast}`
        });
        
        while (fast < items.length - 1 && fast + 1 < items.length - 1) {
          slow += 1;
          fast += 2;
          steps.push({
            type: 'pointers',
            slowIndex: slow,
            fastIndex: fast,
            message: `Slow pointer at ${slow}, Fast pointer at ${fast}`
          });
        }
        
        steps.push({
          type: 'glow',
          glowIndex: slow,
          message: `Middle node found at index ${slow}: "${items[slow]}"`
        });
        
        result = items[slow];
        highlightedNodes = [slow];
        logEntry = `ll.find_middle() → "${items[slow]}"`;
        break;
      }

      default:
        throw new Error("Unknown operation");
    }
  } catch (e) {
    isError = true;
    errorMessage = e.message;
    logEntry = `ll.${opName}() Error: ${e.message}`;
  }

  return { result, highlightedNodes, removedNodes, logEntry, newItems, steps, isError, errorMessage };
}
