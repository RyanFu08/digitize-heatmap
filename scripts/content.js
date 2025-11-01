pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js'
let scale = 1
document.addEventListener('fileUploaded', function (event) {
  const file = event.detail.file
  const reader = new FileReader()

  reader.onload = function (e) {
    const typedarray = new Uint8Array(e.target.result)
    pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
      window.sharedData.pdfDoc = pdf // Store the PDF document in sharedData
      renderPage(1) // Render the first page by default
    })
  }

  reader.readAsArrayBuffer(file)
})

document.addEventListener('pageChanged', function (event) {
  const pageNumber = event.detail.page
  renderPage(pageNumber)
})

function renderPage (pageNumber) {
  const pdfDoc = window.sharedData.pdfDoc
  if (pdfDoc) {
    pdfDoc.getPage(pageNumber).then(function (page) {
      const scale = 1.5
      const viewport = page.getViewport({ scale })

      const canvas = document.getElementById('content')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      const canvas1 = document.getElementById('cursor-highlight')
      const canvas2 = document.getElementById('highlight-points')
      canvas1.height = viewport.height
      canvas1.width = viewport.width
      canvas2.height = viewport.height
      canvas2.width = viewport.width

      const renderContext = {
        canvasContext: context,
        viewport
      }

      page.render(renderContext)
      setupMouseTracking(canvas)
      updateCanvasContainerHeight()
    }).catch(function (error) {
      console.error('Error rendering page:', error)
    })
  }
}

function setupMouseTracking (canvas) {
  const nearCursorCanvas = document.getElementById('near-cursor')
  const nearCursorContext = nearCursorCanvas.getContext('2d')

  const highlightCanvas = document.getElementById('cursor-highlight')

  highlightCanvas.addEventListener('mousemove', function (event) {
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / scale
    const y = (event.clientY - rect.top) / scale

    // Calculate the top-left corner of the 20x20 pixel area centered around the cursor
    const startX = Math.max(0, x - 10)
    const startY = Math.max(0, y - 10)

    // Ensure the area is within the canvas boundaries
    const width = (x - 10 < 0 || x + 10 > canvas.width) ? Math.min(20, canvas.width - startX) : 20
    const height = (y - 10 < 0 || y + 10 > canvas.height) ? Math.min(20, canvas.height - startY) : 20

    // Get the image data for the 20x20 pixel area
    const context = canvas.getContext('2d')
    const imageData = context.getImageData(startX, startY, width, height)

    // Clear the near-cursor canvas
    nearCursorContext.clearRect(0, 0, nearCursorCanvas.width, nearCursorCanvas.height)

    // Draw the zoomed-in image data on the near-cursor canvas
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const index = (i * width + j) * 4
        const r = imageData.data[index]
        const g = imageData.data[index + 1]
        const b = imageData.data[index + 2]
        const a = imageData.data[index + 3] / 255

        nearCursorContext.fillStyle = `rgba(${r},${g},${b},${a})`
        nearCursorContext.fillRect(j * 10, i * 10, 10, 10) // Scale each pixel to 10x10
      }
    }

    // Draw the red crosshair in the center of the near-cursor canvas
    nearCursorContext.strokeStyle = 'red'
    nearCursorContext.lineWidth = 2
    nearCursorContext.beginPath()
    nearCursorContext.moveTo(0, 100) // Horizontal line
    nearCursorContext.lineTo(200, 100)
    nearCursorContext.moveTo(100, 0) // Vertical line
    nearCursorContext.lineTo(100, 200)
    nearCursorContext.stroke()
  })
}

function cropCanvas (startX, startY, endX, endY) {
  const canvas = document.getElementById('content')
  const context = canvas.getContext('2d')

  // Calculate top-left and bottom-right corners from any two points
  const cropStartX = Math.min(startX, endX)
  const cropStartY = Math.min(startY, endY)
  const cropEndX = Math.max(startX, endX)
  const cropEndY = Math.max(startY, endY)

  // Calculate width and height of the cropped area
  const cropWidth = cropEndX - cropStartX
  const cropHeight = cropEndY - cropStartY

  // Get the image data for the cropped area
  const imageData = context.getImageData(cropStartX, cropStartY, cropWidth, cropHeight)

  // Create a new canvas for the cropped area
  const croppedCanvas = document.createElement('canvas')
  const croppedContext = croppedCanvas.getContext('2d')
  croppedCanvas.width = cropWidth
  croppedCanvas.height = cropHeight

  const canvas1 = document.getElementById('cursor-highlight')
  const canvas2 = document.getElementById('highlight-points')
  canvas1.height = cropHeight
  canvas1.width = cropWidth
  canvas2.height = cropHeight
  canvas2.width = cropWidth

  // Put the cropped image data onto the new canvas
  croppedContext.putImageData(imageData, 0, 0)

  // Replace the content of the original canvas with the cropped canvas
  canvas.width = cropWidth
  canvas.height = cropHeight
  context.drawImage(croppedCanvas, 0, 0)
  updateCanvasContainerHeight()
}

function getColorAtPosition (x, y) {
  console.log(x, y)
  const canvas = document.getElementById('content')
  const context = canvas.getContext('2d')
  const imageData = context.getImageData(x, y, 1, 1)
  const r = imageData.data[0]
  const g = imageData.data[1]
  const b = imageData.data[2]
  return { r, g, b }
}

document.addEventListener('zoomIn', function (event) {
  // update the css to be 10% bigger
  const canvas = document.getElementById('content')
  scale += 0.1
  canvas.style.transform = `scale(${scale})`
  const canvas1 = document.getElementById('cursor-highlight')
  canvas1.style.transform = `scale(${scale})`
  const canvas2 = document.getElementById('highlight-points')
  canvas2.style.transform = `scale(${scale})`
  updateCanvasContainerHeight()
})

document.addEventListener('zoomOut', function (event) {
  // update the css to be 10% smaller
  const canvas = document.getElementById('content')
  scale -= 0.1
  canvas.style.transform = `scale(${scale})`
  const canvas1 = document.getElementById('cursor-highlight')
  canvas1.style.transform = `scale(${scale})`
  const canvas2 = document.getElementById('highlight-points')
  canvas2.style.transform = `scale(${scale})`
  updateCanvasContainerHeight()
})

function updateCanvasContainerHeight() {
  const canvas = document.getElementById('content')
  const container = document.querySelector('.canvas-stack-container')
  if (canvas && container) {
    // Set container height to match the canvas height (accounting for scale)
    const canvasHeight = canvas.height * scale
    container.style.height = canvasHeight + 'px'
  }
}
