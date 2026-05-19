export function executeQueueOp(queueState, opName, args) {
  let result = null;
  let resultType = '';
  let highlightedIndices = [];
  let logEntry = '';
  let isError = false;
  let queueDirection = null;

  // Clone next state
  const nextQueueState = {
    type: queueState.type,
    elements: [...queueState.elements],
    front: queueState.front,
    rear: queueState.rear
  };

  const { type, elements } = nextQueueState;

  try {
    switch (opName) {
      case 'enqueue': {
        const val = args.value;
        if (val === undefined || val === '') {
          throw new Error("Value cannot be empty");
        }
        queueDirection = 'enqueue';

        if (type === 'simple') {
          if (elements.length >= 8) {
            isError = true;
            result = "Queue Overflow";
            resultType = "str";
            logEntry = `queue.enqueue("${val}") → Queue Overflow`;
            break;
          }
          nextQueueState.elements.push(val);
          nextQueueState.front = 0;
          nextQueueState.rear = nextQueueState.elements.length - 1;
          result = val;
          resultType = typeof val;
          logEntry = `queue.enqueue("${val}")`;
        } 
        else if (type === 'circular') {
          const isFull = nextQueueState.front !== -1 && (nextQueueState.rear + 1) % 8 === nextQueueState.front;
          if (isFull) {
            isError = true;
            result = "Queue Overflow";
            resultType = "str";
            logEntry = `circular_queue.enqueue("${val}") → Queue Overflow`;
            break;
          }
          if (nextQueueState.front === -1) {
            nextQueueState.front = 0;
            nextQueueState.rear = 0;
          } else {
            nextQueueState.rear = (nextQueueState.rear + 1) % 8;
          }
          nextQueueState.elements[nextQueueState.rear] = val;
          result = val;
          resultType = typeof val;
          logEntry = `circular_queue.enqueue("${val}") [index: ${nextQueueState.rear}]`;
        } 
        else if (type === 'priority') {
          if (elements.length >= 8) {
            isError = true;
            result = "Queue Overflow";
            resultType = "str";
            logEntry = `priority_queue.enqueue("${val}") → Queue Overflow`;
            break;
          }
          let prio = parseInt(args.priority);
          if (isNaN(prio)) {
            prio = 5; // default priority
          }
          // Insert element as object { value, priority }
          nextQueueState.elements.push({ value: val, priority: prio });
          // Stable sort by priority score ascending (smaller number is higher priority)
          nextQueueState.elements.sort((a, b) => a.priority - b.priority);
          nextQueueState.front = 0;
          nextQueueState.rear = nextQueueState.elements.length - 1;
          result = val;
          resultType = typeof val;
          logEntry = `priority_queue.enqueue("${val}", priority=${prio})`;
        }
        break;
      }

      case 'dequeue': {
        queueDirection = 'dequeue';
        
        if (type === 'simple') {
          if (elements.length === 0) {
            isError = true;
            result = "Queue Underflow";
            resultType = "str";
            logEntry = `queue.dequeue() → Queue Underflow`;
            break;
          }
          const popped = nextQueueState.elements.shift();
          nextQueueState.front = nextQueueState.elements.length > 0 ? 0 : -1;
          nextQueueState.rear = nextQueueState.elements.length > 0 ? nextQueueState.elements.length - 1 : -1;
          result = popped;
          resultType = typeof popped;
          logEntry = `queue.dequeue() → "${popped}"`;
        } 
        else if (type === 'circular') {
          if (nextQueueState.front === -1) {
            isError = true;
            result = "Queue Underflow";
            resultType = "str";
            logEntry = `circular_queue.dequeue() → Queue Underflow`;
            break;
          }
          const popped = nextQueueState.elements[nextQueueState.front];
          nextQueueState.elements[nextQueueState.front] = null;
          if (nextQueueState.front === nextQueueState.rear) {
            // Became empty
            nextQueueState.front = -1;
            nextQueueState.rear = -1;
          } else {
            nextQueueState.front = (nextQueueState.front + 1) % 8;
          }
          result = popped;
          resultType = typeof popped;
          logEntry = `circular_queue.dequeue() → "${popped}"`;
        } 
        else if (type === 'priority') {
          if (elements.length === 0) {
            isError = true;
            result = "Queue Underflow";
            resultType = "str";
            logEntry = `priority_queue.dequeue() → Queue Underflow`;
            break;
          }
          const poppedObj = nextQueueState.elements.shift();
          nextQueueState.front = nextQueueState.elements.length > 0 ? 0 : -1;
          nextQueueState.rear = nextQueueState.elements.length > 0 ? nextQueueState.elements.length - 1 : -1;
          result = poppedObj.value;
          resultType = typeof poppedObj.value;
          logEntry = `priority_queue.dequeue() → "${poppedObj.value}" (P${poppedObj.priority})`;
        }
        break;
      }

      case 'peek': {
        if (type === 'simple') {
          if (elements.length === 0) throw new Error("IndexError: peek from empty queue");
          result = elements[0];
          resultType = typeof result;
          highlightedIndices = [0];
          logEntry = `queue.peek() → "${result}"`;
        } 
        else if (type === 'circular') {
          if (nextQueueState.front === -1) throw new Error("IndexError: peek from empty queue");
          result = elements[nextQueueState.front];
          resultType = typeof result;
          highlightedIndices = [nextQueueState.front];
          logEntry = `circular_queue.peek() → "${result}"`;
        } 
        else if (type === 'priority') {
          if (elements.length === 0) throw new Error("IndexError: peek from empty queue");
          result = elements[0].value;
          resultType = typeof result;
          highlightedIndices = [0];
          logEntry = `priority_queue.peek() → "${result}" (P${elements[0].priority})`;
        }
        break;
      }

      case 'isEmpty': {
        const empty = type === 'circular' ? nextQueueState.front === -1 : elements.length === 0;
        result = empty;
        resultType = 'bool';
        logEntry = `${type === 'circular' ? 'circular_' : type === 'priority' ? 'priority_' : ''}queue.is_empty() → ${result ? 'True' : 'False'}`;
        break;
      }

      case 'size': {
        let sizeVal = 0;
        if (type === 'circular') {
          if (nextQueueState.front !== -1) {
            if (nextQueueState.rear >= nextQueueState.front) {
              sizeVal = nextQueueState.rear - nextQueueState.front + 1;
            } else {
              sizeVal = 8 - nextQueueState.front + nextQueueState.rear + 1;
            }
          }
        } else {
          sizeVal = elements.length;
        }
        result = sizeVal;
        resultType = 'int';
        logEntry = `len(${type === 'circular' ? 'circular_' : type === 'priority' ? 'priority_' : ''}queue) → ${result}`;
        break;
      }

      case 'clear': {
        if (type === 'circular') {
          nextQueueState.elements = Array(8).fill(null);
          nextQueueState.front = -1;
          nextQueueState.rear = -1;
        } else {
          nextQueueState.elements = [];
          nextQueueState.front = -1;
          nextQueueState.rear = -1;
        }
        result = null;
        resultType = 'None';
        logEntry = `${type === 'circular' ? 'circular_' : type === 'priority' ? 'priority_' : ''}queue.clear()`;
        break;
      }

      case 'contains': {
        const val = args.value;
        if (val === undefined || val === '') {
          throw new Error("Value cannot be empty");
        }
        if (type === 'simple') {
          result = elements.includes(val);
          resultType = 'bool';
          if (result) {
            elements.forEach((item, idx) => {
              if (item === val) highlightedIndices.push(idx);
            });
          }
        } 
        else if (type === 'circular') {
          result = elements.includes(val);
          resultType = 'bool';
          if (result) {
            elements.forEach((item, idx) => {
              if (item === val) highlightedIndices.push(idx);
            });
          }
        } 
        else if (type === 'priority') {
          result = elements.some(item => item.value === val);
          resultType = 'bool';
          if (result) {
            elements.forEach((item, idx) => {
              if (item.value === val) highlightedIndices.push(idx);
            });
          }
        }
        logEntry = `"${val}" in queue → ${result ? 'True' : 'False'}`;
        break;
      }

      case 'reverse': {
        if (type === 'circular') {
          throw new Error("Operation not supported on Circular Queue");
        }
        nextQueueState.elements.reverse();
        nextQueueState.front = nextQueueState.elements.length > 0 ? 0 : -1;
        nextQueueState.rear = nextQueueState.elements.length > 0 ? nextQueueState.elements.length - 1 : -1;
        result = nextQueueState.elements;
        resultType = 'list';
        logEntry = `${type === 'priority' ? 'priority_' : ''}queue.reverse()`;
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

  return { 
    result, 
    resultType, 
    highlightedIndices, 
    logEntry, 
    isError, 
    queueDirection, 
    queueType: type,
    frontIndex: nextQueueState.front,
    rearIndex: nextQueueState.rear,
    nextQueueState 
  };
}
