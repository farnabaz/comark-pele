// happy-dom doesn't do layout, so every element is 0×0. Pele treats a
// zero-width container as hidden and waits to redraw, so give elements a size.
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 600 })
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 400 })
