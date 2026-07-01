import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const webRoot = path.join(root, "src", "lms", "lms.WebMvc");
const i18nRoot = path.join(webRoot, "wwwroot", "i18n");
const dictionaries = {
  en: JSON.parse(fs.readFileSync(path.join(i18nRoot, "en.json"), "utf8")),
  vi: JSON.parse(fs.readFileSync(path.join(i18nRoot, "vi.json"), "utf8"))
};

function flatten(value, prefix = "", output = new Set()) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, output);
    }
    return output;
  }

  output.add(prefix);
  return output;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "lib" || entry.name === "bin" || entry.name === "obj") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(cshtml|js)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function collectUsedKeys() {
  const keys = new Map();
  const attrPattern = /data-i18n(?:-[\w]+)?="([^"]+)"/g;
  const callPattern = /\bt\(\s*["']([^"']+)["']/g;

  for (const file of walk(webRoot)) {
    const relative = path.relative(root, file).replace(/\\/g, "/");
    const content = fs.readFileSync(file, "utf8");
    for (const pattern of [attrPattern, callPattern]) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1].trim();
        const tail = content.slice(match.index + match[0].length).trimStart();
        if (!key || key.includes("+") || key.includes("${") || tail.startsWith("+")) {
          continue;
        }

        if (!keys.has(key)) {
          keys.set(key, new Set());
        }
        keys.get(key).add(relative);
      }
    }
  }

  return keys;
}

const enKeys = flatten(dictionaries.en);
const viKeys = flatten(dictionaries.vi);
const usedKeys = collectUsedKeys();
const missingInVi = [...enKeys].filter((key) => !viKeys.has(key)).sort();
const missingInEn = [...viKeys].filter((key) => !enKeys.has(key)).sort();
const missingUsed = [...usedKeys.keys()]
  .filter((key) => !enKeys.has(key) || !viKeys.has(key))
  .sort();

if (missingInVi.length || missingInEn.length || missingUsed.length) {
  if (missingInVi.length) {
    console.error(`Keys missing in vi.json (${missingInVi.length}):`);
    console.error(missingInVi.join("\n"));
  }
  if (missingInEn.length) {
    console.error(`Keys missing in en.json (${missingInEn.length}):`);
    console.error(missingInEn.join("\n"));
  }
  if (missingUsed.length) {
    console.error(`UI keys missing from dictionaries (${missingUsed.length}):`);
    for (const key of missingUsed) {
      console.error(`${key} -> ${[...usedKeys.get(key)].join(", ")}`);
    }
  }
  process.exit(1);
}

console.log(`i18n OK: ${enKeys.size} dictionary keys, ${usedKeys.size} UI keys checked.`);
