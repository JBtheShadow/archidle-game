const GRID_COS = Math.cos(Math.PI / 6);
const HEX_SIN = Math.sin(Math.PI / 3);
const HEX_COS = Math.cos(Math.PI / 3);

let cameraOffset = { x: 0, y: 0 };
let cameraZoom = 1;
let MAX_ZOOM = 5;
let MIN_ZOOM = 0.1;
let SCROLL_SENSITIVITY = 0.0005;

function startHexTest() {
    let testArea = document.querySelector("#testArea");
    testArea.innerHTML = "";

    let canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.width = 800;
    canvas.height = 600;
    testArea.appendChild(canvas);

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown));
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp));
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove));
    canvas.addEventListener('wheel', (e) => adjustZoom(e.deltaY * SCROLL_SENSITIVITY));

    let ctx = canvas.getContext("2d");
    draw(canvas, ctx);
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 */
function draw(canvas, ctx) {

    // Apparently setting the width and height again is *required* for this to work
    canvas.width = 800;
    canvas.height = 600;

    ctx.translate(400, 300);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-400 + cameraOffset.x, -300 + cameraOffset.y);
    ctx.clearRect(0, 0, 800, 600);

    drawHexes(ctx);

    requestAnimationFrame(() => draw(canvas, ctx));
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
    dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
}

function onPointerUp(e) {
    isDragging = false
    initialPinchDistance = null
    lastZoom = cameraZoom
}

function onPointerMove(e) {
    if (isDragging) {
        cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
        cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
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

/**
 * Test to draw several hexagons
 * @param {CanvasRenderingContext2D} ctx 
 */
function drawHexes(ctx) {
    let centerX = 400;
    let centerY = 300;
    let radius = 25;
    let spacingX = 50;
    let spacingY = spacingX * GRID_COS;
    
    drawHex(ctx, centerX, centerY, radius);

    drawHex(ctx, centerX + spacingX / 2, centerY - spacingY, radius);
    drawHex(ctx, centerX - spacingX / 2, centerY - spacingY, radius);
    drawHex(ctx, centerX - spacingX, centerY, radius);
    drawHex(ctx, centerX - spacingX / 2, centerY + spacingY, radius);
    drawHex(ctx, centerX + spacingX / 2, centerY + spacingY, radius);
    drawHex(ctx, centerX + spacingX, centerY, radius);

    drawHex(ctx, centerX + spacingX, centerY - 2 * spacingY, radius);
    drawHex(ctx, centerX, centerY - 2 * spacingY, radius);
    drawHex(ctx, centerX - spacingX, centerY - 2 * spacingY, radius);
    drawHex(ctx, centerX - 1.5 * spacingX, centerY - spacingY, radius);
    drawHex(ctx, centerX - 2 * spacingX, centerY, radius);
    drawHex(ctx, centerX - 1.5 * spacingX, centerY + spacingY, radius);
    drawHex(ctx, centerX - spacingX, centerY + 2 * spacingY, radius);
    drawHex(ctx, centerX, centerY + 2 * spacingY, radius);
    drawHex(ctx, centerX + spacingX, centerY + 2 * spacingY, radius);
    drawHex(ctx, centerX + 1.5 * spacingX, centerY + spacingY, radius);
    drawHex(ctx, centerX + 2 * spacingX, centerY, radius);
    drawHex(ctx, centerX + 1.5 * spacingX, centerY - spacingY, radius);

    let distanceToOrigin = function(xMult, yMult) {
        if (yMult % 2 == 0) {
            if (!xMult.toFixed(1).endsWith(".0")) {
                return NaN;
            }
        }
        else if (xMult.toFixed(1).endsWith(".0")) {
            return NaN;
        }

        let result = 0
        let tolerance = Math.abs(yMult) / 2;
        if (Math.abs(xMult) <= tolerance) {
            result = Math.abs(yMult);
        }
        else {
            result = Math.abs(yMult) + Math.abs(xMult) - tolerance;
        }

        return result;
    };

    let bounds = 8;
    let toDraw = [3, 4, 5, 6, 7, 8];
    for (let yDelta = -bounds; yDelta <= bounds; yDelta += 1) {
        for (let xDelta = -bounds; xDelta <= bounds; xDelta += 0.5) {
            let d = distanceToOrigin(xDelta, yDelta);
            if (!toDraw.includes(d)) {
                continue;
            }

            drawHex(ctx, centerX + xDelta * spacingX, centerY + yDelta * spacingY, radius);
        }
    }
}

/**
 * Draws a hex given a canvas and some parameters
 * @param {CanvasRenderingContext2D} ctx canvas context
 * @param {number} cx x coordinate for the hexagon center
 * @param {number} cy y coordinate for the hexagon center
 * @param {number} r hexagon corner radius
 */
function drawHex(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx + r * HEX_SIN, cy - r * HEX_COS);
    ctx.lineTo(cx, cy - r);
    ctx.lineTo(cx - r * HEX_SIN, cy - r * HEX_COS);
    ctx.lineTo(cx - r * HEX_SIN, cy + r * HEX_COS);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx + r * HEX_SIN, cy + r * HEX_COS);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeText(`${cx.toFixed(0)},${cy.toFixed(0)}`, cx - r + 7, cy + 2);
}

function hexTestTwo() {
    let testArea = document.querySelector("#testArea");
    testArea.innerHTML = "";

    let canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.width = 1000;
    canvas.height = 700;
    testArea.appendChild(canvas);

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown));
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp));
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove));
    canvas.addEventListener('wheel', (e) => adjustZoom(e.deltaY * SCROLL_SENSITIVITY));

    let ctx = canvas.getContext("2d");
    draw2(canvas, ctx);
}

function draw2(canvas, ctx) {
    canvas.width = 1000;
    canvas.height = 700;

    ctx.translate(500, 350);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-500 + cameraOffset.x, -350 + cameraOffset.y);
    ctx.clearRect(0, 0, 1000, 700);

    drawMap(ctx);

    requestAnimationFrame(() => draw2(canvas, ctx));
}

let tiles = [
    { x: 0, y: 0 },
    { x: -1, y: 1 },
    { x: 1, y: -3 },
    { x: 2, y: 2 }
];

function drawMap(ctx) {
    let sorted = tiles.toSorted((a, b) => a.y - b.y);
    for (let tile of sorted) {
        drawTile(ctx, tile);
    }
}

function drawTile(ctx, tile) {
    let centerX = 400;
    let centerY = 300;
    let radius = 25;
    let spacingX = 50;

    ctx.beginPath();
    ctx.moveTo(cx + r * HEX_SIN, cy - r * HEX_COS);
    ctx.lineTo(cx, cy - r);
    ctx.lineTo(cx - r * HEX_SIN, cy - r * HEX_COS);
    ctx.lineTo(cx - r * HEX_SIN, cy + r * HEX_COS);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx + r * HEX_SIN, cy + r * HEX_COS);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeText(`${cx.toFixed(0)},${cy.toFixed(0)}`, cx - r + 7, cy + 2);
}