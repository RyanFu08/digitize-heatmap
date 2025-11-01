window.sharedData = {};
sharedData.colorMapType = "none";
sharedData.tolerance = 10;
sharedData.logarithmic = false;
sharedData.mask = true;

document.getElementById("uploadButton").addEventListener("click", function () {
    document.getElementById("fileInput").click();
});

document
    .getElementById("fileInput")
    .addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            window.sharedData.uploadedFile = file;
            const fileUploadedEvent = new CustomEvent("fileUploaded", {
                detail: { file },
            });
            document.dispatchEvent(fileUploadedEvent);
            document.getElementById("pageInput").value = 1;
            document.getElementById("toleranceInput").value = 10;
        }
    });

document
    .getElementById("discreteButton")
    .addEventListener("click", function (event) {
        const discreteEvent = new CustomEvent("discrete");
        document.dispatchEvent(discreteEvent);
    });

document.getElementById("next").addEventListener("click", function (event) {
    let page = parseInt(document.getElementById("pageInput").value);
    page++;
    document.getElementById("pageInput").value = page;
    document.dispatchEvent(
        new CustomEvent("pageChanged", { detail: { page } })
    );
});

document.getElementById("prev").addEventListener("click", function (event) {
    let page = parseInt(document.getElementById("pageInput").value);
    page--;
    document.getElementById("pageInput").value = page;
    document.dispatchEvent(
        new CustomEvent("pageChanged", { detail: { page } })
    );
});
document
    .getElementById("keyEndpointsButton")
    .addEventListener("click", function (event) {
        const discreteEvent = new CustomEvent("continuous");
        document.dispatchEvent(discreteEvent);
    });

document
    .getElementById("pageButton")
    .addEventListener("click", function (event) {
        const page = parseInt(document.getElementById("pageInput").value);
        const pageChangedEvent = new CustomEvent("pageChanged", {
            detail: { page },
        });
        document.dispatchEvent(pageChangedEvent);
    });

document
    .getElementById("cropButton")
    .addEventListener("click", function (event) {
        sharedData.crop = true;
        crop = 1;
        const cropEvent = new CustomEvent("crop", { detail: { crop } });
        document.dispatchEvent(cropEvent);
    });

document
    .getElementById("previewButton")
    .addEventListener("click", function (event) {
        if (sharedData.colorMapType === "none") {
            alert("Please select a colormap type first.");
            return;
        }
        generatePreview();
    });

document.getElementById("getData").addEventListener("click", function (event) {
    if (sharedData.colorMapType === "none") {
        alert("Please select a colormap type first.");
        return;
    }
    if (sharedData.colorMapType === "discrete") {
        const discreteDataEvent = new CustomEvent("discreteData");
        document.dispatchEvent(discreteDataEvent);
    }
    if (sharedData.colorMapType === "continuous") {
        const discreteDataEvent = new CustomEvent("discreteData");
        document.dispatchEvent(discreteDataEvent);
    }
});

document
    .getElementById("toleranceInput")
    .addEventListener("change", function (event) {
        sharedData.tolerance = parseInt(
            document.getElementById("toleranceInput").value
        );
    });

document
    .getElementById("toleranceButton")
    .addEventListener("click", function (event) {
        const toleranceValue = parseInt(
            document.getElementById("toleranceInput").value
        );
        if (!isNaN(toleranceValue)) {
            sharedData.tolerance = toleranceValue;
        }
    });

document
    .getElementById("scaleType")
    .addEventListener("click", function (event) {
        sharedData.logarithmic = !sharedData.logarithmic;
        if (sharedData.logarithmic) {
            document.getElementById("scaleType").innerText =
                "Logarithmic Scale";
        } else {
            document.getElementById("scaleType").innerText = "Linear Scale";
        }
    });

document.getElementById("zoomIn").addEventListener("click", function (event) {
    const zoomEvent = new CustomEvent("zoomIn");
    document.dispatchEvent(zoomEvent);
});

document.getElementById("zoomOut").addEventListener("click", function (event) {
    const zoomEvent = new CustomEvent("zoomOut");
    document.dispatchEvent(zoomEvent);
});

document
    .getElementById("maskOrNot")
    .addEventListener("click", function (event) {
        sharedData.mask = !sharedData.mask;
        if (sharedData.mask) {
            document.getElementById("maskOrNot").innerText =
                "Set Undefined to -1";
        } else {
            document.getElementById("maskOrNot").innerText =
                "Interpolate Undefined";
        }
    });

// Function to display the colormap
function displayColormap(colorMap, type) {
    const display = document.getElementById("colormap-display");
    const content = document.getElementById("colormap-content");

    // Clear previous content
    content.innerHTML = "";

    // Convert Map to array and sort by value for better display
    const colorArray = Array.from(colorMap.entries()).sort(
        (a, b) => a[1] - b[1]
    );

    // Create colormap items
    colorArray.forEach(([hex, value]) => {
        const item = document.createElement("div");
        item.className = "colormap-item";

        const swatch = document.createElement("div");
        swatch.className = "color-swatch";
        swatch.style.backgroundColor = hex;

        const valueSpan = document.createElement("span");
        valueSpan.className = "color-value";
        valueSpan.textContent = value.toFixed(3);

        const hexSpan = document.createElement("span");
        hexSpan.className = "color-hex";
        hexSpan.textContent = hex.toUpperCase();

        item.appendChild(swatch);
        item.appendChild(valueSpan);
        item.appendChild(hexSpan);
        content.appendChild(item);
    });

    // Update header to show type
    const header = display.querySelector("h6");
    header.textContent = `Colormap Preview - ${
        type.charAt(0).toUpperCase() + type.slice(1)
    } (${colorArray.length} colors)`;

    // Show the display
    display.style.display = "block";
}

// Function to generate preview
function generatePreview() {
    const canvas = document.getElementById("content");
    const width = canvas.width;
    const height = canvas.height;

    if (width * height > 1000000) {
        alert(
            "Image too large to preview (more than 1 million pixels). Please crop the image first."
        );
        return;
    }

    const previewCanvas = document.getElementById("preview-canvas");
    const previewContext = previewCanvas.getContext("2d");

    // Set preview canvas size to match content canvas
    previewCanvas.width = width;
    previewCanvas.height = height;

    // Get current settings from sharedData
    const tolerance = sharedData.tolerance || 0;
    const useMask = sharedData.mask; // true = use -1, false = interpolate

    // Create 2D array to store values (same logic as getdata.js)
    const array2d = [];
    for (let i = 0; i < height; i++) {
        const row = [];
        for (let j = 0; j < width; j++) {
            const color = getColorAtPosition(j, i);
            const hexval = rgbToHex(color.r, color.g, color.b);

            if (sharedData.colorMap.has(hexval)) {
                row.push(sharedData.colorMap.get(hexval));
            } else {
                let closest = 0;
                let closestDist = Number.MAX_VALUE;
                for (const [key, value] of sharedData.colorMap) {
                    const col = hexToRgb(key);
                    const dist = Math.sqrt(
                        Math.pow(color.r - col.r, 2) +
                            Math.pow(color.g - col.g, 2) +
                            Math.pow(color.b - col.b, 2)
                    );
                    if (dist < closestDist) {
                        closest = value;
                        closestDist = dist;
                    }
                }
                if (closestDist <= tolerance) {
                    row.push(closest);
                } else {
                    row.push(-1); // Undefined
                }
            }
        }
        array2d.push(row);
    }

    // Apply interpolation if mask is false (same as getdata.js)
    if (!useMask) {
        fillClosestValues(array2d, width, height);
    }

    // Create image data for preview
    const imageData = previewContext.createImageData(width, height);

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const value = array2d[i][j];
            let previewColor = { r: 255, g: 255, b: 255 }; // Default white for undefined

            if (value !== -1) {
                // Find the color that corresponds to this value
                for (const [hex, mapValue] of sharedData.colorMap) {
                    if (Math.abs(mapValue - value) < 0.001) {
                        // Close enough match
                        previewColor = hexToRgb(hex);
                        break;
                    }
                }
            }

            const pixelIndex = (i * width + j) * 4;
            imageData.data[pixelIndex] = previewColor.r; // Red
            imageData.data[pixelIndex + 1] = previewColor.g; // Green
            imageData.data[pixelIndex + 2] = previewColor.b; // Blue
            imageData.data[pixelIndex + 3] = 255; // Alpha
        }
    }

    // Draw the preview
    previewContext.putImageData(imageData, 0, 0);

    // Show the preview container
    document.getElementById("preview-container").style.display = "block";
}

// Helper function for hex to RGB conversion
function hexToRgb(hex) {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return { r, g, b };
}

// Helper function for BFS fill (same as getdata.js)
function fillClosestValues(array, width, height) {
    const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
    ];
    const queue = [];

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (array[i][j] !== -1) {
                queue.push([i, j]);
            }
        }
    }

    while (queue.length > 0) {
        const [x, y] = queue.shift();
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (
                nx >= 0 &&
                ny >= 0 &&
                nx < height &&
                ny < width &&
                array[nx][ny] === -1
            ) {
                array[nx][ny] = array[x][y];
                queue.push([nx, ny]);
            }
        }
    }
}
// Custom dialog functions
let valueInputResolve = null

function showValueInputDialog(message = 'Enter the value for the color:') {
  return new Promise((resolve) => {
    valueInputResolve = resolve
    document.querySelector('.dialog-content h6').textContent = message
    document.getElementById('value-input').value = ''
    document.getElementById('value-input-dialog').style.display = 'flex'
    document.getElementById('value-input').focus()
  })
}

function confirmValueInput() {
  const value = parseFloat(document.getElementById('value-input').value)
  document.getElementById('value-input-dialog').style.display = 'none'
  if (valueInputResolve) {
    valueInputResolve(isNaN(value) ? null : value)
    valueInputResolve = null
  }
}

function cancelValueInput() {
  document.getElementById('value-input-dialog').style.display = 'none'
  if (valueInputResolve) {
    valueInputResolve(null)
    valueInputResolve = null
  }
}

// Handle Enter key in dialog
document.addEventListener('DOMContentLoaded', function() {
  const valueInput = document.getElementById('value-input')
  if (valueInput) {
    valueInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        confirmValueInput()
      }
    })
  }
})