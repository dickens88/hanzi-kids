// Copies stroke-order data for dictionary characters into public/data/strokes.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const charDir = path.join(root, 'public/data/chars')
const srcDir = path.join(root, 'node_modules/hanzi-writer-data')
const outDir = path.join(root, 'public/data/strokes')

fs.mkdirSync(outDir, { recursive: true })
const files = fs.readdirSync(charDir)
for (const file of files) {
  const char = String.fromCodePoint(parseInt(path.basename(file, '.json'), 16))
  fs.copyFileSync(path.join(srcDir, `${char}.json`), path.join(outDir, file))
}
console.log(`copied stroke data for ${files.length} characters`)
