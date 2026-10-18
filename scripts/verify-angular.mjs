// Check that `ngc` emitted Angular partial-compilation metadata, so apps can
// link the component.
import { readFile } from 'node:fs/promises'

const js = await readFile(new URL('../dist/angular/pele.component.js', import.meta.url), 'utf8')
const dts = await readFile(new URL('../dist/angular/pele.component.d.ts', import.meta.url), 'utf8')

if (!js.includes('ɵɵngDeclareFactory') || !js.includes('ɵɵngDeclareComponent')) {
  throw new Error('Angular partial-compilation metadata is missing from dist/angular/pele.component.js')
}
if (!dts.includes('ɵfac:') || !dts.includes('ɵcmp:')) {
  throw new Error('Angular component metadata is missing from dist/angular/pele.component.d.ts')
}

console.log('Angular build verified')
