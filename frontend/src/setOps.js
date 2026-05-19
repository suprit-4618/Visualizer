// setOps.js

export function executeSetOp(items, opName, args) {
  let result = null;
  let resultType = '';
  let logEntry = '';
  let isError = false;
  let errorMessage = '';
  let affectedValue = null;
  let newItems = [...items];
  let otherSetItems = [];
  let isDuplicate = false;

  try {
    switch (opName) {
      // Modify
      case 'add': {
        const val = args.value;
        if (!val) throw new Error("Value is required");
        if (items.includes(val)) {
          isDuplicate = true;
          affectedValue = val;
          logEntry = `set.add("${val}") → (ignored, duplicate)`;
        } else {
          newItems.push(val);
          affectedValue = val;
          logEntry = `set.add("${val}")`;
        }
        break;
      }
      case 'remove': {
        const val = args.value;
        if (!val) throw new Error("Value is required");
        const idx = items.indexOf(val);
        if (idx === -1) {
          isError = true;
          errorMessage = `KeyError: '${val}'`;
          logEntry = `set.remove("${val}") → KeyError`;
        } else {
          affectedValue = val;
          newItems.splice(idx, 1);
          logEntry = `set.remove("${val}")`;
        }
        break;
      }
      case 'discard': {
        const val = args.value;
        if (!val) throw new Error("Value is required");
        const idx = items.indexOf(val);
        if (idx !== -1) {
          affectedValue = val;
          newItems.splice(idx, 1);
        }
        logEntry = `set.discard("${val}")`;
        break;
      }
      case 'pop': {
        if (items.length === 0) {
          isError = true;
          errorMessage = `KeyError: 'pop from an empty set'`;
          logEntry = `set.pop() → KeyError`;
        } else {
          // Pops arbitrary element (we can take the last one or first one)
          const popped = newItems.shift();
          affectedValue = popped;
          result = popped;
          resultType = typeof popped;
          logEntry = `set.pop() → "${popped}"`;
        }
        break;
      }
      case 'clear': {
        newItems = [];
        logEntry = `set.clear()`;
        break;
      }

      // Set Math
      case 'union': {
        const otherStr = args.value || '';
        otherSetItems = otherStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const unionSet = new Set([...items, ...otherSetItems]);
        result = `{${Array.from(unionSet).map(x => `'${x}'`).join(', ')}}`;
        resultType = 'set';
        logEntry = `set.union({${otherSetItems.map(x => `'${x}'`).join(', ')}}) → ${result}`;
        break;
      }
      case 'intersection': {
        const otherStr = args.value || '';
        otherSetItems = otherStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const intersect = items.filter(x => otherSetItems.includes(x));
        result = `{${intersect.map(x => `'${x}'`).join(', ')}}`;
        resultType = 'set';
        logEntry = `set.intersection({${otherSetItems.map(x => `'${x}'`).join(', ')}}) → ${result}`;
        break;
      }
      case 'difference': {
        const otherStr = args.value || '';
        otherSetItems = otherStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const diff = items.filter(x => !otherSetItems.includes(x));
        result = `{${diff.map(x => `'${x}'`).join(', ')}}`;
        resultType = 'set';
        logEntry = `set.difference({${otherSetItems.map(x => `'${x}'`).join(', ')}}) → ${result}`;
        break;
      }
      case 'symmetric_difference': {
        const otherStr = args.value || '';
        otherSetItems = otherStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const diff1 = items.filter(x => !otherSetItems.includes(x));
        const diff2 = otherSetItems.filter(x => !items.includes(x));
        const symm = [...diff1, ...diff2];
        result = `{${symm.map(x => `'${x}'`).join(', ')}}`;
        resultType = 'set';
        logEntry = `set.symmetric_difference({${otherSetItems.map(x => `'${x}'`).join(', ')}}) → ${result}`;
        break;
      }

      // Check
      case 'in_operator': {
        const val = args.value;
        if (!val) throw new Error("Value is required");
        const found = items.includes(val);
        result = found;
        resultType = 'bool';
        logEntry = `"${val}" in set → ${found ? 'True' : 'False'}`;
        break;
      }
      case 'issubset': {
        const otherStr = args.value || '';
        otherSetItems = otherStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const isSub = items.every(x => otherSetItems.includes(x));
        result = isSub;
        resultType = 'bool';
        logEntry = `set.issubset({${otherSetItems.map(x => `'${x}'`).join(', ')}}) → ${isSub ? 'True' : 'False'}`;
        break;
      }
      case 'issuperset': {
        const otherStr = args.value || '';
        otherSetItems = otherStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const isSuper = otherSetItems.every(x => items.includes(x));
        result = isSuper;
        resultType = 'bool';
        logEntry = `set.issuperset({${otherSetItems.map(x => `'${x}'`).join(', ')}}) → ${isSuper ? 'True' : 'False'}`;
        break;
      }
      case 'isdisjoint': {
        const otherStr = args.value || '';
        otherSetItems = otherStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const isDis = !items.some(x => otherSetItems.includes(x));
        result = isDis;
        resultType = 'bool';
        logEntry = `set.isdisjoint({${otherSetItems.map(x => `'${x}'`).join(', ')}}) → ${isDis ? 'True' : 'False'}`;
        break;
      }
      case 'len': {
        result = items.length;
        resultType = 'int';
        logEntry = `len(set) → ${result}`;
        break;
      }

      // Convert
      case 'to_list': {
        result = `[${items.map(x => `'${x}'`).join(', ')}]`;
        resultType = 'list';
        logEntry = `list(set) → ${result}`;
        break;
      }
      case 'to_sorted_list': {
        const sorted = [...items].sort((a, b) => {
          const numA = Number(a);
          const numB = Number(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return String(a).localeCompare(String(b));
        });
        result = `[${sorted.map(x => `'${x}'`).join(', ')}]`;
        resultType = 'list';
        logEntry = `sorted(set) → ${result}`;
        break;
      }

      default:
        throw new Error("Unknown operation");
    }
  } catch (e) {
    isError = true;
    errorMessage = e.message;
    logEntry = `${opName} Error: ${e.message}`;
  }

  return { result, resultType, logEntry, isError, errorMessage, affectedValue, newItems, otherSetItems, isDuplicate };
}
