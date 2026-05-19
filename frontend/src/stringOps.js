export function executeStringOp(str, opName, args) {
  let result = null;
  let highlightedIndices = [];
  let logEntry = '';
  let isError = false;

  try {
    switch(opName) {
      // Access & Info
      case 'len':
        result = str.length;
        highlightedIndices = Array.from({length: str.length}, (_, i) => i);
        logEntry = `len("${str}") → ${result}`;
        break;
      case 'index_access':
        const i = parseInt(args.index);
        if (isNaN(i)) throw new Error("Index must be an integer");
        const actualI = i < 0 ? str.length + i : i;
        if (actualI < 0 || actualI >= str.length) throw new Error("Index out of range");
        result = str[actualI];
        highlightedIndices = [actualI];
        logEntry = `str[${i}] → "${result}"`;
        break;
      case 'slice':
        const start = args.start === '' ? 0 : parseInt(args.start);
        const end = args.end === '' ? str.length : parseInt(args.end);
        const actualStart = start < 0 ? Math.max(0, str.length + start) : Math.min(str.length, start);
        const actualEnd = end < 0 ? Math.max(0, str.length + end) : Math.min(str.length, end);
        result = str.slice(actualStart, actualEnd);
        for(let j=actualStart; j<actualEnd; j++) highlightedIndices.push(j);
        logEntry = `str[${args.start}:${args.end}] → "${result}"`;
        break;
      case 'count':
        const target = args.target;
        let count = 0;
        let pos = 0;
        while (true) {
          pos = str.indexOf(target, pos);
          if (pos >= 0) {
            count++;
            for(let j=0; j<target.length; j++) highlightedIndices.push(pos+j);
            pos += target.length || 1;
          } else break;
        }
        result = count;
        logEntry = `str.count("${target}") → ${result}`;
        break;

      // Search & Check
      case 'find':
        const findTarg = args.target;
        result = str.indexOf(findTarg);
        if (result !== -1) {
          for(let j=0; j<findTarg.length; j++) highlightedIndices.push(result+j);
        }
        logEntry = `str.find("${findTarg}") → ${result}`;
        break;
      case 'index':
        const idxTarg = args.target;
        result = str.indexOf(idxTarg);
        if (result === -1) throw new Error("substring not found");
        for(let j=0; j<idxTarg.length; j++) highlightedIndices.push(result+j);
        logEntry = `str.index("${idxTarg}") → ${result}`;
        break;
      case 'startswith':
        result = str.startsWith(args.target);
        if (result) for(let j=0; j<args.target.length; j++) highlightedIndices.push(j);
        logEntry = `str.startswith("${args.target}") → ${result}`;
        break;
      case 'endswith':
        result = str.endsWith(args.target);
        if (result) {
          const startIdx = str.length - args.target.length;
          for(let j=0; j<args.target.length; j++) highlightedIndices.push(startIdx+j);
        }
        logEntry = `str.endswith("${args.target}") → ${result}`;
        break;
      case 'in':
        result = str.includes(args.target);
        if (result) {
          const inIdx = str.indexOf(args.target);
          for(let j=0; j<args.target.length; j++) highlightedIndices.push(inIdx+j);
        }
        logEntry = `"${args.target}" in str → ${result}`;
        break;
      case 'isalpha':
        result = /^[a-zA-Z]+$/.test(str);
        if (result) highlightedIndices = Array.from({length: str.length}, (_, i) => i);
        logEntry = `str.isalpha() → ${result}`;
        break;
      case 'isdigit':
        result = /^[0-9]+$/.test(str);
        if (result) highlightedIndices = Array.from({length: str.length}, (_, i) => i);
        logEntry = `str.isdigit() → ${result}`;
        break;
      case 'isalnum':
        result = /^[a-zA-Z0-9]+$/.test(str);
        if (result) highlightedIndices = Array.from({length: str.length}, (_, i) => i);
        logEntry = `str.isalnum() → ${result}`;
        break;
      case 'isspace':
        result = /^\s+$/.test(str);
        if (result) highlightedIndices = Array.from({length: str.length}, (_, i) => i);
        logEntry = `str.isspace() → ${result}`;
        break;
      case 'isupper':
        result = str === str.toUpperCase() && /[A-Z]/.test(str);
        logEntry = `str.isupper() → ${result}`;
        break;
      case 'islower':
        result = str === str.toLowerCase() && /[a-z]/.test(str);
        logEntry = `str.islower() → ${result}`;
        break;

      // Case
      case 'upper':
        result = str.toUpperCase();
        logEntry = `str.upper() → "${result}"`;
        break;
      case 'lower':
        result = str.toLowerCase();
        logEntry = `str.lower() → "${result}"`;
        break;
      case 'title':
        result = str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        logEntry = `str.title() → "${result}"`;
        break;
      case 'capitalize':
        result = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        logEntry = `str.capitalize() → "${result}"`;
        break;
      case 'swapcase':
        result = str.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
        logEntry = `str.swapcase() → "${result}"`;
        break;

      // Trim & Pad
      case 'strip':
        result = str.trim();
        logEntry = `str.strip() → "${result}"`;
        break;
      case 'lstrip':
        result = str.trimStart();
        logEntry = `str.lstrip() → "${result}"`;
        break;
      case 'rstrip':
        result = str.trimEnd();
        logEntry = `str.rstrip() → "${result}"`;
        break;
      case 'center':
        const cw = parseInt(args.width);
        const fill = args.fill || ' ';
        result = str.padStart(str.length + Math.floor((cw - str.length)/2), fill).padEnd(cw, fill);
        logEntry = `str.center(${cw}, "${fill}") → "${result}"`;
        break;
      case 'ljust':
        result = str.padEnd(parseInt(args.width), args.fill || ' ');
        logEntry = `str.ljust(${args.width}) → "${result}"`;
        break;
      case 'rjust':
        result = str.padStart(parseInt(args.width), args.fill || ' ');
        logEntry = `str.rjust(${args.width}) → "${result}"`;
        break;
      case 'zfill':
        result = str.padStart(parseInt(args.width), '0');
        logEntry = `str.zfill(${args.width}) → "${result}"`;
        break;

      // Modify & Replace
      case 'replace':
        result = str.replaceAll(args.old, args.new);
        const re = new RegExp(args.old, 'g');
        let match;
        while ((match = re.exec(str)) !== null) {
          for(let j=0; j<args.old.length; j++) highlightedIndices.push(match.index + j);
        }
        logEntry = `str.replace("${args.old}", "${args.new}") → "${result}"`;
        break;
      case 'concat':
        result = str + args.str;
        logEntry = `str + "${args.str}" → "${result}"`;
        break;
      case 'repeat':
        const times = parseInt(args.times);
        result = str.repeat(times);
        logEntry = `str * ${times} → "${result}"`;
        break;

      // Split & Join
      case 'split':
        result = args.sep ? str.split(args.sep) : str.trim().split(/\s+/);
        logEntry = `str.split(${args.sep ? `"${args.sep}"` : ''}) → ${JSON.stringify(result)}`;
        break;
      case 'splitlines':
        result = str.split(/\r?\n/);
        logEntry = `str.splitlines() → ${JSON.stringify(result)}`;
        break;
      case 'join':
        const arr = args.iterable.split(',').map(s=>s.trim());
        result = arr.join(str);
        logEntry = `"${str}".join([${arr.map(s=>`"${s}"`).join(',')}]) → "${result}"`;
        break;

      // Convert
      case 'ord':
        if (str.length !== 1) throw new Error("ord() expected a character");
        result = str.charCodeAt(0);
        highlightedIndices = [0];
        logEntry = `ord("${str}") → ${result}`;
        break;
      case 'chr':
        const code = parseInt(str);
        if (isNaN(code)) throw new Error("String must be a valid integer");
        result = String.fromCharCode(code);
        logEntry = `chr(${code}) → "${result}"`;
        break;
      case 'int':
        result = parseInt(str);
        if (isNaN(result)) throw new Error("invalid literal for int()");
        logEntry = `int("${str}") → ${result}`;
        break;
      case 'float':
        result = parseFloat(str);
        if (isNaN(result)) throw new Error("could not convert string to float");
        logEntry = `float("${str}") → ${result}`;
        break;
      case 'list':
        result = str.split('');
        logEntry = `list("${str}") → ${JSON.stringify(result)}`;
        break;

      // Algorithms
      case 'reverse':
        result = str.split('').reverse().join('');
        logEntry = `Reverse string → "${result}"`;
        break;
      case 'palindrome':
        const clean = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        result = clean === clean.split('').reverse().join('') && clean.length > 0;
        logEntry = `Is Palindrome? → ${result}`;
        break;
      case 'anagram':
        const clean2 = args.target.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const clean1 = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        result = clean1.split('').sort().join('') === clean2.split('').sort().join('');
        logEntry = `Is Anagram of "${args.target}"? → ${result}`;
        break;
      case 'run-length':
        let res = '';
        if (str.length === 0) {
          result = res;
          logEntry = `Run-length encode → ""`;
          break;
        }
        for (let i = 0; i < str.length; i++) {
          let count = 1;
          while (i + 1 < str.length && str[i] === str[i+1]) {
            count++; i++;
          }
          res += str[i] + count;
        }
        result = res;
        logEntry = `Run-length encode → "${result}"`;
        break;

      default:
        throw new Error("Unknown operation");
    }
  } catch (e) {
    isError = true;
    logEntry = `${opName} Error: ${e.message}`;
  }

  return { result, highlightedIndices, logEntry, isError };
}
