document.addEventListener('continuous', async () => {
  const pt1 = await getPoint()
  const colorMap = new Map()
  const lo = await showValueInputDialog('Enter the value for the first color:')
  if (lo === null) return
  const pt2 = await getPoint()
  const hi = await showValueInputDialog('Enter the value for the second color:')
  if (hi === null) return

  const logarithmic = sharedData.logarithmic

  // Calculate the differences in x and y
  const dx = pt2.x - pt1.x
  const dy = pt2.y - pt1.y

  // Determine which axis has more points and use that for iteration
  const steps = Math.max(Math.abs(dx), Math.abs(dy))

  for (let step = 0; step <= steps; step++) {
    const t = step / steps
    const x = pt1.x + t * dx
    const y = pt1.y + t * dy
    const col = getColorAtPosition(x, y)
    const colhex = rgbToHex(col.r, col.g, col.b)
    if (!colorMap.has(colhex)) {
      let colval = null
      if (logarithmic) {
        // Compute logarithmic interpolation
        colval = Math.exp(t * (Math.log(hi) - Math.log(lo)) + Math.log(lo))
      } else {
        // Compute linear interpolation
        colval = t * (hi - lo) + lo
      }
      colorMap.set(colhex, colval)
    }
  }

  sharedData.colorMap = colorMap
  sharedData.colorMapType = 'continuous'
  document.getElementById('getData').innerText = 'Download Data (Continuous)'
  displayColormap(colorMap, 'continuous')
})

function componentToHex (c) {
  const hex = c.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}

function rgbToHex (r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
}
