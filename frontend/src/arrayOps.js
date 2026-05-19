// arrayOps.js

// Deep copy array state
const copyArr = (arr) => [...arr];

export function executeArrayOp(arr, capacity, opName, args) {
  let result = null;
  let resultType = '';
  let highlightedIndices = [];
  let logEntry = '';
  let isError = false;
  let steps = []; // Used for step-by-step algorithms (Search, Sort)
  let nextArr = copyArr(arr);

  try {
    switch (opName) {
      // Access & Info
      case 'get': {
        const i = parseInt(args.index);
        if (isNaN(i)) throw new Error("Index must be an integer");
        const idx = i < 0 ? arr.length + i : i;
        if (idx < 0 || idx >= arr.length) throw new Error("Index out of range");
        result = arr[idx];
        resultType = typeof result;
        highlightedIndices = [idx];
        logEntry = `arr[${i}] → ${result}`;
        break;
      }
      case 'set': {
        const i = parseInt(args.index);
        const val = args.value;
        if (isNaN(i)) throw new Error("Index must be an integer");
        const idx = i < 0 ? arr.length + i : i;
        if (idx < 0 || idx >= arr.length) throw new Error("Index out of range");
        nextArr[idx] = val;
        result = nextArr;
        resultType = 'array';
        highlightedIndices = [idx];
        logEntry = `arr[${i}] = ${val}`;
        break;
      }
      case 'len': {
        result = arr.length;
        resultType = 'int';
        logEntry = `len(arr) → ${result}`;
        break;
      }
      case 'contains': {
        const val = args.value;
        result = arr.includes(val);
        resultType = 'bool';
        logEntry = `"${val}" in arr → ${result ? 'True' : 'False'}`;
        break;
      }

      // Modify
      case 'append': {
        const val = args.value;
        if (arr.length >= capacity) throw new Error("Array overflow: Capacity limit reached");
        nextArr.push(val);
        result = nextArr;
        resultType = 'array';
        highlightedIndices = [nextArr.length - 1];
        logEntry = `arr.append("${val}")`;
        break;
      }
      case 'insert': {
        const i = parseInt(args.index);
        const val = args.value;
        if (isNaN(i)) throw new Error("Index must be an integer");
        if (arr.length >= capacity) throw new Error("Array overflow: Capacity limit reached");
        const idx = i < 0 ? Math.max(0, arr.length + i) : Math.min(arr.length, i);
        nextArr.splice(idx, 0, val);
        result = nextArr;
        resultType = 'array';
        highlightedIndices = [idx];
        logEntry = `arr.insert(${i}, "${val}")`;
        break;
      }
      case 'remove': {
        const idx = parseInt(args.index);
        if (isNaN(idx)) throw new Error("Index must be an integer");
        if (idx < 0 || idx >= arr.length) throw new Error("Index out of range");
        nextArr.splice(idx, 1);
        result = nextArr;
        resultType = 'array';
        logEntry = `arr.pop(${idx})`;
        break;
      }
      case 'pop': {
        if (arr.length === 0) throw new Error("pop from empty list");
        const popped = nextArr.pop();
        result = nextArr;
        resultType = 'array';
        logEntry = `arr.pop() → "${popped}"`;
        break;
      }
      case 'clear': {
        nextArr = [];
        result = nextArr;
        resultType = 'array';
        logEntry = `arr.clear()`;
        break;
      }

      // Search
      case 'linear_search': {
        const val = args.value;
        let found = false;
        for (let i = 0; i < arr.length; i++) {
          steps.push({
            arrayState: copyArr(arr),
            highlightedIndices: [i],
            message: `Comparing element at index ${i} ("${arr[i]}") with search target "${val}"`,
            pointers: { active: i }
          });
          if (arr[i] === val) {
            steps.push({
              arrayState: copyArr(arr),
              highlightedIndices: [i],
              message: `Found target "${val}" at index ${i}!`,
              pointers: { active: i },
              success: true
            });
            found = true;
            result = i;
            break;
          }
        }
        if (!found) {
          steps.push({
            arrayState: copyArr(arr),
            highlightedIndices: [],
            message: `Target "${val}" not found in array.`,
            failed: true
          });
          result = -1;
        }
        resultType = 'int';
        logEntry = `arr.index("${val}") → ${result}`;
        break;
      }
      case 'binary_search': {
        const val = args.value;
        // Verify sorted
        const isSorted = arr.every((v, i) => i === 0 || Number(v) >= Number(arr[i-1]) || String(v) >= String(arr[i-1]));
        if (!isSorted) {
          throw new Error("Binary Search requires a sorted array!");
        }
        
        let low = 0;
        let high = arr.length - 1;
        let foundIdx = -1;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          steps.push({
            arrayState: copyArr(arr),
            highlightedIndices: [mid],
            pointers: { low, high, mid },
            message: `Checking midpoint at index ${mid} ("${arr[mid]}") in range [${low}, ${high}]`
          });

          if (arr[mid] === val) {
            steps.push({
              arrayState: copyArr(arr),
              highlightedIndices: [mid],
              pointers: { low, high, mid },
              message: `Found target "${val}" at index ${mid}!`,
              success: true
            });
            foundIdx = mid;
            break;
          } else if (Number(arr[mid]) < Number(val) || String(arr[mid]) < String(val)) {
            low = mid + 1;
            steps.push({
              arrayState: copyArr(arr),
              highlightedIndices: [],
              pointers: { low, high },
              message: `Target "${val}" is larger than mid. Searching right half.`
            });
          } else {
            high = mid - 1;
            steps.push({
              arrayState: copyArr(arr),
              highlightedIndices: [],
              pointers: { low, high },
              message: `Target "${val}" is smaller than mid. Searching left half.`
            });
          }
        }

        if (foundIdx === -1) {
          steps.push({
            arrayState: copyArr(arr),
            highlightedIndices: [],
            message: `Target "${val}" not found.`,
            failed: true
          });
        }
        result = foundIdx;
        resultType = 'int';
        logEntry = `binary_search(arr, "${val}") → ${result}`;
        break;
      }

      // Sort
      case 'bubble_sort': {
        let tempArr = copyArr(arr);
        let n = tempArr.length;
        for (let i = 0; i < n - 1; i++) {
          for (let j = 0; j < n - i - 1; j++) {
            steps.push({
              arrayState: copyArr(tempArr),
              highlightedIndices: [j, j + 1],
              message: `Comparing arr[${j}] ("${tempArr[j]}") and arr[${j+1}] ("${tempArr[j+1]}")`
            });
            
            const val1 = isNaN(Number(tempArr[j])) ? tempArr[j] : Number(tempArr[j]);
            const val2 = isNaN(Number(tempArr[j+1])) ? tempArr[j+1] : Number(tempArr[j+1]);

            if (val1 > val2) {
              const temp = tempArr[j];
              tempArr[j] = tempArr[j + 1];
              tempArr[j + 1] = temp;
              steps.push({
                arrayState: copyArr(tempArr),
                highlightedIndices: [j, j + 1],
                swapped: true,
                swapPair: [j, j + 1],
                message: `Swapped arr[${j}] and arr[${j+1}]`
              });
            }
          }
        }
        nextArr = tempArr;
        result = nextArr;
        resultType = 'array';
        logEntry = `arr.sort() [Bubble Sort]`;
        break;
      }
      case 'selection_sort': {
        let tempArr = copyArr(arr);
        let n = tempArr.length;
        for (let i = 0; i < n - 1; i++) {
          let minIdx = i;
          steps.push({
            arrayState: copyArr(tempArr),
            highlightedIndices: [i],
            pointers: { active: i },
            message: `Setting initial minimum element at index ${i}`
          });
          for (let j = i + 1; j < n; j++) {
            steps.push({
              arrayState: copyArr(tempArr),
              highlightedIndices: [j, minIdx],
              message: `Comparing arr[${j}] with current minimum arr[${minIdx}]`
            });

            const val1 = isNaN(Number(tempArr[j])) ? tempArr[j] : Number(tempArr[j]);
            const val2 = isNaN(Number(tempArr[minIdx])) ? tempArr[minIdx] : Number(tempArr[minIdx]);

            if (val1 < val2) {
              minIdx = j;
              steps.push({
                arrayState: copyArr(tempArr),
                highlightedIndices: [minIdx],
                message: `New minimum found at index ${minIdx}`
              });
            }
          }
          if (minIdx !== i) {
            const temp = tempArr[i];
            tempArr[i] = tempArr[minIdx];
            tempArr[minIdx] = temp;
            steps.push({
              arrayState: copyArr(tempArr),
              highlightedIndices: [i, minIdx],
              swapped: true,
              swapPair: [i, minIdx],
              message: `Swapping index ${i} with minimum index ${minIdx}`
            });
          }
        }
        nextArr = tempArr;
        result = nextArr;
        resultType = 'array';
        logEntry = `arr.sort() [Selection Sort]`;
        break;
      }
      case 'insertion_sort': {
        let tempArr = copyArr(arr);
        let n = tempArr.length;
        for (let i = 1; i < n; i++) {
          let key = tempArr[i];
          let j = i - 1;
          steps.push({
            arrayState: copyArr(tempArr),
            highlightedIndices: [i],
            message: `Inserting arr[${i}] ("${key}") into sorted sub-array`
          });
          
          while (j >= 0) {
            const val1 = isNaN(Number(tempArr[j])) ? tempArr[j] : Number(tempArr[j]);
            const val2 = isNaN(Number(key)) ? key : Number(key);

            steps.push({
              arrayState: copyArr(tempArr),
              highlightedIndices: [j, j + 1],
              message: `Comparing sub-array index ${j} ("${tempArr[j]}") with key "${key}"`
            });

            if (val1 > val2) {
              tempArr[j + 1] = tempArr[j];
              j = j - 1;
              steps.push({
                arrayState: copyArr(tempArr),
                highlightedIndices: [j + 1, j + 2],
                swapped: true,
                swapPair: [j + 1, j + 2],
                message: `Shifted element right`
              });
            } else {
              break;
            }
          }
          tempArr[j + 1] = key;
          steps.push({
            arrayState: copyArr(tempArr),
            highlightedIndices: [j + 1],
            message: `Placed key "${key}" at index ${j + 1}`
          });
        }
        nextArr = tempArr;
        result = nextArr;
        resultType = 'array';
        logEntry = `arr.sort() [Insertion Sort]`;
        break;
      }

      // Slice
      case 'slice': {
        const start = args.start === '' ? 0 : parseInt(args.start);
        const end = args.end === '' ? arr.length : parseInt(args.end);
        const actualStart = start < 0 ? Math.max(0, arr.length + start) : Math.min(arr.length, start);
        const actualEnd = end < 0 ? Math.max(0, arr.length + end) : Math.min(arr.length, end);
        result = arr.slice(actualStart, actualEnd);
        resultType = 'array';
        for(let j=actualStart; j<actualEnd; j++) highlightedIndices.push(j);
        logEntry = `arr[${args.start}:${args.end}] → ${JSON.stringify(result)}`;
        break;
      }
      case 'copy': {
        result = copyArr(arr);
        resultType = 'array';
        highlightedIndices = Array.from({length: arr.length}, (_, i) => i);
        logEntry = `arr.copy()`;
        break;
      }

      // Bulk
      case 'reverse': {
        nextArr.reverse();
        result = nextArr;
        resultType = 'array';
        logEntry = `arr.reverse()`;
        break;
      }
      case 'fill': {
        const val = args.value;
        nextArr.fill(val);
        result = nextArr;
        resultType = 'array';
        logEntry = `arr.fill("${val}")`;
        break;
      }
      case 'extend': {
        const strArr = args.value; // expected format: "[1, 2, 3]" or "1, 2, 3"
        const cleanStr = strArr.replace(/[\[\]]/g, '');
        const items = cleanStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (arr.length + items.length > capacity) throw new Error("Array overflow: Capacity limit reached");
        nextArr = [...arr, ...items];
        result = nextArr;
        resultType = 'array';
        logEntry = `arr.extend(${JSON.stringify(items)})`;
        break;
      }

      default:
        throw new Error("Unknown operation");
    }
  } catch (e) {
    isError = true;
    logEntry = `${opName} Error: ${e.message}`;
  }

  return { result, resultType, highlightedIndices, logEntry, isError, steps, nextArr };
}
