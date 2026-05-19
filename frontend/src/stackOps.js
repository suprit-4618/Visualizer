export function executeStackOp(stack, maxCapacity, opName, args) {
  let result = null;
  let resultType = '';
  let highlightedIndices = [];
  let logEntry = '';
  let isError = false;
  let stackDirection = null;
  let nextStack = [...stack];

  try {
    switch (opName) {
      case 'push': {
        const val = args.value;
        if (val === undefined || val === '') {
          throw new Error("Value cannot be empty");
        }
        stackDirection = 'push';
        if (maxCapacity !== null && maxCapacity !== undefined && maxCapacity > 0 && stack.length >= maxCapacity) {
          isError = true;
          result = "Stack Overflow";
          resultType = "str";
          logEntry = `stack.push("${val}") → Stack Overflow`;
          break;
        }
        nextStack.push(val);
        result = val;
        resultType = typeof val;
        logEntry = `stack.push("${val}")`;
        break;
      }
      case 'pop': {
        stackDirection = 'pop';
        if (stack.length === 0) {
          isError = true;
          result = "Stack Underflow";
          resultType = "str";
          logEntry = `stack.pop() → Stack Underflow`;
          break;
        }
        const popped = nextStack.pop();
        result = popped;
        resultType = typeof popped;
        logEntry = `stack.pop() → "${popped}"`;
        break;
      }
      case 'peek': {
        if (stack.length === 0) {
          throw new Error("IndexError: peek from empty stack");
        }
        result = stack[stack.length - 1];
        resultType = typeof result;
        highlightedIndices = [stack.length - 1];
        logEntry = `stack.peek() → "${result}"`;
        break;
      }
      case 'isEmpty': {
        result = stack.length === 0;
        resultType = 'bool';
        logEntry = `stack.is_empty() → ${result ? 'True' : 'False'}`;
        break;
      }
      case 'size': {
        result = stack.length;
        resultType = 'int';
        logEntry = `len(stack) → ${result}`;
        break;
      }
      case 'clear': {
        nextStack = [];
        result = null;
        resultType = 'None';
        logEntry = `stack.clear()`;
        break;
      }
      case 'contains': {
        const val = args.value;
        if (val === undefined || val === '') {
          throw new Error("Value cannot be empty");
        }
        result = stack.includes(val);
        resultType = 'bool';
        if (result) {
          stack.forEach((item, idx) => {
            if (item === val) highlightedIndices.push(idx);
          });
        }
        logEntry = `"${val}" in stack → ${result ? 'True' : 'False'}`;
        break;
      }
      case 'reverse': {
        nextStack.reverse();
        result = nextStack;
        resultType = 'list';
        logEntry = `stack.reverse()`;
        break;
      }
      case 'sort': {
        nextStack.sort((a, b) => {
          const numA = Number(a);
          const numB = Number(b);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return String(a).localeCompare(String(b));
        });
        result = nextStack;
        resultType = 'list';
        logEntry = `stack.sort()`;
        break;
      }
      default:
        throw new Error("Unknown operation");
    }
  } catch (e) {
    isError = true;
    result = e.message;
    resultType = 'str';
    logEntry = `${opName} Error: ${e.message}`;
  }

  return { result, resultType, highlightedIndices, logEntry, isError, stackDirection, nextStack };
}
