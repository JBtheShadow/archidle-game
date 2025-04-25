const GRID_COS = Math.cos(Math.PI / 6);
const HEX_SIN = Math.sin(Math.PI / 3);
const HEX_COS = Math.cos(Math.PI / 3);

let cameraOffset = { x: 0, y: 0 };
let cameraZoom = 1;
let MAX_ZOOM = 5;
let MIN_ZOOM = 0.1;
let SCROLL_SENSITIVITY = 0.0005;
let canvas, ctx;

const CoordinateSystem = Object.freeze({
    OFFSET: 1,
    AXIAL: 2,
    CUBE: 3,
    DOUBLED: 4
});

class HexTile {
    constructor(opts) {
        opts = opts || {};
        let x = opts.x || NaN;
        let y = opts.y || NaN;
        let z = opts.z || NaN;
        let system = opts.system || CoordinateSystem.DOUBLED;

        if (system == CoordinateSystem.CUBE) {
            if (isNaN(x) && isNaN(y) && isNaN(z)) {
                console.warn("No cube coordinates informed, using the origin [0,0,0]");
                x = 0;
                y = 0;
            }
            else if (isNaN(x || y) || isNaN(x || z) || isNaN(y || z)) {
                throw Error("Cube coordinates require at least two components out of [x,y,z]");
            }
            else if (x + y + z != 0) {
                throw Error("Invalid cube coordinates, their [x,y,z] components must add up to 0");
            }
            else if (isNaN(x)) {
                x = -y -z;
            }
            else if (isNaN(y)) {
                y = -x -z;
            }
        }
        else {
            x = x || 0;
            y = y || 0;
        }
        
        if (system == CoordinateSystem.DOUBLED) {
            if ((x + y) % 2 != 0) {
                throw Error("Invalid doubled coordinates, their [x,y] components must add up to a multiple of 2");
            }
        }

        this.x = x;
        this.y = y;
        this.system = system;
    }

    get z() {
        if (this.system != CoordinateSystem.CUBE) {
            console.warn("z component only exists for cube coordinates");
            return undefined;
        }

        return -this.x -this.y;
    }
}

function getWidth() {
    return parseInt(document.querySelector("#txtWidth").value);
}

function getHeight() {
    return parseInt(document.querySelector("#txtHeight").value);
}

function getRadius() {
    return parseInt(document.querySelector("#txtRadius").value);
}

function getSpacing() {
    return parseInt(document.querySelector("#txtSpacing").value);
}

function getLabelType() {
    return document.querySelector("[name='labelType'][type='radio']:checked").value;
}

function getFlattening() {
    return parseFloat(document.querySelector("#txtFlattening").value) / 100;
}

function initializeCanvas() {
    canvas = document.querySelector("#canvas");
    ctx = canvas.getContext("2d")

    canvas.width = getWidth();
    canvas.height = getHeight();

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown));
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp));
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove));
    canvas.addEventListener('wheel', (e) => adjustZoom(e.deltaY * SCROLL_SENSITIVITY));
}

function startHexTest() {
    draw();
}

function draw() {

    // Apparently setting the width and height again is *required* for this to work
    canvas.width = getWidth();
    canvas.height = getHeight();

    ctx.translate(getWidth() / 2, getHeight() / 2);
    ctx.scale(cameraZoom, cameraZoom * (1 - getFlattening()));
    ctx.translate(-(getWidth() / 2) + cameraOffset.x, -(getHeight() / 2) + cameraOffset.y);
    ctx.clearRect(0, 0, getWidth(), getHeight());

    drawHexes();

    requestAnimationFrame(draw);
}

// Gets the relevant location from a mouse or single touch event
function getEventLocation(e) {
    if (e.touches && e.touches.length == 1) {
        return { x:e.touches[0].clientX, y: e.touches[0].clientY }
    }
    else if (e.clientX && e.clientY) {
        return { x: e.clientX, y: e.clientY }        
    }
}

let isDragging = false
let dragStart = { x: 0, y: 0 }

function resetZoom() {
    cameraZoom = 1;
}

function resetCamera() {
    cameraOffset = { x: 0, y: 0 };
}

function onPointerDown(e) {
    isDragging = true
    dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
    dragStart.y = getEventLocation(e).y/(cameraZoom * (1 - getFlattening())) - cameraOffset.y
}

function onPointerUp(e) {
    isDragging = false
    initialPinchDistance = null
    lastZoom = cameraZoom
}

function onPointerMove(e) {
    if (isDragging) {
        cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
        cameraOffset.y = getEventLocation(e).y/(cameraZoom * (1 - getFlattening())) - dragStart.y
    }
}

function handleTouch(e, singleTouchHandler) {
    if ( e.touches.length == 1 ) {
        singleTouchHandler(e)
    }
    else if (e.type == "touchmove" && e.touches.length == 2) {
        isDragging = false
        handlePinch(e)
    }
}

let initialPinchDistance = null
let lastZoom = cameraZoom

function handlePinch(e) {
    e.preventDefault()
    
    let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
    
    // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
    let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2
    
    if (initialPinchDistance == null) {
        initialPinchDistance = currentDistance
    }
    else {
        adjustZoom( null, currentDistance/initialPinchDistance )
    }
}

function adjustZoom(zoomAmount, zoomFactor) {
    if (!isDragging) {
        if (zoomAmount) {
            cameraZoom += zoomAmount
        }
        else if (zoomFactor) {
            console.log(zoomFactor)
            cameraZoom = zoomFactor*lastZoom
        }
        
        cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
        cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
        
        console.log(zoomAmount)
    }
}

function distanceToOrigin(xDelta, yDelta) {
    if (yDelta % 2 == 0) {
        if (!xDelta.toFixed(1).endsWith(".0")) {
            return NaN;
        }
    }
    else if (xDelta.toFixed(1).endsWith(".0")) {
        return NaN;
    }

    let result = 0
    let tolerance = Math.abs(yDelta) / 2;
    if (Math.abs(xDelta) <= tolerance) {
        result = Math.abs(yDelta);
    }
    else {
        result = Math.abs(yDelta) + Math.abs(xDelta) - tolerance;
    }

    return result;
}

function drawHexes() {
    let centerX = getWidth() / 2;
    let centerY = getHeight() / 2;
    let radius = getRadius();
    let spacingX = getSpacing();
    let spacingY = spacingX * GRID_COS;
    let labelType = getLabelType();

    let maxDistance = 8;
    for (let yDelta = -maxDistance; yDelta <= maxDistance; yDelta += 1) {
        for (let xDelta = -maxDistance; xDelta <= maxDistance; xDelta += 0.5) {
            let d = distanceToOrigin(xDelta, yDelta);
            if (isNaN(d) || d > maxDistance) {
                continue;
            }

            let cx = centerX + xDelta * spacingX;
            let cy = centerY + yDelta * spacingY;
            let label = "";
            switch (labelType) {
                case "coords":
                    label = `${cx.toFixed(0)},${cy.toFixed(0)}`;
                    break;
                case "offset":
                    label = `${Math.floor(xDelta)},${yDelta}`;
                    break;
                case "double":
                    label = `${xDelta * 2},${yDelta}`;
                    break;
                case "axial":
                    label = `${xDelta - yDelta / 2},${yDelta}`;
                    break;
                case "cube":
                    label = `${xDelta - yDelta / 2},${yDelta},${-xDelta - yDelta / 2}`;
                    break;
            }

            drawHex(cx, cy, radius, label);
        }
    }
}

/**
 * Draws a hex given a canvas and some parameters
 * @param {number} cx x coordinate for the hexagon center
 * @param {number} cy y coordinate for the hexagon center
 * @param {number} r hexagon corner radius
 */
function drawHex(cx, cy, r, label) {
    ctx.beginPath();
    ctx.moveTo(cx + r * HEX_SIN, cy - r * HEX_COS);
    ctx.lineTo(cx, cy - r);
    ctx.lineTo(cx - r * HEX_SIN, cy - r * HEX_COS);
    ctx.lineTo(cx - r * HEX_SIN, cy + r * HEX_COS);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx + r * HEX_SIN, cy + r * HEX_COS);
    ctx.closePath();
    ctx.stroke();

    if (label && label.length) {
        let metrics = ctx.measureText(label);
        ctx.strokeText(label, cx - metrics.width / 2, cy + 3);
    }
}

window.onload = () => {
    initializeCanvas();
};
