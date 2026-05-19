// dictOps.js

export function executeDictOp(pairs, opName, args) {
  let result = null;
  let resultType = '';
  let logEntry = '';
  let isError = false;
  let errorMessage = '';
  let affectedKey = null;
  let newPairs = [...pairs.map(p => ({ ...p }))];
  let steps = [];
  let expandSection = null; // 'keys' or 'values'

  try {
    switch (opName) {
      // Access
      case 'get': {
        const key = args.key;
        if (!key) throw new Error("Key is required");
        const found = pairs.find(p => p.key === key);
        if (!found) {
          isError = true;
          errorMessage = `KeyError: '${key}'`;
          logEntry = `dict.get("${key}") → KeyError`;
        } else {
          result = found.value;
          resultType = typeof found.value;
          affectedKey = key;
          logEntry = `dict["${key}"] → "${found.value}"`;
        }
        break;
      }
      case 'get_default': {
        const key = args.key;
        const def = args.default === '' ? 'None' : args.default;
        if (!key) throw new Error("Key is required");
        const found = pairs.find(p => p.key === key);
        if (!found) {
          result = def;
          resultType = typeof def;
          logEntry = `dict.get("${key}", "${def}") → "${def}" (default)`;
        } else {
          result = found.value;
          resultType = typeof found.value;
          affectedKey = key;
          logEntry = `dict.get("${key}", "${def}") → "${found.value}"`;
        }
        break;
      }
      case 'keys': {
        result = pairs.map(p => p.key);
        resultType = 'dict_keys';
        expandSection = 'keys';
        logEntry = `dict.keys() → dict_keys([${result.map(k => `'${k}'`).join(', ')}])`;
        break;
      }
      case 'values': {
        result = pairs.map(p => p.value);
        resultType = 'dict_values';
        expandSection = 'values';
        logEntry = `dict.values() → dict_values([${result.map(v => `'${v}'`).join(', ')}])`;
        break;
      }
      case 'items': {
        result = pairs.map(p => `('${p.key}', '${p.value}')`).join(', ');
        resultType = 'dict_items';
        logEntry = `dict.items() → dict_items([${pairs.map(p => `('${p.key}', '${p.value}')`).join(', ')}])`;
        break;
      }

      // Modify
      case 'set': {
        const key = args.key;
        const val = args.value;
        if (!key) throw new Error("Key is required");
        const existingIdx = pairs.findIndex(p => p.key === key);
        
        if (existingIdx !== -1) {
          // Update existing
          newPairs[existingIdx].value = val;
          affectedKey = key;
          logEntry = `dict["${key}"] = "${val}" (updated)`;
        } else {
          // Add new
          newPairs.unshift({ key, value: val, isNew: true });
          affectedKey = key;
          logEntry = `dict["${key}"] = "${val}" (inserted)`;
        }
        break;
      }
      case 'update': {
        const jsonStr = args.value;
        if (!jsonStr) throw new Error("JSON string required");
        let dictObj = {};
        try {
          dictObj = JSON.parse(jsonStr);
        } catch (e) {
          throw new Error("Invalid JSON format. Expected e.g. {\"c\": 3, \"d\": 4}");
        }
        
        for (const [k, v] of Object.entries(dictObj)) {
          const valStr = String(v);
          const existingIdx = newPairs.findIndex(p => p.key === k);
          if (existingIdx !== -1) {
            newPairs[existingIdx].value = valStr;
          } else {
            newPairs.push({ key: k, value: valStr, isNew: true });
          }
        }
        logEntry = `dict.update(${jsonStr})`;
        break;
      }
      case 'delete': {
        const key = args.key;
        if (!key) throw new Error("Key is required");
        const idx = pairs.findIndex(p => p.key === key);
        if (idx === -1) {
          isError = true;
          errorMessage = `KeyError: '${key}'`;
          logEntry = `del dict["${key}"] → KeyError`;
        } else {
          affectedKey = key; // for delete animation
          newPairs.splice(idx, 1);
          logEntry = `del dict["${key}"]`;
        }
        break;
      }
      case 'pop': {
        const key = args.key;
        if (!key) throw new Error("Key is required");
        const idx = pairs.findIndex(p => p.key === key);
        if (idx === -1) {
          isError = true;
          errorMessage = `KeyError: '${key}'`;
          logEntry = `dict.pop("${key}") → KeyError`;
        } else {
          affectedKey = key;
          result = pairs[idx].value;
          resultType = typeof result;
          newPairs.splice(idx, 1);
          logEntry = `dict.pop("${key}") → "${result}"`;
        }
        break;
      }
      case 'clear': {
        newPairs = [];
        logEntry = `dict.clear()`;
        break;
      }

      // Check
      case 'in_operator': {
        const key = args.key;
        if (!key) throw new Error("Key is required");
        const found = pairs.some(p => p.key === key);
        result = found;
        resultType = 'bool';
        logEntry = `"${key}" in dict → ${found ? 'True' : 'False'}`;
        break;
      }
      case 'len': {
        result = pairs.length;
        resultType = 'int';
        logEntry = `len(dict) → ${result}`;
        break;
      }

      // Iterate
      case 'iterate': {
        result = pairs.map(p => p.key);
        resultType = 'list';
        logEntry = `[k for k in dict] → [${result.map(k => `'${k}'`).join(', ')}]`;
        break;
      }

      // Convert
      case 'to_list_tuples': {
        result = `[${pairs.map(p => `('${p.key}', '${p.value}')`).join(', ')}]`;
        resultType = 'list';
        logEntry = `list(dict.items()) → ${result}`;
        break;
      }
      case 'fromkeys': {
        const keysStr = args.key || 'a, b, c';
        const defVal = args.value === '' ? 'None' : args.value;
        const keys = keysStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        newPairs = keys.map(k => ({ key: k, value: defVal }));
        logEntry = `dict.fromkeys([${keys.map(k => `'${k}'`).join(', ')}], "${defVal}")`;
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

  return { result, resultType, logEntry, isError, errorMessage, affectedKey, newPairs, steps, expandSection };
}
