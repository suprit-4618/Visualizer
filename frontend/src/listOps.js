// listOps.js

const copyArr = (arr) => [...arr];

export function executeListOp(arr, capacity, opName, args) {
  let result = null;
  let resultType = '';
  let highlightedIndices = [];
  let negativeIndices = []; // Maps cells to negative labels e.g. -1, -2
  let logEntry = '';
  let isError = false;
  let steps = [];
  let nextArr = copyArr(arr);
  let nextCapacity = capacity;

  // Helper to handle negative indexing
  const getIndexAndNeg = (indexStr, len) => {
    const i = parseInt(indexStr);
    if (isNaN(i)) throw new Error("Index must be an integer");
    const isNeg = i < 0;
    const idx = isNeg ? len + i : i;
    if (idx < 0 || idx >= len) throw new Error("Index out of range");
    
    // Create negative index labels map
    const negIndices = Array.from({ length: len }, (_, k) => k - len);
    return { idx, isNeg, negIndices };
  };

  try {
    switch (opName) {
      // Add
      case 'append': {
        const val = args.value;
        let tempArr = copyArr(arr);
        let tempCap = capacity;

        // Check if resize needed
        if (tempArr.length >= tempCap) {
          const oldCap = tempCap;
          tempCap = tempCap === 0 ? 4 : tempCap * 2;
          steps.push({
            arrayState: copyArr(tempArr),
            capacity: oldCap,
            highlightedIndices: [],
            message: `Capacity (${oldCap}) is full! Resizing allocated memory (doubling to ${tempCap}).`,
            resize: true,
            newCapacity: tempCap
          });
        }

        tempArr.push(val);
        steps.push({
          arrayState: copyArr(tempArr),
          capacity: tempCap,
          highlightedIndices: [tempArr.length - 1],
          message: `Appended "${val}" to the list at index ${tempArr.length - 1}.`
        });

        nextArr = tempArr;
        nextCapacity = tempCap;
        result = nextArr;
        resultType = 'list';
        logEntry = `list.append("${val}")`;
        break;
      }
      case 'insert': {
        const i = parseInt(args.index);
        const val = args.value;
        if (isNaN(i)) throw new Error("Index must be an integer");
        
        let tempArr = copyArr(arr);
        let tempCap = capacity;
        
        // Python clip indexing for insert
        const idx = i < 0 ? Math.max(0, tempArr.length + i) : Math.min(tempArr.length, i);

        // Check if resize needed
        if (tempArr.length >= tempCap) {
          const oldCap = tempCap;
          tempCap = tempCap === 0 ? 4 : tempCap * 2;
          steps.push({
            arrayState: copyArr(tempArr),
            capacity: oldCap,
            highlightedIndices: [],
            message: `Capacity (${oldCap}) is full! Resizing list memory (doubling to ${tempCap}).`,
            resize: true,
            newCapacity: tempCap
          });
        }

        // Show right slide step-by-step trace
        for (let j = tempArr.length; j > idx; j--) {
          steps.push({
            arrayState: copyArr(tempArr),
            capacity: tempCap,
            highlightedIndices: [j - 1],
            message: `Sliding element "${tempArr[j-1]}" from index ${j-1} to ${j} to open a slot`
          });
        }

        tempArr.splice(idx, 0, val);
        steps.push({
          arrayState: copyArr(tempArr),
          capacity: tempCap,
          highlightedIndices: [idx],
          message: `Inserted "${val}" at index ${idx}.`
        });

        nextArr = tempArr;
        nextCapacity = tempCap;
        result = nextArr;
        resultType = 'list';
        logEntry = `list.insert(${i}, "${val}")`;
        break;
      }
      case 'extend': {
        const strList = args.value;
        const cleanStr = strList.replace(/[\[\]]/g, '');
        const items = cleanStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (items.length === 0) throw new Error("List is empty");

        let tempArr = copyArr(arr);
        let tempCap = capacity;

        for (const item of items) {
          if (tempArr.length >= tempCap) {
            const oldCap = tempCap;
            tempCap = tempCap === 0 ? 4 : tempCap * 2;
            steps.push({
              arrayState: copyArr(tempArr),
              capacity: oldCap,
              highlightedIndices: [],
              message: `Capacity (${oldCap}) exceeded! Resizing allocated memory to ${tempCap}.`,
              resize: true,
              newCapacity: tempCap
            });
          }
          tempArr.push(item);
          steps.push({
            arrayState: copyArr(tempArr),
            capacity: tempCap,
            highlightedIndices: [tempArr.length - 1],
            message: `Appended item "${item}" during extend operation.`
          });
        }

        nextArr = tempArr;
        nextCapacity = tempCap;
        result = nextArr;
        resultType = 'list';
        logEntry = `list.extend(${JSON.stringify(items)})`;
        break;
      }

      // Remove
      case 'remove': {
        const val = args.value;
        let tempArr = copyArr(arr);
        let foundIdx = -1;

        // Step 1: Scan
        for (let i = 0; i < tempArr.length; i++) {
          steps.push({
            arrayState: copyArr(tempArr),
            capacity: capacity,
            highlightedIndices: [i],
            message: `Scanning index ${i} ("${tempArr[i]}") for match with target "${val}"`
          });
          if (tempArr[i] === val) {
            foundIdx = i;
            steps.push({
              arrayState: copyArr(tempArr),
              capacity: capacity,
              highlightedIndices: [i],
              message: `Match found at index ${i}! Removing element.`,
              removeMark: true
            });
            break;
          }
        }

        if (foundIdx === -1) throw new Error(`ValueError: list.remove(x): x not in list`);

        // Step 2: Shift Left
        for (let j = foundIdx; j < tempArr.length - 1; j++) {
          tempArr[j] = tempArr[j + 1];
          steps.push({
            arrayState: copyArr(tempArr),
            capacity: capacity,
            highlightedIndices: [j],
            message: `Shifting element "${tempArr[j]}" from index ${j+1} left to index ${j}`
          });
        }

        tempArr.pop();
        steps.push({
          arrayState: copyArr(tempArr),
          capacity: capacity,
          highlightedIndices: [],
          message: `Successfully closed gap and updated list size.`
        });

        nextArr = tempArr;
        result = nextArr;
        resultType = 'list';
        logEntry = `list.remove("${val}")`;
        break;
      }
      case 'pop': {
        if (arr.length === 0) throw new Error("IndexError: pop from empty list");
        
        let tempArr = copyArr(arr);
        let idxInput = args.index;
        let idx = tempArr.length - 1;

        if (idxInput !== undefined && idxInput.trim() !== '') {
          const resNeg = getIndexAndNeg(idxInput, tempArr.length);
          idx = resNeg.idx;
          if (resNeg.isNeg) {
            negativeIndices = resNeg.negIndices;
          }
        }

        const poppedVal = tempArr[idx];
        steps.push({
          arrayState: copyArr(tempArr),
          capacity: capacity,
          highlightedIndices: [idx],
          message: `Popping element "${poppedVal}" at index ${idx}.`,
          removeMark: true
        });

        // Shift remaining left if pop index was in middle
        for (let j = idx; j < tempArr.length - 1; j++) {
          tempArr[j] = tempArr[j + 1];
          steps.push({
            arrayState: copyArr(tempArr),
            capacity: capacity,
            highlightedIndices: [j],
            message: `Shifting element "${tempArr[j]}" from index ${j+1} left to ${j}`
          });
        }

        tempArr.pop();
        steps.push({
          arrayState: copyArr(tempArr),
          capacity: capacity,
          highlightedIndices: [],
          message: `Popped element value "${poppedVal}".`
        });

        nextArr = tempArr;
        result = poppedVal;
        resultType = typeof poppedVal;
        logEntry = `list.pop(${idxInput !== undefined ? idxInput : ''}) → "${poppedVal}"`;
        break;
      }
      case 'clear': {
        nextArr = [];
        result = nextArr;
        resultType = 'list';
        logEntry = `list.clear()`;
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
        logEntry = `list[${args.index}] → "${result}"`;
        break;
      }
      case 'set': {
        const resNeg = getIndexAndNeg(args.index, arr.length);
        const idx = resNeg.idx;
        const val = args.value;
        nextArr[idx] = val;
        result = nextArr;
        resultType = 'list';
        highlightedIndices = [idx];
        if (resNeg.isNeg) {
          negativeIndices = resNeg.negIndices;
        }
        logEntry = `list[${args.index}] = "${val}"`;
        break;
      }
      case 'index': {
        const val = args.value;
        const idx = arr.indexOf(val);
        if (idx === -1) throw new Error(`ValueError: "${val}" is not in list`);
        result = idx;
        resultType = 'int';
        highlightedIndices = [idx];
        logEntry = `list.index("${val}") → ${idx}`;
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
        logEntry = `list.count("${val}") → ${total}`;
        break;
      }

      // Order
      case 'reverse': {
        nextArr.reverse();
        result = nextArr;
        resultType = 'list';
        logEntry = `list.reverse()`;
        break;
      }
      case 'sort': {
        let tempArr = copyArr(arr);
        // Simple client-side bubble sort transitions
        let n = tempArr.length;
        for (let i = 0; i < n - 1; i++) {
          for (let j = 0; j < n - i - 1; j++) {
            const v1 = isNaN(Number(tempArr[j])) ? tempArr[j] : Number(tempArr[j]);
            const v2 = isNaN(Number(tempArr[j+1])) ? tempArr[j+1] : Number(tempArr[j+1]);
            
            steps.push({
              arrayState: copyArr(tempArr),
              capacity: capacity,
              highlightedIndices: [j, j + 1],
              message: `Comparing arr[${j}] ("${tempArr[j]}") and arr[${j+1}] ("${tempArr[j+1]}")`
            });

            if (v1 > v2) {
              const t = tempArr[j];
              tempArr[j] = tempArr[j+1];
              tempArr[j+1] = t;
              steps.push({
                arrayState: copyArr(tempArr),
                capacity: capacity,
                highlightedIndices: [j, j+1],
                swapped: true,
                message: `Swapped elements to sort ascending.`
              });
            }
          }
        }
        nextArr = tempArr;
        result = nextArr;
        resultType = 'list';
        logEntry = `list.sort()`;
        break;
      }
      case 'sorted': {
        let tempArr = copyArr(arr);
        tempArr.sort((a, b) => {
          const v1 = isNaN(Number(a)) ? a : Number(a);
          const v2 = isNaN(Number(b)) ? b : Number(b);
          return v1 > v2 ? 1 : -1;
        });
        result = tempArr;
        resultType = 'list';
        highlightedIndices = Array.from({length: arr.length}, (_, i) => i);
        logEntry = `sorted(list) → ${JSON.stringify(tempArr)}`;
        break;
      }

      // Info
      case 'len': {
        result = arr.length;
        resultType = 'int';
        logEntry = `len(list) → ${result}`;
        break;
      }
      case 'in_operator': {
        const val = args.value;
        result = arr.includes(val);
        resultType = 'bool';
        logEntry = `"${val}" in list → ${result ? 'True' : 'False'}`;
        break;
      }
      case 'min': {
        if (arr.length === 0) throw new Error("ValueError: min() arg is an empty sequence");
        const nums = arr.map(Number);
        const hasNan = nums.some(isNaN);
        if (hasNan) {
          // Lexicographical min
          result = arr.reduce((a, b) => a < b ? a : b);
        } else {
          result = Math.min(...nums);
        }
        resultType = typeof result === 'number' ? 'int' : 'string';
        const minIdx = arr.indexOf(String(result));
        if (minIdx !== -1) highlightedIndices = [minIdx];
        logEntry = `min(list) → "${result}"`;
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
        logEntry = `max(list) → "${result}"`;
        break;
      }
      case 'sum': {
        const nums = arr.map(Number);
        const hasNan = nums.some(isNaN);
        if (hasNan) throw new Error("TypeError: unsupported operand type(s) for +: 'int' and 'str'");
        result = nums.reduce((a, b) => a + b, 0);
        resultType = 'int';
        logEntry = `sum(list) → ${result}`;
        break;
      }

      // Copy
      case 'copy': {
        result = copyArr(arr);
        resultType = 'list';
        highlightedIndices = Array.from({length: arr.length}, (_, i) => i);
        logEntry = `list.copy()`;
        break;
      }
      case 'slice_copy': {
        const start = args.start === '' ? 0 : parseInt(args.start);
        const end = args.end === '' ? arr.length : parseInt(args.end);
        const actualStart = start < 0 ? Math.max(0, arr.length + start) : Math.min(arr.length, start);
        const actualEnd = end < 0 ? Math.max(0, arr.length + end) : Math.min(arr.length, end);
        result = arr.slice(actualStart, actualEnd);
        resultType = 'list';
        for(let j=actualStart; j<actualEnd; j++) highlightedIndices.push(j);
        logEntry = `list[${args.start || ''}:${args.end || ''}]`;
        break;
      }

      default:
        throw new Error("Unknown operation");
    }
  } catch (e) {
    isError = true;
    logEntry = `${opName} Error: ${e.message}`;
  }

  return { result, resultType, highlightedIndices, negativeIndices, logEntry, isError, steps, nextArr, nextCapacity };
}
