// tupleOps.js

const copyArr = (arr) => [...arr];

export function executeTupleOp(arr, opName, args) {
  let result = null;
  let resultType = '';
  let highlightedIndices = [];
  let negativeIndices = [];
  let logEntry = '';
  let isError = false;
  let errorMessage = '';
  let unpackVars = null; // Map of indices to variables for unpacking
  let steps = [];

  const getIndexAndNeg = (indexStr, len) => {
    const i = parseInt(indexStr);
    if (isNaN(i)) throw new Error("Index must be an integer");
    const isNeg = i < 0;
    const idx = isNeg ? len + i : i;
    if (idx < 0 || idx >= len) throw new Error("Index out of range");
    const negIndices = Array.from({ length: len }, (_, k) => k - len);
    return { idx, isNeg, negIndices };
  };

  try {
    switch (opName) {
      // Immutability violations (Triggers shake & red tooltip)
      case 'attempt_set': {
        isError = true;
        errorMessage = "TypeError: 'tuple' object does not support item assignment";
        logEntry = `tuple[${args.index || 0}] = "${args.value || 'val'}" → Error`;
        highlightedIndices = args.index ? [parseInt(args.index)] : [0];
        break;
      }
      case 'attempt_append': {
        isError = true;
        errorMessage = "AttributeError: 'tuple' object has no attribute 'append'";
        logEntry = `tuple.append("${args.value || 'val'}") → Error`;
        break;
      }
      case 'attempt_remove': {
        isError = true;
        errorMessage = "AttributeError: 'tuple' object has no attribute 'remove'";
        logEntry = `tuple.remove("${args.value || 'val'}") → Error`;
        break;
      }

      // Access
      case 'get': {
        const resNeg = getIndexAndNeg(args.index, arr.length);
        const idx = resNeg.idx;
        result = arr[idx];
        resultType = typeof result;
        highlightedIndices = [idx];
        if (resNeg.isNeg) {
          negativeIndices = resNeg.negIndices;
        }
        logEntry = `tuple[${args.index}] → "${result}"`;
        break;
      }
      case 'slice': {
        const start = args.start === '' ? 0 : parseInt(args.start);
        const end = args.end === '' ? arr.length : parseInt(args.end);
        const actualStart = start < 0 ? Math.max(0, arr.length + start) : Math.min(arr.length, start);
        const actualEnd = end < 0 ? Math.max(0, arr.length + end) : Math.min(arr.length, end);
        
        result = arr.slice(actualStart, actualEnd);
        resultType = 'tuple';
        for(let j=actualStart; j<actualEnd; j++) highlightedIndices.push(j);
        logEntry = `tuple[${args.start || ''}:${args.end || ''}] → (${result.join(', ')})`;
        break;
      }

      // Search
      case 'index': {
        const val = args.value;
        const idx = arr.indexOf(val);
        if (idx === -1) throw new Error(`ValueError: tuple.index(x): x not in tuple`);
        result = idx;
        resultType = 'int';
        highlightedIndices = [idx];
        logEntry = `tuple.index("${val}") → ${idx}`;
        break;
      }
      case 'count': {
        const val = args.value;
        let total = 0;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] === val) {
            highlightedIndices.push(i);
            total++;
          }
        }
        result = total;
        resultType = 'int';
        logEntry = `tuple.count("${val}") → ${total}`;
        break;
      }
      case 'in_operator': {
        const val = args.value;
        result = arr.includes(val);
        resultType = 'bool';
        logEntry = `"${val}" in tuple → ${result ? 'True' : 'False'}`;
        break;
      }

      // Info
      case 'len': {
        result = arr.length;
        resultType = 'int';
        logEntry = `len(tuple) → ${result}`;
        break;
      }
      case 'min': {
        if (arr.length === 0) throw new Error("ValueError: min() arg is an empty sequence");
        const nums = arr.map(Number);
        const hasNan = nums.some(isNaN);
        if (hasNan) {
          result = arr.reduce((a, b) => a < b ? a : b);
        } else {
          result = Math.min(...nums);
        }
        resultType = typeof result === 'number' ? 'int' : 'string';
        const minIdx = arr.indexOf(String(result));
        if (minIdx !== -1) highlightedIndices = [minIdx];
        logEntry = `min(tuple) → "${result}"`;
        break;
      }
      case 'max': {
        if (arr.length === 0) throw new Error("ValueError: max() arg is an empty sequence");
        const nums = arr.map(Number);
        const hasNan = nums.some(isNaN);
        if (hasNan) {
          result = arr.reduce((a, b) => a > b ? a : b);
        } else {
          result = Math.max(...nums);
        }
        resultType = typeof result === 'number' ? 'int' : 'string';
        const maxIdx = arr.indexOf(String(result));
        if (maxIdx !== -1) highlightedIndices = [maxIdx];
        logEntry = `max(tuple) → "${result}"`;
        break;
      }
      case 'sum': {
        const nums = arr.map(Number);
        const hasNan = nums.some(isNaN);
        if (hasNan) throw new Error("TypeError: unsupported operand type(s) for +: 'int' and 'str'");
        result = nums.reduce((a, b) => a + b, 0);
        resultType = 'int';
        logEntry = `sum(tuple) → ${result}`;
        break;
      }
      case 'type_check': {
        result = "<class 'tuple'>";
        resultType = 'type';
        logEntry = `type(tuple) → <class 'tuple'>`;
        break;
      }

      // Convert
      case 'to_list': {
        result = copyArr(arr);
        resultType = 'list';
        logEntry = `list(tuple) → [${arr.join(', ')}]`;
        break;
      }
      case 'to_set': {
        const unique = Array.from(new Set(arr));
        result = unique;
        resultType = 'set';
        logEntry = `set(tuple) → {${unique.join(', ')}}`;
        break;
      }

      // Unpack
      case 'unpack': {
        const varString = args.value || 'x, y, z';
        const vars = varString.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        if (vars.length !== arr.length) {
          throw new Error(`ValueError: too many values to unpack (expected ${vars.length}, got ${arr.length})`);
        }

        unpackVars = vars;
        result = vars.map((v, i) => `${v} = "${arr[i]}"`).join(', ');
        resultType = 'unpacking';
        logEntry = `${vars.join(', ')} = tuple`;
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

  return { result, resultType, highlightedIndices, negativeIndices, logEntry, isError, errorMessage, unpackVars, steps };
}
