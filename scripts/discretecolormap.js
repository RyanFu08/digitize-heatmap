document.addEventListener('discrete', async () => {
  const amt = parseInt(document.getElementById('discreteInput').value)
  const colorMap = new Map()
  for (let i = 0; i < amt; i++) {
    while (true) {
      const pt = await getPoint()
      const x = pt.x; const y = pt.y
      console.log(x, y)
      const col = getColorAtPosition(x, y)
      const colhex = rgbToHex(col.r, col.g, col.b)
      if (!colorMap.has(colhex)) {
        while (true) {
          const val = await showValueInputDialog('Enter the value for the color:')
          if (val !== null && !isNaN(val)) {
            colorMap.set(colhex, val)
            console.log(colorMap)
            break
          }
          alert('Invalid input. Please enter a valid number (decimal allowed).')
        }
        break
      } else {
        alert('Color already selected. Please select another color.')
      }
    }
  }
  sharedData.colorMap = colorMap
  sharedData.colorMapType = 'discrete'
  document.getElementById('getData').innerText = 'Download Data (Discrete)'
  displayColormap(colorMap, 'discrete')
  alert('Discrete colormap created successfully! Use Preview to verify, then Download Data.')
})

function componentToHex (c) {
  const hex = c.toString(16)
  return hex.length == 1 ? '0' + hex : hex
}

function rgbToHex (r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
}
