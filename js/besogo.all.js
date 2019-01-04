(function() {
'use strict';
var besogo = window.besogo = window.besogo || {}; 
besogo.VERSION = '0.0.2-alpha';

besogo.create = function(container, options) {
    var editor, 
        resizer, 
        boardDiv, 
        panelsDiv, 
        makers = { 
            control: besogo.makeControlPanel,
            names: besogo.makeNamesPanel,
            comment: besogo.makeCommentPanel,
            tool: besogo.makeToolPanel,
            tree: besogo.makeTreePanel,
            file: besogo.makeFilePanel
        },
        insideText = container.textContent || container.innerText || '',
        i, panelName; 

    container.className += ' besogo-container'; 

    
    options = options || {}; 
    options.size = besogo.parseSize(options.size || 19);
    options.coord = options.coord || 'none';
    options.tool = options.tool || 'auto';
    if (options.panels === '') {
        options.panels = [];
    }
    options.panels = options.panels || 'control+names+comment+tool+tree+file';
    if (typeof options.panels === 'string') {
        options.panels = options.panels.split('+');
    }
    options.path = options.path || '';
    if (options.shadows === undefined) {
        options.shadows = 'auto';
    } else if (options.shadows === 'off') {
        options.shadows = false;
    }

    
    editor = besogo.makeEditor(options.size.x, options.size.y);
    besogo.editor = editor;
    editor.setTool(options.tool);
    editor.setCoordStyle(options.coord);
    if (options.realstones) { 
        editor.REAL_STONES = true;
        editor.SHADOWS = options.shadows;
    } else { 
        editor.SHADOWS = (options.shadows && options.shadows !== 'auto');
    }

    if (!options.nokeys) { 
        addKeypressHandler(container, editor);
    }

    if (options.sgf) { 
        try {
            fetchParseLoad(options.sgf, editor, options.path);
        } catch(e) {
            
        }
    } else if (insideText.match(/\s*\(\s*;/)) { 
        parseAndLoad(insideText, editor);
        navigatePath(editor, options.path); 
    }

    if (typeof options.variants === 'number' || typeof options.variants === 'string') {
        editor.setVariantStyle(+options.variants); 
    }

    while (container.firstChild) { 
        container.removeChild(container.firstChild);
    }

    boardDiv = makeDiv('besogo-board'); 
    besogo.makeBoardDisplay(boardDiv, editor); 

    if (!options.nowheel) { 
        addWheelHandler(boardDiv, editor);
    }

    if (options.panels.length > 0) { 
        panelsDiv = makeDiv('besogo-panels');
        for (i = 0; i < options.panels.length; i++) {
            panelName = options.panels[i];
            if (makers[panelName]) { 
                makers[panelName](makeDiv('besogo-' + panelName, panelsDiv), editor);
            }
        }
        if (!panelsDiv.firstChild) { 
            container.removeChild(panelsDiv); 
            panelsDiv = false; 
        }
    }

    options.resize = options.resize || 'auto';
    if (options.resize === 'auto') { 
        resizer = function() {
            var windowHeight = window.innerHeight, 
                
                parentWidth = parseFloat(getComputedStyle(container.parentElement).width),
                maxWidth = +(options.maxwidth || -1),
                orientation = options.orient || 'auto',

                portraitRatio = +(options.portratio || 200) / 100,
                landscapeRatio = +(options.landratio || 200) / 100,
                minPanelsWidth = +(options.minpanelswidth || 350),
                minPanelsHeight = +(options.minpanelsheight || 400),
                minLandscapeWidth = +(options.transwidth || 600),

                
                width = (maxWidth > 0 && maxWidth < parentWidth) ? maxWidth : parentWidth,
                height; 

            
            if (orientation !== 'portrait' && orientation !== 'landscape') {
                if (width < minLandscapeWidth || (orientation === 'view' && width < windowHeight)) {
                    orientation = 'portrait';
                } else {
                    orientation = 'landscape';
                }
            }

            if (orientation === 'portrait') { 
                if (!isNaN(portraitRatio)) {
                    height = portraitRatio * width;
                    if (panelsDiv) {
                        height = (height - width < minPanelsHeight) ? width + minPanelsHeight : height;
                    }
                } 
            } else if (orientation === 'landscape') { 
                if (!panelsDiv) { 
                    height = width; 
                } else if (isNaN(landscapeRatio)) {
                    height = windowHeight;
                } else { 
                    height = width / landscapeRatio;
                }

                if (panelsDiv) {
                    
                    height = (width < height + minPanelsWidth) ? (width - minPanelsWidth) : height;
                }
            }

            setDimensions(width, height);
            container.style.width = width + 'px';
        };
        window.addEventListener("resize", resizer);
        resizer(); 
    } else if (options.resize === 'fixed') {
        setDimensions(container.clientWidth, container.clientHeight);
    }

    
    function setDimensions(width, height) {
        if (height && width > height) { 
            container.style['flex-direction'] = 'row';
            boardDiv.style.height = height + 'px';
            boardDiv.style.width = height + 'px';
            if (panelsDiv) {
                panelsDiv.style.height = height + 'px';
                panelsDiv.style.width = (width - height) + 'px';
            }
        } else { 
            container.style['flex-direction'] = 'column';
            boardDiv.style.height = width + 'px';
            boardDiv.style.width = width + 'px';
            if (panelsDiv) {
                if (height) { 
                    panelsDiv.style.height = (height - width) + 'px';
                }
                panelsDiv.style.width = width + 'px';
            }
        }
    }

    
    function makeDiv(className, parent) {
        var div = document.createElement("div");
        if (className) {
            div.className = className;
        }
        parent = parent || container;
        parent.appendChild(div);
        return div;
    }
}; 


besogo.parseSize = function(input) {
    var matches,
        sizeX,
        sizeY;

    input = (input + '').replace(/\s/g, ''); 

    matches = input.match(/^(\d+):(\d+)$/); 
    if (matches) { 
        sizeX = +matches[1]; 
        sizeY = +matches[2];
    } else if (input.match(/^\d+$/)) { 
        sizeX = +input; 
        sizeY = +input; 
    } else { 
        sizeX = sizeY = 19; 
    }
    if (sizeX > 52 || sizeX < 1 || sizeY > 52 || sizeY < 1) {
        sizeX = sizeY = 19; 
    }

    return { x: sizeX, y: sizeY };
};


besogo.autoInit = function() {
    var allDivs = document.getElementsByTagName('div'), 
        targetDivs = [], 
        options, 
        i, j, attrs; 

    for (i = 0; i < allDivs.length; i++) { 
        if ( (hasClass(allDivs[i], 'besogo-editor') || 
              hasClass(allDivs[i], 'besogo-viewer') ||
              hasClass(allDivs[i], 'besogo-diagram')) &&
             !hasClass(allDivs[i], 'besogo-container') ) { 
                targetDivs.push(allDivs[i]);
        }
    }

    for (i = 0; i < targetDivs.length; i++) { 
        options = {}; 
        if (hasClass(targetDivs[i], 'besogo-editor')) {
            options.panels = ['control', 'names', 'comment', 'tool', 'tree', 'file'];
            options.tool = 'auto';
        } else if (hasClass(targetDivs[i], 'besogo-viewer')) {
            options.panels = ['control', 'names', 'comment'];
            options.tool = 'navOnly';
        } else if (hasClass(targetDivs[i], 'besogo-diagram')) {
            options.panels = [];
            options.tool = 'navOnly';
        }

        attrs = targetDivs[i].attributes;
        for (j = 0; j < attrs.length; j++) { 
            options[attrs[j].name] = attrs[j].value;
        }
        besogo.create(targetDivs[i], options);
    }

    function hasClass(element, str) {
        return (element.className.split(' ').indexOf(str) !== -1);
    }
};


function addKeypressHandler(container, editor) {
    if (!container.getAttribute('tabindex')) {
        container.setAttribute('tabindex', '0'); 
    }

    container.addEventListener('keydown', function(evt) {
        evt = evt || window.event;
        switch (evt.keyCode) {
            case 33: 
                editor.prevNode(10);
                break;
            case 34: 
                editor.nextNode(10);
                break;
            case 35: 
                editor.nextNode(-1);
                break;
            case 36: 
                editor.prevNode(-1);
                break;
            case 37: 
                editor.prevNode(1);
                break;
            case 38: 
                editor.nextSibling(-1);
                break;
            case 39: 
                editor.nextNode(1);
                break;
            case 40: 
                editor.nextSibling(1);
                break;
            case 46: 
                editor.cutCurrent();
                break;
        } 
        if (evt.keyCode >= 33 && evt.keyCode <= 40) {
            evt.preventDefault(); 
        }
    }); 
} 


function addWheelHandler(boardDiv, editor) {
    boardDiv.addEventListener('wheel', function(evt) {
        evt = evt || window.event;
        if (evt.deltaY > 0) {
            editor.nextNode(1);
            evt.preventDefault();
        } else if (evt.deltaY < 0) {
            editor.prevNode(1);
            evt.preventDefault();
        }
    });
}


function parseAndLoad(text, editor) {
    var sgf;
    try {
        sgf = besogo.parseSgf(text);
    } catch (error) {
        return; 
    }
    besogo.loadSgf(sgf, editor);
}


function fetchParseLoad(url, editor, path) {
    var http = new XMLHttpRequest();

    http.onreadystatechange = function() {
        if (http.readyState === 4 && http.status === 200) { 
            parseAndLoad(http.responseText, editor);
            navigatePath(editor, path);
        }
    };
    http.overrideMimeType('text/plain'); 
    http.open("GET", url, true); 
    http.send();
}

function navigatePath(editor, path) {
    var subPaths,
        i, j; 

    path = path.split(/[Nn]+/); 
    for (i = 0; i < path.length; i++) {
        subPaths = path[i].split(/[Bb]+/); 
        executeMoves(subPaths[0], false); 
        for (j = 1; j < subPaths.length; j++) { 
            executeMoves(subPaths[j], true); 
        }
    }

    function executeMoves(part, branch) {
        var i;
        part = part.split(/\D+/); 
        for (i = 0; i < part.length; i++) {
            if (part[i]) { 
                if (branch) { 
                    if (editor.getCurrent().children.length) {
                        editor.nextNode(1);
                        editor.nextSibling(part[i] - 1);
                    }
                } else { 
                    editor.nextNode(+part[i]); 
                }
            }
        }
    }
}

})(); 
besogo.makeBoardDisplay = function(container, editor) {
    'use strict';
    var CELL_SIZE = 88, 
        COORD_MARGIN = 75, 
        EXTRA_MARGIN = 6, 
        BOARD_MARGIN, 

        
        sizeX = editor.getCurrent().getSize().x,
        sizeY = editor.getCurrent().getSize().y,

        svg, 
        stoneGroup, 
        markupGroup, 
        hoverGroup, 
        markupLayer, 
        hoverLayer, 

        randIndex, 

        TOUCH_FLAG = false; 

    initializeBoard(editor.getCoordStyle()); 
    container.appendChild(svg); 
    editor.addListener(update); 
    redrawAll(editor.getCurrent()); 

    
    container.addEventListener('touchstart', setTouchFlag);

    
    function setTouchFlag () {
        TOUCH_FLAG = true; 
        hoverLayer = []; 
        svg.removeChild(hoverGroup); 
        
        container.removeEventListener('touchstart', setTouchFlag);
    }

    
    function initializeBoard(coord) {
        drawBoard(coord); 

        stoneGroup = besogo.svgEl("g");
        markupGroup = besogo.svgEl("g");

        svg.appendChild(stoneGroup); 
        svg.appendChild(markupGroup); 

        if (!TOUCH_FLAG) {
            hoverGroup = besogo.svgEl("g");
            svg.appendChild(hoverGroup);
        }

        addEventTargets(); 

        if (editor.REAL_STONES) { 
            randomizeIndex();
        }
    }

    
    function update(msg) {
        var current = editor.getCurrent(),
            currentSize = current.getSize(),
            reinit = false, 
            oldSvg = svg;

        
        if (currentSize.x !== sizeX || currentSize.y !== sizeY || msg.coord) {
            sizeX = currentSize.x;
            sizeY = currentSize.y;
            initializeBoard(msg.coord || editor.getCoordStyle()); 
            container.replaceChild(svg, oldSvg);
            reinit = true; 
        }

        
        if (reinit || msg.navChange || msg.stoneChange) {
            redrawStones(current);
            redrawMarkup(current);
            redrawHover(current);
        } else if (msg.markupChange || msg.treeChange) {
            redrawMarkup(current);
            redrawHover(current);
        } else if (msg.tool || msg.label) {
            redrawHover(current);
        }
    }

    function redrawAll(current) {
        redrawStones(current);
        redrawMarkup(current);
        redrawHover(current);
    }

    
    function drawBoard(coord) {
        var boardWidth,
            boardHeight,
            string = "", 
            i; 

        BOARD_MARGIN = (coord === 'none' ? 0 : COORD_MARGIN) + EXTRA_MARGIN;
        boardWidth = 2*BOARD_MARGIN + sizeX*CELL_SIZE;
        boardHeight = 2*BOARD_MARGIN + sizeY*CELL_SIZE;

        svg = besogo.svgEl("svg", { 
            width: "100%",
            height: "100%",
            viewBox: "0 0 " + boardWidth + " " + boardHeight
        });

        svg.appendChild(besogo.svgEl("rect", { 
            width: boardWidth,
            height: boardHeight,
            'class': 'besogo-svg-board'
        }) );

        svg.appendChild(besogo.svgEl("rect", { 
            width: CELL_SIZE*(sizeX - 1),
            height: CELL_SIZE*(sizeY - 1),
            x: svgPos(1),
            y: svgPos(1),
            'class': 'besogo-svg-lines'
        }) );

        for (i = 2; i <= (sizeY - 1); i++) { 
            string += "M" + svgPos(1) + "," + svgPos(i) + "h" + CELL_SIZE*(sizeX - 1);
        }
        for (i = 2; i <= (sizeX - 1); i++) { 
            string += "M" + svgPos(i) + "," + svgPos(1) + "v" + CELL_SIZE*(sizeY - 1);
        }
        svg.appendChild( besogo.svgEl("path", { 
            d: string,
            'class': 'besogo-svg-lines'
        }) );

        drawHoshi(); 
        if (coord !== 'none') {
            drawCoords(coord); 
        }
    }

    
    function drawCoords(coord) {
        var labels = besogo.coord[coord](sizeX, sizeY),
            labelXa = labels.x, 
            labelXb = labels.xb || labels.x, 
            labelYa = labels.y, 
            labelYb = labels.yb || labels.y, 
            shift = COORD_MARGIN + 10,
            i, x, y; 

        for (i = 1; i <= sizeX; i++) { 
            x = svgPos(i);
            drawCoordLabel(x, svgPos(1) - shift, labelXa[i]);
            drawCoordLabel(x, svgPos(sizeY) + shift, labelXb[i]);
        }

        for (i = 1; i <= sizeY; i++) { 
            y = svgPos(i);
            drawCoordLabel(svgPos(1) - shift, y, labelYa[i]);
            drawCoordLabel(svgPos(sizeX) + shift, y, labelYb[i]);
        }

        function drawCoordLabel(x, y, label) {
            var element = besogo.svgEl("text", {
                x: x,
                y: y,
                dy: ".65ex", 
                "font-size": 32,
                "text-anchor": "middle", 
                "font-family": "Helvetica, Arial, sans-serif",
                fill: 'black'
            });
            element.appendChild( document.createTextNode(label) );
            svg.appendChild(element);
        }
    }

    
    function drawHoshi() {
        var cx, cy, 
            pathStr = ""; 

        if (sizeX % 2 && sizeY % 2) { 
            cx = (sizeX - 1)/2 + 1; 
            cy = (sizeY - 1)/2 + 1;
            drawStar(cx, cy);

            if (sizeX >= 17 && sizeY >= 17) { 
                drawStar(4, cy);
                drawStar(sizeX - 3, cy);
                drawStar(cx, 4);
                drawStar(cx, sizeY - 3);
            }
        }

        if (sizeX >= 11 && sizeY >= 11) { 
            drawStar(4, 4);
            drawStar(4, sizeY - 3);
            drawStar(sizeX - 3, 4);
            drawStar(sizeX - 3, sizeY - 3);
        } else if (sizeX >= 8 && sizeY >= 8) { 
            drawStar(3, 3);
            drawStar(3, sizeY - 2);
            drawStar(sizeX - 2, 3);
            drawStar(sizeX - 2, sizeY - 2);
        } 

        if (pathStr) { 
            svg.appendChild( besogo.svgEl('path', { 
                d: pathStr, 
                'stroke-linecap': 'round', 
                'class': 'besogo-svg-hoshi'
            }) );
        }

        function drawStar(i, j) { 
            pathStr += "M" + svgPos(i) + ',' + svgPos(j) + 'l0,0'; 
        }
    }

    
    function randomizeIndex() {
        var maxIndex = besogo.BLACK_STONES * besogo.WHITE_STONES,
            i, j;

        randIndex = [];
        for (i = 1; i <= sizeX; i++) {
            for (j = 1; j <= sizeY; j++) {
                randIndex[fromXY(i, j)] = Math.floor(Math.random() * maxIndex);
            }
        }
    }

    
    function addEventTargets() {
        var element,
            i, j;

        for (i = 1; i <= sizeX; i++) {
            for (j = 1; j <= sizeY; j++) {
                element = besogo.svgEl("rect", { 
                    x: svgPos(i) - CELL_SIZE/2,
                    y: svgPos(j) - CELL_SIZE/2,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    opacity: 0
                });

                
                element.addEventListener("click", handleClick(i, j));

                if (!TOUCH_FLAG) { 
                    element.addEventListener("mouseover", handleOver(i, j));
                    element.addEventListener("mouseout", handleOut(i, j));
                }

                svg.appendChild(element);
            }
        }
    }

    function handleClick(i, j) { 
        return function(event) {
            
            editor.click(i, j, event.ctrlKey, event.shiftKey);
            if(!TOUCH_FLAG) {
                (handleOver(i, j))(); 
            }
        };
    }
    function handleOver(i, j) { 
        return function() {
            var element = hoverLayer[ fromXY(i, j) ];
            if (element) { 
                element.setAttribute('visibility', 'visible');
            }
        };
    }
    function handleOut(i, j) { 
        return function() {
            var element = hoverLayer[ fromXY(i, j) ];
            if (element) { 
                element.setAttribute('visibility', 'hidden');
            }
        };
    }

    
    function redrawStones(current) {
        var group = besogo.svgEl("g"), 
            shadowGroup, 
            i, j, x, y, color; 

        if (editor.SHADOWS) { 
            shadowGroup = besogo.svgShadowGroup();
            group.appendChild(shadowGroup);
        }

        for (i = 1; i <= sizeX; i++) {
            for (j = 1; j <= sizeY; j++) {
                color = current.getStone(i, j);
                if (color) {
                    x = svgPos(i);
                    y = svgPos(j);

                    if (editor.REAL_STONES) { 
                        group.appendChild(besogo.realStone(x, y, color, randIndex[fromXY(i, j)]));
                    } else { 
                        group.appendChild(besogo.svgStone(x, y, color));
                    }

                    if (editor.SHADOWS) { 
                        shadowGroup.appendChild(besogo.svgShadow(x - 2, y - 4));
                        shadowGroup.appendChild(besogo.svgShadow(x + 2, y + 4));
                    }
                }
            }
        }

        svg.replaceChild(group, stoneGroup); 
        stoneGroup = group;
    }

    
    function redrawMarkup(current) {
        var element, i, j, x, y, 
            group = besogo.svgEl("g"), 
            lastMove = current.move,
            variants = editor.getVariants(),
            mark, 
            stone, 
            color; 

        markupLayer = []; 

        for (i = 1; i <= sizeX; i++) {
            for (j = 1; j <= sizeY; j++) {
                mark = current.getMarkup(i, j);
                if (mark) {
                    x = svgPos(i);
                    y = svgPos(j);
                    stone = current.getStone(i, j);
                    color = (stone === -1) ? "white" : "black"; 
                    if (lastMove && lastMove.x === i && lastMove.y === j) {
                        
                        color = checkVariants(variants, current, i, j) ?
                            besogo.PURP : besogo.BLUE;
                    } else if (checkVariants(variants, current, i, j)) {
                        color = besogo.RED; 
                    }
                    if (typeof mark === 'number') { 
                        switch(mark) {
                            case 1:
                                element = besogo.svgCircle(x, y, color);
                                break;
                            case 2:
                                element = besogo.svgSquare(x, y, color);
                                break;
                            case 3:
                                element = besogo.svgTriangle(x, y, color);
                                break;
                            case 4:
                                element = besogo.svgCross(x, y, color);
                                break;
                            case 5:
                                element = besogo.svgBlock(x, y, color);
                                break;
                        }
                    } else { 
                        if (!stone) { 
                            element = makeBacker(x, y);
                            group.appendChild(element);
                        }
                        element = besogo.svgLabel(x, y, color, mark);
                    }
                    group.appendChild(element);
                    markupLayer[ fromXY(i, j) ] = element;
                } 
            } 
        } 

        
        if (lastMove && lastMove.x !== 0 && lastMove.y !== 0) {
            i = lastMove.x;
            j = lastMove.y;
            if (!markupLayer[ fromXY(i, j) ]) { 
                color = checkVariants(variants, current, i, j) ? besogo.PURP : besogo.BLUE;
                element = besogo.svgPlus(svgPos(i), svgPos(j), color);
                group.appendChild(element);
                markupLayer[ fromXY(i, j) ] = element;
            }
        }

        
        markRemainingVariants(variants, current, group);

        svg.replaceChild(group, markupGroup); 
        markupGroup = group;
    } 

    function makeBacker(x, y) { 
        return besogo.svgEl("rect", {
            x: x - CELL_SIZE/2,
            y: y - CELL_SIZE/2,
            height: CELL_SIZE,
            width: CELL_SIZE,
            opacity: 0.85,
            stroke: "none",
            'class': 'besogo-svg-board besogo-svg-backer'
        });
    }

    
    function checkVariants(variants, current, x, y) {
        var i, move;
        for (i = 0; i < variants.length; i++) {
            if (variants[i] !== current) { 
                move = variants[i].move;
                if (move && move.x === x && move.y === y) {
                    return true;
                }
            }
        }
        return false;
    }

    
    function markRemainingVariants(variants, current, group) {
        var element,
            move, 
            label, 
            stone, 
            i, x, y; 

        for (i = 0; i < variants.length; i++) {
            if (variants[i] !== current) { 
                move = variants[i].move;
                
                if (move && move.x !== 0 && !markupLayer[ fromXY(move.x, move.y) ]) {
                    stone = current.getStone(move.x, move.y);
                    x = svgPos(move.x); 
                    y = svgPos(move.y);
                    if (!stone) { 
                        element = makeBacker(x, y);
                        group.appendChild(element);
                    }
                    
                    label = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
                    element = besogo.svgLabel(x, y, besogo.LRED, label);
                    group.appendChild(element);
                    markupLayer[ fromXY(move.x, move.y) ] = element;
                }
            }
        }
    } 

    
    function redrawHover(current) {
        if (TOUCH_FLAG) {
            return; 
        }

        var element, i, j, x, y, 
            group = besogo.svgEl("g"), 
            tool = editor.getTool(),
            children,
            stone, 
            color; 

        hoverLayer = []; 
        group.setAttribute('opacity', '0.35');

        if (tool === 'navOnly') { 
            children = current.children;
            for (i = 0; i < children.length; i++) {
                stone = children[i].move;
                if (stone && stone.x !== 0) { 
                    x = svgPos(stone.x);
                    y = svgPos(stone.y);
                    element = besogo.svgStone(x, y, stone.color);
                    element.setAttribute('visibility', 'hidden');
                    group.appendChild(element);
                    hoverLayer[ fromXY(stone.x, stone.y) ] = element;
                }
            }
        } else { 
            for (i = 1; i <= sizeX; i++) {
                for (j = 1; j <= sizeY; j++) {
                    element = null;
                    x = svgPos(i);
                    y = svgPos(j);
                    stone = current.getStone(i, j);
                    color = (stone === -1) ? "white" : "black"; 
                    switch(tool) {
                        case 'auto':
                            element = besogo.svgStone(x, y, current.nextMove());
                            break;
                        case 'playB':
                            element = besogo.svgStone(x, y, -1);
                            break;
                        case 'playW':
                            element = besogo.svgStone(x, y, 1);
                            break;
                        case 'addB':
                            if (stone === -1) {
                                element = besogo.svgCross(x, y, besogo.RED);
                            } else {
                                element = besogo.svgEl('g');
                                element.appendChild(besogo.svgStone(x, y, -1));
                                element.appendChild(besogo.svgPlus(x, y, besogo.RED));
                            }
                            break;
                        case 'addW':
                            if (stone === 1) {
                                element = besogo.svgCross(x, y, besogo.RED);
                            } else {
                                element = besogo.svgEl('g');
                                element.appendChild(besogo.svgStone(x, y, 1));
                                element.appendChild(besogo.svgPlus(x, y, besogo.RED));
                            }
                            break;
                        case 'addE':
                            if (stone) {
                                element = besogo.svgCross(x, y, besogo.RED);
                            }
                            break;
                        case 'clrMark':
                            break; 
                        case 'circle':
                            element = besogo.svgCircle(x, y, color);
                            break;
                        case 'square':
                            element = besogo.svgSquare(x, y, color);
                            break;
                        case 'triangle':
                            element = besogo.svgTriangle(x, y, color);
                            break;
                        case 'cross':
                            element = besogo.svgCross(x, y, color);
                            break;
                        case 'block':
                            element = besogo.svgBlock(x, y, color);
                            break;
                        case 'label':
                            element = besogo.svgLabel(x, y, color, editor.getLabel());
                            break;
                    } 
                    if (element) {
                        element.setAttribute('visibility', 'hidden');
                        group.appendChild(element);
                        hoverLayer[ fromXY(i, j) ] = element;
                    }
                } 
            } 
        } 

        svg.replaceChild(group, hoverGroup); 
        hoverGroup = group;
    } 

    function svgPos(x) {  
        return BOARD_MARGIN + CELL_SIZE/2 + (x-1) * CELL_SIZE;
    }

    function fromXY(x, y) { 
        return (x - 1)*sizeY + (y - 1);
    }
};
besogo.makeCommentPanel = function(container, editor) {
    'use strict';
    var infoTexts = {}, 
        gameInfoTable = document.createElement('table'),
        gameInfoEdit = document.createElement('table'),
        commentBox = document.createElement('div'),
        commentEdit = document.createElement('textarea'),
        playerInfoOrder = 'PW WR WT PB BR BT'.split(' '),
        infoOrder = 'HA KM RU TM OT GN EV PC RO DT RE ON GC AN US SO CP'.split(' '),
        infoIds = {
            PW: 'White Player',
            WR: 'White Rank',
            WT: 'White Team',
            PB: 'Black Player',
            BR: 'Black Rank',
            BT: 'Black Team',

            HA: 'Handicap',
            KM: 'Komi',
            RU: 'Rules',
            TM: 'Timing',
            OT: 'Overtime',

            GN: 'Game Name',
            EV: 'Event',
            PC: 'Place',
            RO: 'Round',
            DT: 'Date',

            RE: 'Result',
            ON: 'Opening',
            GC: 'Comments',

            AN: 'Annotator',
            US: 'Recorder',
            SO: 'Source',
            CP: 'Copyright'
        };

    container.appendChild(makeInfoButton());
    container.appendChild(makeInfoEditButton());
    container.appendChild(makeCommentButton());
    
    container.appendChild(makePlayButton());
    container.appendChild(makePlayAllButton());
    
    container.appendChild(gameInfoTable);
    container.appendChild(gameInfoEdit);
    infoTexts.C = document.createTextNode('');
    container.appendChild(commentBox);
    commentBox.appendChild(infoTexts.C);
    container.appendChild(commentEdit);

    commentEdit.onblur = function() {
        editor.setComment(commentEdit.value);
    };
    commentEdit.addEventListener('keydown', function(evt) {
        evt = evt || window.event;
        evt.stopPropagation(); 
    });

    editor.addListener(update);
    update({ navChange: true, gameInfo: editor.getGameInfo() });
    gameInfoEdit.style.display = 'none'; 

    function update(msg) {
        var temp; 

        if (msg.navChange) {
            temp = editor.getCurrent().comment || '';
            updateText(commentBox, temp, 'C');
            if (editor.getCurrent() === editor.getRoot() &&
                gameInfoTable.firstChild &&
                gameInfoEdit.style.display === 'none') {
                    gameInfoTable.style.display = 'table';
            } else {
                gameInfoTable.style.display = 'none';
            }
            commentEdit.style.display = 'none';
            commentBox.style.display = 'block';
        } else if (msg.comment !== undefined) {
            updateText(commentBox, msg.comment, 'C');
            commentEdit.value = msg.comment;
        }

        if (msg.gameInfo) { 
            updateGameInfoTable(msg.gameInfo);
            updateGameInfoEdit(msg.gameInfo);
        }
    } 

    function updateGameInfoTable(gameInfo) {
        var table = document.createElement('table'),
            i, id, row, cell, text; 

        table.className = 'besogo-gameInfo';
        for (i = 0; i < infoOrder.length ; i++) { 
            id = infoOrder[i];

            if (gameInfo[id]) { 
                row = document.createElement('tr');
                table.appendChild(row);

                cell = document.createElement('td');
                cell.appendChild(document.createTextNode(infoIds[id]));
                row.appendChild(cell);

                cell = document.createElement('td');
                text = document.createTextNode(gameInfo[id]);
                cell.appendChild(text);
                row.appendChild(cell);
            }
        }
        if (!table.firstChild || gameInfoTable.style.display === 'none') {
            table.style.display = 'none'; 
        }
        container.replaceChild(table, gameInfoTable);
        gameInfoTable = table;
    }
    
    function updateGameInfoEdit(gameInfo) {
        var table = document.createElement('table'),
            infoTableOrder = playerInfoOrder.concat(infoOrder),
            i, id, row, cell, text;

        table.className = 'besogo-gameInfo';
        for (i = 0; i < infoTableOrder.length ; i++) { 
            id = infoTableOrder[i];
            row = document.createElement('tr');
            table.appendChild(row);
            
            cell = document.createElement('td');
            cell.appendChild(document.createTextNode(infoIds[id]));
            row.appendChild(cell);

            cell = document.createElement('td');
            text = document.createElement('input');
            if (gameInfo[id]) {
                text.value = gameInfo[id];
            }
            text.onblur = function(t, id) {
                return function() { 
                    editor.setGameInfo(t.value, id);
                };
            }(text, id);
            text.addEventListener('keydown', function(evt) {
                evt = evt || window.event;
                evt.stopPropagation(); 
            });
            cell.appendChild(text);
            row.appendChild(cell);
        }
        if (gameInfoEdit.style.display === 'none') {
            table.style.display = 'none'; 
        }
        container.replaceChild(table, gameInfoEdit);
        gameInfoEdit = table;
    }

    function updateText(parent, text, id) {
        var textNode = document.createTextNode(text);
        parent.replaceChild(textNode, infoTexts[id]);
        infoTexts[id] = textNode;
    }

    function makeInfoButton() {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = '显示信息';
        button.title = 'Show/hide game info';

        button.onclick = function() {
            if (gameInfoTable.style.display === 'none' && gameInfoTable.firstChild) {
		button.value = '隐藏信息';
                gameInfoTable.style.display = 'table';
            } else {
		button.value = '显示信息';
                gameInfoTable.style.display = 'none';
            }
            gameInfoEdit.style.display = 'none';
        };
        return button;
    }

    function makeInfoEditButton() {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = '编辑信息';
        button.title = 'Edit game info';

        button.onclick = function() {
            if (gameInfoEdit.style.display === 'none') {
                gameInfoEdit.style.display = 'table';
            } else {
                gameInfoEdit.style.display = 'none';
            }
            gameInfoTable.style.display = 'none';
        };
        return button;
    }

    function makeCommentButton() {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = '评论';
        button.title = 'Edit comment';

        button.onclick = function() {
            if (commentEdit.style.display === 'none') { 
                commentBox.style.display = 'none'; 
                gameInfoTable.style.display = 'none'; 
                commentEdit.value = editor.getCurrent().comment;
                commentEdit.style.display = 'block'; 
            } else { 
                commentEdit.style.display = 'none'; 
                commentBox.style.display = 'block'; 
            }
        };
        return button;
    }

};
besogo.makeControlPanel = function(container, editor) {
    'use strict';
    var leftElements = [], 
        rightElements = [], 
        siblingElements = [], 
        variantStyleButton, 
        hideVariantButton, 
        childVariantElement, 
        siblingVariantElement, 
        hideVariantElement; 

    drawNavButtons();
    drawStyleButtons();

    editor.addListener(update);
    update({ navChange: true, variantStyle: editor.getVariantStyle() }); 

    
    function update(msg) {
        var current;

        if (msg.variantStyle !== undefined) {
            updateStyleButtons(msg.variantStyle);
        }

        if (msg.navChange || msg.treeChange) { 
            current = editor.getCurrent();
            if (current.parent) { 
                arraySetColor(leftElements, 'black');
                if (current.parent.children.length > 1) { 
                    arraySetColor(siblingElements, 'black');
                } else { 
                    arraySetColor(siblingElements, besogo.GREY);
                }
            } else { 
                arraySetColor(leftElements, besogo.GREY);
                arraySetColor(siblingElements, besogo.GREY);
            }
            if (current.children.length) { 
                arraySetColor(rightElements, 'black');
            } else { 
                arraySetColor(rightElements, besogo.GREY);
            }
        }

        function updateStyleButtons(style) { 
            if (style % 2) { 
                childVariantElement.setAttribute('fill', 'black');
                siblingVariantElement.setAttribute('fill', besogo.BLUE);
                variantStyleButton.title = 'Variants: child/[sibling]';
            } else { 
                childVariantElement.setAttribute('fill', besogo.BLUE);
                siblingVariantElement.setAttribute('fill', besogo.RED);
                variantStyleButton.title = 'Variants: [child]/sibling';
            }
            if (style >= 2) { 
                hideVariantElement.setAttribute('visibility', 'visible');
                hideVariantButton.title = 'Variants: show/[hide]';
            } else { 
                hideVariantElement.setAttribute('visibility', 'hidden');
                hideVariantButton.title = 'Variants: [show]/hide';
            }
        }

        function arraySetColor(list, color) { 
            var i;
            for (i = 0; i < list.length; i++) {
                list[i].setAttribute('fill', color);
            }
        }
    } 

    
    function drawNavButtons() {
        leftElements.push(makeNavButton('First node',
            '5,10 5,90 25,90 25,50 95,90 95,10 25,50 25,10',
            function() {
                editor.prevNode(-1);
            })
        );
        leftElements.push(makeNavButton('Jump back',
            '95,10 50,50 50,10 5,50 50,90 50,50 95,90',
            function() {
                editor.prevNode(10);
            })
        );
        leftElements.push(makeNavButton('Previous node', '85,10 85,90 15,50', function() {
            editor.prevNode(1);
        }));

        rightElements.push(makeNavButton('Next node', '15,10 15,90 85,50', function() {
            editor.nextNode(1);
        }));
        rightElements.push(makeNavButton('Jump forward',
            '5,10 50,50 50,10 95,50 50,90 50,50 5,90',
            function() {
                editor.nextNode(10);
            })
        );
        rightElements.push(makeNavButton('Last node',
            '95,10 95,90 75,90 75,50 5,90 5,10 75,50 75,10',
            function() {
                editor.nextNode(-1);
            })
        );

        siblingElements.push(makeNavButton('Previous sibling', '10,85 90,85 50,15', function() {
            editor.nextSibling(-1);
        }));
        siblingElements.push(makeNavButton('Next sibling', '10,15 90,15 50,85', function() {
            editor.nextSibling(1);
        }));

        function makeNavButton(tooltip, pointString, action) { 
            var button = document.createElement('button'),
                svg = makeButtonContainer(),
                element = besogo.svgEl("polygon", {
                    points: pointString,
                    stroke: 'none',
                    fill: 'black'
                });

            button.title = tooltip;
            button.onclick = action;
            button.appendChild(svg);
            svg.appendChild(element);
            container.appendChild(button);

            return element;
        } 
    } 

    
    function drawStyleButtons() {
        var svg, element, coordStyleButton;

        variantStyleButton = document.createElement('button');
        variantStyleButton.onclick = function() {
            editor.toggleVariantStyle(false); 
        };
        container.appendChild(variantStyleButton);
        svg = makeButtonContainer();
        variantStyleButton.appendChild(svg);
        element = besogo.svgEl("path", {
            d: 'm75,25h-50l50,50',
            stroke: 'black',
            "stroke-width": 5,
            fill: 'none'
        });
        svg.appendChild(element);
        childVariantElement = besogo.svgEl('circle', {
            cx: 25,
            cy: 25,
            r: 20,
            stroke: 'none'
        });
        svg.appendChild(childVariantElement);
        siblingVariantElement = besogo.svgEl('circle', {
            cx: 75,
            cy: 25,
            r: 20,
            stroke: 'none'});
        svg.appendChild(siblingVariantElement);
        element = besogo.svgEl('circle', {
            cx: 75,
            cy: 75,
            r: 20,
            fill: besogo.RED,
            stroke: 'none'
        });
        svg.appendChild(element);

        hideVariantButton = document.createElement('button');
        hideVariantButton.onclick = function() {
            editor.toggleVariantStyle(true); 
        };
        container.appendChild(hideVariantButton);
        svg = makeButtonContainer();
        hideVariantButton.appendChild(svg);
        svg.appendChild(besogo.svgLabel(50, 50, besogo.RED, 'A'));
        hideVariantElement = besogo.svgCross(50, 50, 'black');
        svg.appendChild(hideVariantElement);

        coordStyleButton = document.createElement('button');
        coordStyleButton.onclick = function() {
            editor.toggleCoordStyle();
	    var a = editor.getCurrent();
	    editor.prevNode(-1);
	    updataComment();
	    editor.setCurrent(a);
        };
        coordStyleButton.title = 'Toggle coordinates';
        container.appendChild(coordStyleButton);
        svg = makeButtonContainer();
        coordStyleButton.appendChild(svg);
        svg.appendChild(besogo.svgLabel(50, 50, 'black', '四4'));
    } 

    
    function makeButtonContainer() {
        return besogo.svgEl('svg', {
            width: '100%',
            height: '100%',
            viewBox: "0 0 100 100"
        });
    }
};
(function() {
'use strict';


besogo.coord = {};


besogo.coord.none = function(sizeX, sizeY) {
    return false;
};


besogo.coord.western = function(sizeX, sizeY) {
    var labels = { x: [], y: [] }, i;
    for (i = 1; i <= sizeX; i++) {
        labels.x[i] = numberToLetter(i);
    }
    for (i = 1; i <= sizeY; i++) {
        labels.y[i] = (sizeY - i + 1) + '';
    }
    return labels;
};


besogo.coord.numeric = function(sizeX, sizeY) {
    var labels = { x: [], y: [] }, i;
    for (i = 1; i <= sizeX; i++) {
        labels.x[i] = i + '';
    }
    for (i = 1; i <= sizeY; i++) {
        labels.y[i] = i + '';
    }
    return labels;
};


besogo.coord.pierre = function(sizeX, sizeY) {
    var labels = { x: [], xb: [], y: [], yb: [] }, i;
    for (i = 1; i <= sizeX / 2; i++) {
        labels.x[i] = 'a' + i;
        labels.x[sizeX - i + 1] = 'b' + i;
        labels.xb[i] = 'd' + i;
        labels.xb[sizeX - i + 1] = 'c' + i;
    }
    if (sizeX % 2) {
        i = Math.ceil(sizeX / 2);
        labels.x[i] = 'a';
        labels.xb[i] = 'c';
    }
    for (i = 1; i <= sizeY / 2; i++) {
        labels.y[i] = 'a' + i;
        labels.y[sizeY - i + 1] = 'd' + i;
        labels.yb[i] = 'b' + i;
        labels.yb[sizeY - i + 1] = 'c' + i;
    }
    if (sizeY % 2) {
        i = Math.ceil(sizeY / 2);
        labels.y[i] = 'd';
        labels.yb[i] = 'b';
    }
    return labels;
};


besogo.coord.corner = function(sizeX, sizeY) {
    var labels = { x: [], y: [] }, i;
    for (i = 1; i <= sizeX; i++) {
        if (i < (sizeX / 2) + 1) {
            labels.x[i] = numberToLetter(i);
        } else {
            labels.x[i] = (sizeX - i + 1) + '';
        }
    }
    for (i = 1; i <= sizeY; i++) {
        labels.y[i] = (sizeY - i + 1) + '';
        if (i > (sizeY / 2)) {
            labels.y[i] = numberToLetter(sizeY - i + 1);
        } else {
            labels.y[i] = i + '';
        }
    }
    return labels;
};


besogo.coord.eastcor = function(sizeX, sizeY) {
    var labels = { x: [], y: [] }, i;
    for (i = 1; i <= sizeX; i++) {
        if (i < (sizeX / 2) + 1) {
            labels.x[i] = numberToCJK(i);
        } else {
            labels.x[i] = (sizeX - i + 1) + '';
        }
    }
    for (i = 1; i <= sizeY; i++) {
        labels.y[i] = (sizeY - i + 1) + '';
        if (i > (sizeY / 2)) {
            labels.y[i] = numberToCJK(sizeY - i + 1);
        } else {
            labels.y[i] = i + '';
        }
    }
    return labels;
};


besogo.coord.eastern = function(sizeX, sizeY) {
    var labels = { x: [], y: [] }, i;
    for (i = 1; i <= sizeX; i++) {
        labels.x[i] = i + ''; 
    }
    for (i = 1; i <= sizeY; i++) {
        labels.y[i] = numberToCJK(i);
    }

    return labels;
};


function numberToLetter(number) {
    return 'ABCDEFGHJKLMNOPQRSTUVWXYZ'.charAt((number - 1) % 25);
}


function numberToCJK(number) {
    var label = '',
        cjk = '一二三四五六七八九';
    
    if (number >= 20) { 
        label = cjk.charAt(number / 10 - 1) + '十';
    } else if (number >= 10) { 
        label = '十';
    }
    if (number % 10) { 
        label = label + cjk.charAt((number - 1) % 10);
    }
    return label;
}

})(); 
besogo.makeEditor = function(sizeX, sizeY) {
    'use strict';
    
    var root = besogo.makeGameRoot(sizeX, sizeY),
        current = root, 

        listeners = [], 

        
        TOOLS = ['navOnly', 
            'auto', 
            'playB', 
            'playW', 
            'addB', 
            'addW', 
            'addE', 
            'clrMark', 
            'circle', 
            'square', 
            'triangle', 
            'cross', 
            'block', 
            'label'], 
        tool = 'auto', 
        label = "1", 

        navHistory = [], 

        gameInfo = {}, 

	COORDS = 'none numeric western eastern'.split(' '),
        coord = 'none', 
        
        variantStyle = 0; 

    return {
        addListener: addListener,
        click: click,
        nextNode: nextNode,
        prevNode: prevNode,
        nextSibling: nextSibling,
        toggleCoordStyle: toggleCoordStyle,
        getCoordStyle: getCoordStyle,
        setCoordStyle: setCoordStyle,
        toggleVariantStyle: toggleVariantStyle,
        getVariantStyle: getVariantStyle,
        setVariantStyle: setVariantStyle,
        getGameInfo: getGameInfo,
        setGameInfo: setGameInfo,
        setComment: setComment,
        getTool: getTool,
        setTool: setTool,
        getLabel: getLabel,
        setLabel: setLabel,
        getVariants: getVariants, 
        getCurrent: getCurrent,
        setCurrent: setCurrent,
        cutCurrent: cutCurrent,
        promote: promote,
        demote: demote,
        getRoot: getRoot,
        loadRoot: loadRoot 
    };

    
    function getTool() {
        return tool;
    }

    
    function setTool(set) {
        
        if (set === 'label' && set === tool) {
            if ( /^-?\d+$/.test(label) ) { 
                setLabel('A'); 
            } else {
                setLabel('1'); 
            }
            return true; 
        }
        
        if (TOOLS.indexOf(set) !== -1 && tool !== set) {
            tool = set;
            notifyListeners({ tool: tool, label: label }); 
            return true;
        }
        return false;
    }

    
    function getLabel() {
        return label;
    }

    
    function setLabel(set) {
        if (typeof set === 'string') {
            set = set.replace(/\s/g, ' ').trim(); 
            label = set || "1"; 
            tool = 'label'; 
            notifyListeners({ tool: tool, label: label }); 
        }
    }

    
    function toggleCoordStyle() {
        coord = COORDS[(COORDS.indexOf(coord) + 1) % COORDS.length];
        notifyListeners({ coord: coord });
    }

    
    function getCoordStyle() {
        return coord;
    }

    
    function setCoordStyle(setCoord) {
        if (besogo.coord[setCoord]) {
            coord = setCoord;
            notifyListeners({ coord: setCoord });
        }
    }

    
    function toggleVariantStyle(toggleShow) {
        var childStyle = variantStyle % 2, 
            showStyle = variantStyle - childStyle; 
        if (toggleShow) { 
            showStyle = (showStyle + 2) % 4; 
        } else { 
            childStyle = (childStyle + 1) % 2; 
        }
        variantStyle = childStyle + showStyle;
        notifyListeners({ variantStyle: variantStyle, markupChange: true });
    }

    
    function getVariantStyle() {
        return variantStyle;
    }

    
    function setVariantStyle(style) {
        if (style === 0 || style === 1 || style === 2 || style === 3) {
            variantStyle = style;
            notifyListeners({ variantStyle: variantStyle, markupChange: true });
        }
    }

    function getGameInfo() {
        return gameInfo;
    }

    function setGameInfo(info, id) {
        if (id) {
            gameInfo[id] = info;
        } else {
            gameInfo = info;
        }
        notifyListeners({ gameInfo: gameInfo });
    }

    function setComment(text) {
        text = text.trim(); 
        text = text.replace(/\r\n/g,'\n').replace(/\n\r/g,'\n').replace(/\r/g,'\n');
        text.replace(/\f\t\v\u0085\u00a0/g,' '); 
        current.comment = text;
        notifyListeners({ comment: text });
    }

    
    function getVariants() {
        if (variantStyle >= 2) { 
            return [];
        }
        if (variantStyle === 1) { 
            
            return current.parent ? current.parent.children : [];
        }
        return current.children; 
    }

    
    function getCurrent() {
        return current;
    }

    
    function getRoot() {
        return root;
    }

    function loadRoot(load) {
        root = load;
        current = load;
        notifyListeners({ treeChange: true, navChange: true, stoneChange: true });
    }

    
    function nextNode(num) {
        if (current.children.length === 0) { 
            return false; 
        }
        while (current.children.length > 0 && num !== 0) {
            if (navHistory.length) { 
                current = navHistory.pop();
            } else { 
                current = current.children[0]; 
            }
            num--;
        }
        
        notifyListeners({ navChange: true }, true); 
    }

    
    function prevNode(num) {
        if (current.parent === null) { 
            return false; 
        }
        while (current.parent && num !== 0) {
            navHistory.push(current); 
            current = current.parent;
            num--;
        }
        
        notifyListeners({ navChange: true }, true); 
    }

    
    function nextSibling(change) {
        var siblings,
            i = 0;

        if (current.parent) {
            siblings = current.parent.children;

            
            if (siblings.length === 1) {
                return;
            }

            
            i = siblings.indexOf(current);

            
            i = (i + change) % siblings.length;
            if (i < 0) {
                i += siblings.length;
            }

            current = siblings[i];
            
            notifyListeners({ navChange: true });
        }
    }

    
    function setCurrent(node) {
        if (current !== node) {
            current = node;
            
            notifyListeners({ navChange: true });
        }
    }

    
    function cutCurrent() {
        var parent = current.parent;
        if (tool === 'navOnly') {
            return; 
        }
        if (parent) {
            if (confirm("Delete this branch?") === true) {
                parent.removeChild(current);
                current = parent;
                
                notifyListeners({ treeChange: true, navChange: true });
            }
        }
    }

    
    function promote() {
        if (tool === 'navOnly') {
            return; 
        }
        if (current.parent && current.parent.promote(current)) {
            notifyListeners({ treeChange: true }); 
        }
    }

    
    function demote() {
        if (tool === 'navOnly') {
            return; 
        }
        if (current.parent && current.parent.demote(current)) {
            notifyListeners({ treeChange: true }); 
        }
    }

    
    function click(i, j, ctrlKey, shiftKey) {
        switch(tool) {
            case 'navOnly':
                navigate(i, j, shiftKey);
                break;
            case 'auto':
                if (!navigate(i, j, shiftKey) && !shiftKey) { 
                    playMove(i, j, 0, ctrlKey);
		    sendMsg(i, j);
                }
                break;
            case 'playB':
                playMove(i, j, -1, ctrlKey); 
                break;
            case 'playW':
                playMove(i, j, 1, ctrlKey); 
                break;
            case 'addB':
                if (ctrlKey) {
                    playMove(i, j, -1, true); 
                } else {
                    placeSetup(i, j, -1); 
                }
                break;
            case 'addW':
                if (ctrlKey) {
                    playMove(i, j, 1, true); 
                } else {
                    placeSetup(i, j, 1); 
                }
                break;
            case 'addE':
                placeSetup(i, j, 0);
                break;
            case 'clrMark':
                setMarkup(i, j, 0);
                break;
            case 'circle':
                setMarkup(i, j, 1);
                break;
            case 'square':
                setMarkup(i, j, 2);
                break;
            case 'triangle':
                setMarkup(i, j, 3);
                break;
            case 'cross':
                setMarkup(i, j, 4);
                break;
            case 'block':
                setMarkup(i, j, 5);
                break;
            case 'label':
                setMarkup(i, j, label);
                break;
        }
    }

    
    
    function navigate(x, y, shiftKey) {
        var i, move,
            children = current.children;

        
        for (i = 0; i < children.length; i++) {
            move = children[i].move;
            if (shiftKey) { 
                if (jumpToMove(x, y, children[i])) {
                    return true;
                }
            } else if (move && move.x === x && move.y === y) {
                current = children[i]; 
                notifyListeners({ navChange: true }); 
                return true;
            }
        }

        if (shiftKey && jumpToMove(x, y, root, current)) {
            return true;
        }
        return false;
    }

    
    function jumpToMove(x, y, start, end) {
        var i, move,
            children = start.children;

        if (end && end === start) {
            return false;
        }

        move = start.move;
        if (move && move.x === x && move.y === y) {
            current = start;
            notifyListeners({ navChange: true }); 
            return true;
        }

        for (i = 0; i < children.length; i++) {
            if (jumpToMove(x, y, children[i], end)) {
                return true;
            }
        }
        return false;
    }

    
    
    function playMove(i, j, color, allowAll) {
        var next;
        
        if ( !current.isMutable('move') || !current.parent ) {
            next = current.makeChild(); 
            if (next.playMove(i, j, color, allowAll)) { 
                
                current.addChild(next);
                current = next;
                
                notifyListeners({ treeChange: true, navChange: true, stoneChange: true });
            }
        
        } else if(current.playMove(i, j, color, allowAll)) { 
            
            notifyListeners({ stoneChange: true }); 
        }
    }

    
    function placeSetup(i, j, color) {
        var next;
        if (color === current.getStone(i, j)) { 
            if (color !== 0) {
                color = 0; 
            } else { 
                return; 
            }
        }
        
        if (!current.isMutable('setup')) {
            next = current.makeChild(); 
            if (next.placeSetup(i, j, color)) { 
                
                current.addChild(next);
                current = next;
                
                notifyListeners({ treeChange: true, navChange: true, stoneChange: true });
            }
        } else if(current.placeSetup(i, j, color)) { 
            
            notifyListeners({ stoneChange: true }); 
        }
    }

    
    function setMarkup(i, j, mark) {
        var temp; 
        if (mark === current.getMarkup(i, j)) { 
            if (mark !== 0) {
                mark = 0; 
            } else { 
                return; 
            }
        }
        if (current.addMarkup(i, j, mark)) { 
            if (typeof mark === 'string') { 
                if (/^-?\d+$/.test(mark)) { 
                    temp = +mark; 
                    
                    setLabel( "" + (temp + 1) );
                } else if ( /[A-Za-z]$/.test(mark) ) { 
                    
                    temp = mark.charAt(mark.length - 1);
                    if (temp === 'z') { 
                        temp = 'A'; 
                    } else if (temp === 'Z') {
                        temp = 'a'; 
                    } else {
                        temp = String.fromCharCode(temp.charCodeAt() + 1);
                    }
                    
                    setLabel( mark.slice(0, mark.length - 1) + temp );
                }
            }
            notifyListeners({ markupChange: true }); 
        }
    }

    
    function addListener(listener) {
        listeners.push(listener);
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    function notifyListeners(msg, keepHistory) {
        var i;
        if (!keepHistory && msg.navChange) {
            navHistory = []; 
        }
        for (i = 0; i < listeners.length; i++) {
            listeners[i](msg);
        }
    }
};
besogo.makeFilePanel = function(container, editor) {
    'use strict';
    var fileChooser, 
        element, 
        WARNING = "Everything not saved will be lost";

    makeNewBoardButton(9); 
    makeNewBoardButton(13); 
    makeNewBoardButton(19); 
    makeNewBoardButton('?'); 

    
    fileChooser = makeFileChooser();
    container.appendChild(fileChooser);

    
    element = document.createElement('input');
    element.type = 'button';
    element.value = '打开';
    element.title = 'Import SGF';
    element.onclick = function() { 
        fileChooser.click();
    };
    container.appendChild(element);

    
    element = document.createElement('input');
    element.type = 'button';
    element.value = '保存';
    element.title = 'Export SGF';
    element.onclick = function() {
        var fileName = prompt('Save file as', 'export.sgf');
        if (fileName) { 
            saveFile(fileName, besogo.composeSgf(editor));
        }
    };
    container.appendChild(element);

    container.appendChild(makeSaveTextButton());

    
    function makeNewBoardButton(size) {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = size + "x" + size;
        if (size === '?') { 
            button.title = "New custom size board";
            button.onclick = function() {
                var input = prompt("Enter custom size for new board" + "\n" + WARNING, "19:19"),
                    size;
                if (input) { 
                    size = besogo.parseSize(input);
                    editor.loadRoot(besogo.makeGameRoot(size.x, size.y));
                    editor.setGameInfo({});
                }
            };
        } else { 
            button.title = "New " + size + "x" + size + " board";
            button.onclick = function() {
                if (confirm(button.title + "?\n" + WARNING)) {
                    editor.loadRoot(besogo.makeGameRoot(size, size));
                    editor.setGameInfo({});
                }
            };
        }
        container.appendChild(button);
    }

    
    function makeFileChooser() {
        var chooser = document.createElement('input');
        chooser.type = 'file';
        chooser.style.display = 'none'; 
        chooser.onchange = readFile; 
        return chooser;
    }

    
    function readFile(evt) {
        var file = evt.target.files[0], 
            reader = new FileReader(),
            newChooser = makeFileChooser(); 

        container.replaceChild(newChooser, fileChooser); 
        fileChooser = newChooser;

        reader.onload = function(e){ 
            var sgf;
            try {
                sgf = besogo.parseSgf(e.target.result);
            } catch (error) {
                alert('SGF parse error at ' + error.at + ':\n' + error.message);
                return;
            }
            besogo.loadSgf(sgf, editor);
	    initComment();
        };
        if (confirm("Load '" + file.name + "'?\n" + WARNING)) {
            reader.readAsText(file); 
        }
    }

    
    function saveFile(fileName, text) {
        var link = document.createElement('a'),
            blob = new Blob([text], { encoding:"UTF-8", type:"text/plain;charset=UTF-8" });

        link.download = fileName; 
        link.href = URL.createObjectURL(blob);
        link.style.display = 'none'; 
        container.appendChild(link); 
        link.click(); 
        container.removeChild(link); 
    }
};
besogo.makeGameRoot = function(sizeX, sizeY) {
    'use strict';
    var BLACK = -1, 
        WHITE = 1, 
        EMPTY = 0, 

        root = { 
            blackCaps: 0,
            whiteCaps: 0,
            moveNumber: 0
        };

    
    function initNode(node, parent) {
        node.parent = parent;
        node.children = [];

        node.move = null;
        node.setupStones = [];
        node.markup = [];
        node.comment = ''; 
    }
    initNode(root, null); 

    
    
    root.playMove = function(x, y, color, allow) {
        var captures = 0, 
            overwrite = false, 
            prevMove, 
            testBoard, 
            pending, 
            i; 

        if (!this.isMutable('move')) {
            return false; 
        }

        if (!color) { 
            color = this.nextMove();
        }

        if (x < 1 || y < 1 || x > sizeX || y > sizeY) {
            this.move = { 
                x: 0, y: 0, 
                color: color,
                captures: 0, 
                overwrite: false 
            };
            this.lastMove = color; 
            this.moveNumber++; 
            return true; 
        }

        if (this.getStone(x, y)) { 
            if (!allow) {
                return false; 
            }
            overwrite = true; 
        }

        testBoard = Object.create(this); 
        pending = []; 

        setStone(testBoard, x, y, color); 

        
        captureStones(testBoard, x - 1, y, color, pending);
        captureStones(testBoard, x + 1, y, color, pending);
        captureStones(testBoard, x, y - 1, color, pending);
        captureStones(testBoard, x, y + 1, color, pending);

        captures = pending.length; 

        prevMove = this.parent ? this.parent.move : null; 
        if (!allow && prevMove && 
            prevMove.color === -color && 
            prevMove.overwrite === false && 
            prevMove.captures === 1 && 
            captures === 1 && 
            !testBoard.getStone(prevMove.x, prevMove.y) ) { 
                return false; 
        }

        if (captures === 0) { 
            captureStones(testBoard, x, y, -color, pending); 
            captures = -pending.length; 
            if (captures < 0 && !allow) {
                return false; 
            }
        }

        if (color * captures < 0) { 
            this.blackCaps += Math.abs(captures); 
        } else { 
            this.whiteCaps += Math.abs(captures); 
        }

        setStone(this, x, y, color); 
        for (i = 0; i < pending.length; i++) { 
            setStone(this, pending[i].x, pending[i].y, EMPTY);
        }

        this.move = { 
            x: x, y: y,
            color: color,
            captures: captures,
            overwrite: overwrite
        };
        this.lastMove = color; 
        this.moveNumber++; 
        return true;
    }; 

    
    function captureStones(board, x, y, color, captures) {
        var pending = [],
            i; 

        if ( !recursiveCapture(board, x, y, color, pending) ) { 
            for (i = 0; i < pending.length; i++) { 
                setStone(board, pending[i].x, pending[i].y, EMPTY);
                captures.push(pending[i]);
            }
        }
    }

    
    
    function recursiveCapture(board, x, y, color, pending) {
        var i; 

        if (x < 1 || y < 1 || x > sizeX || y > sizeY) {
            return false; 
        }
        if (board.getStone(x, y) === color) {
            return false; 
        }
        if (!board.getStone(x, y)) {
            return true; 
        }
        for (i = 0; i < pending.length; i++) {
            if (pending[i].x === x && pending[i].y === y) {
                return false; 
            }
        }

        pending.push({ x: x, y: y }); 

        
        if (recursiveCapture(board, x - 1, y, color, pending) ||
            recursiveCapture(board, x + 1, y, color, pending) ||
            recursiveCapture(board, x, y - 1, color, pending) ||
            recursiveCapture(board, x, y + 1, color, pending)) {
                return true; 
        }
        return false; 
    }

    
    root.nextMove = function() {
        var x, y, count = 0;
        if (this.lastMove) { 
            return -this.lastMove; 
        } else { 
            for (x = 1; x <= sizeX; x++) {
                for (y = 1; y <= sizeY; y++) {
                    
                    count += this.getStone(x, y);
                }
            }
            
            return (count < 0) ? WHITE : BLACK;
        }
    };

    
    root.placeSetup = function(x, y, color) {
        var prevColor = (this.parent && this.parent.getStone(x, y)) || EMPTY;

        if (x < 1 || y < 1 || x > sizeX || y > sizeY) {
            return false; 
        }
        if (!this.isMutable('setup') || this.getStone(x, y) === color) {
            
            return false;
        }

        setStone(this, x, y, color); 
        this.setupStones[ fromXY(x, y) ] = color - prevColor; 
        return true;
    };

    
    root.addMarkup = function(x, y, mark) {
        if (x < 1 || y < 1 || x > sizeX || y > sizeY) {
            return false; 
        }
        if (this.getMarkup(x, y) === mark) { 
            return false;
        }
        this.markup[ fromXY(x, y) ] = mark;
        return true;
    };

    
    root.getStone = function(x, y) {
        return this['board' + x + '-' + y] || EMPTY;
    };

    
    function setStone(node, x, y, color) {
        node['board' + x + '-' + y] = color;
    }

    
    root.getSetup = function(x, y) {
        if (!this.setupStones[ fromXY(x, y) ]) { 
            return false;
        } else { 
            switch(this.getStone(x, y)) {
                case EMPTY:
                    return 'AE';
                case BLACK:
                    return 'AB';
                case WHITE:
                    return 'AW';
            }
        }
    };

    
    root.getMarkup = function(x, y) {
        return this.markup[ fromXY(x, y) ] || EMPTY;
    };

    
    root.getType = function() {
        var i;

        if (this.move) { 
            return 'move';
        }

        for (i = 0; i < this.setupStones.length; i++) {
            if (this.setupStones[i]) { 
                return 'setup';
            }
        }

        return 'empty'; 
    };

    
    root.isMutable = function(type) {
        
        if (type === 'move' && this.getType() === 'empty' && this.children.length === 0) {
            return true;
        }
        
        if (type === 'setup' && this.getType() !== 'move' && this.children.length === 0) {
            return true;
        }
        return false;
    };

    
    root.getSiblings = function() {
        return (this.parent && this.parent.children) || [];
    };

    
    root.makeChild = function() {
        var child = Object.create(this); 
        initNode(child, this); 

        return child;
    };

    
    root.addChild = function(child) {
        this.children.push(child);
    };

    
    root.removeChild = function(child) {
        var i = this.children.indexOf(child);
        if (i !== -1) {
            this.children.splice(i, 1);
            return true;
        }
        return false;
    };

    
    root.promote = function(child) {
        var i = this.children.indexOf(child);
        if (i > 0) { 
            this.children[i] = this.children[i - 1];
            this.children[i - 1] = child;
            return true;
        }
        return false;
    };

    
    root.demote = function(child) {
        var i = this.children.indexOf(child);
        if (i !== -1 && i < this.children.length - 1) { 
            this.children[i] = this.children[i + 1];
            this.children[i + 1] = child;
            return true;
        }
        return false;
    };

    
    root.getSize = function() {
        return { x: sizeX, y: sizeY };
    };

    
    function fromXY(x, y) {
        return (x - 1) * sizeY + (y - 1);
    }

    return root;
};

besogo.loadSgf = function(sgf, editor) {
    'use strict';
    var size = { x: 19, y: 19 }, 
        root;

    loadRootProps(sgf); 
    root = besogo.makeGameRoot(size.x, size.y);

    loadNodeTree(sgf, root); 
    editor.loadRoot(root); 


    
    function loadNodeTree(sgfNode, gameNode) {
        var i, nextGameNode;

        
        for (i = 0; i < sgfNode.props.length; i++) {
            loadProp(gameNode, sgfNode.props[i]);
        }

        
        for (i = 0; i < sgfNode.children.length; i++) {
            nextGameNode = gameNode.makeChild();
            gameNode.addChild(nextGameNode);
            loadNodeTree(sgfNode.children[i], nextGameNode);
        }
    }

    
    function loadProp(node, prop) {
        var setupFunc = 'placeSetup',
            markupFunc = 'addMarkup',
            move;

        switch(prop.id) {
            case 'B': 
                move = lettersToCoords(prop.values[0]);
                node.playMove(move.x, move.y, -1, true);
                break;
            case 'W': 
                move = lettersToCoords(prop.values[0]);
                node.playMove(move.x, move.y, 1, true);
                break;
            case 'AB': 
                applyPointList(prop.values, node, setupFunc, -1);
                break;
            case 'AW': 
                applyPointList(prop.values, node, setupFunc, 1);
                break;
            case 'AE': 
                applyPointList(prop.values, node, setupFunc, 0);
                break;
            case 'CR': 
                applyPointList(prop.values, node, markupFunc, 1);
                break;
            case 'SQ': 
                applyPointList(prop.values, node, markupFunc, 2);
                break;
            case 'TR': 
                applyPointList(prop.values, node, markupFunc, 3);
                break;
            case 'M': 
            case 'MA': 
                applyPointList(prop.values, node, markupFunc, 4);
                break;
            case 'SL': 
                applyPointList(prop.values, node, markupFunc, 5);
                break;
            case 'L': 
            case 'LB': 
                applyPointList(prop.values, node, markupFunc, 'label');
                break;
            case 'C': 
                if (node.comment) {
                    node.comment += '\n' + prop.values.join().trim();
                } else {
                    node.comment = prop.values.join().trim();
                }
                break;
        }
    } 

    
    
    function applyPointList(values, node, func, param) {
        var i, x, y, 
            point, 
            otherPoint, 
            label; 
        for (i = 0; i < values.length; i++) {
            point = lettersToCoords(values[i].slice(0, 2));
            if (param === 'label') { 
                label = values[i].slice(3).replace(/\n/g, ' ');
                node[func](point.x, point.y, label); 
            } else { 
                if (values[i].charAt(2) === ':') { 
                    otherPoint = lettersToCoords(values[i].slice(3));
                    if (otherPoint.x === point.x && otherPoint.y === point.y) {
                        
                        node[func](point.x, point.y, param);
                    } else if (otherPoint.x < point.x || otherPoint.y < point.y) {
                        
                        node[func](point.x, point.y, param);
                        node[func](otherPoint.x, otherPoint.y, param);
                    } else { 
                        for (x = point.x; x <= otherPoint.x; x++) {
                            for (y = point.y; y <= otherPoint.y; y++) {
                                node[func](x, y, param);
                            }
                        }
                    }
                } else { 
                    node[func](point.x, point.y, param);
                }
            }
        }
    } 

    
    function loadRootProps(node) {
        var gameInfoIds = ['PB', 'BR', 'BT', 'PW', 'WR', 'WT', 
                'HA', 'KM', 'RU', 'TM', 'OT', 
                'DT', 'EV', 'GN', 'PC', 'RO', 
                'GC', 'ON', 'RE', 
                'AN', 'CP', 'SO', 'US' ], 
            gameInfo = {}, 
            i, id, value; 

        for (i = 0; i < node.props.length; i++) {
            id = node.props[i].id; 
            value = node.props[i].values.join().trim(); 
            if (id === 'SZ') { 
                size = besogo.parseSize(value);
            } else if (id === 'ST') { 
                editor.setVariantStyle( +value ); 
            } else if (gameInfoIds.indexOf(id) !== -1) { 
                if (id !== 'GC') { 
                    value = value.replace(/\n/g, ' '); 
                }
                if (value) { 
                    gameInfo[id] = value;
                }
            }
        }
        editor.setGameInfo(gameInfo);
    }

    
    function lettersToCoords(letters) {
        if (letters.match(/^[A-Za-z]{2}$/)) { 
            return {
                x: charToNum(letters.charAt(0)),
                y: charToNum(letters.charAt(1)) };
        } else { 
            return { x: 0, y: 0 }; 
        }
    }

    function charToNum(c) { 
        if ( c.match(/[A-Z]/) ) { 
            return c.charCodeAt(0) - 'A'.charCodeAt(0) + 27;
        } else { 
            return c.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
        }
    }
};
besogo.makeNamesPanel = function(container, editor) {
    'use strict';
    var playerBox = document.createElement('div'),
        whiteBox = document.createElement('div'),
        blackBox = document.createElement('div'),
        whiteInfo = document.createTextNode(''),
        blackInfo = document.createTextNode(''),
        whiteCaps = document.createElement('span'),
        blackCaps = document.createElement('span');

    playerBox.className = 'besogo-playerInfo';
    whiteBox.className = 'besogo-whiteInfo';
    blackBox.className = 'besogo-blackInfo';
    whiteCaps.className = 'besogo-whiteCaps';
    whiteCaps.title = 'White captures';
    blackCaps.className = 'besogo-blackCaps';
    blackCaps.title = 'Black captures';
    whiteBox.appendChild(whiteInfo);
    whiteBox.appendChild(whiteCaps);
    blackBox.appendChild(blackInfo);
    blackBox.appendChild(blackCaps);
    playerBox.appendChild(whiteBox);
    playerBox.appendChild(blackBox);
    container.appendChild(playerBox);

    editor.addListener(update);
    update({ navChange: true, gameInfo: editor.getGameInfo() });

    function update(msg) {
        var infoString, 
            textNode,
            current,
            passFlag = 0;

        if (msg.gameInfo) {
            infoString = (msg.gameInfo.PW || '白子') + 
                ' (' + (msg.gameInfo.WR || '?') + ')' + 
                (msg.gameInfo.WT ? ' ' + msg.gameInfo.WT : ''); 
            textNode = document.createTextNode(infoString);
            whiteBox.replaceChild(textNode, whiteInfo);
            whiteInfo = textNode;

            infoString = (msg.gameInfo.PB || '黑子') + 
                ' (' + (msg.gameInfo.BR || '?') + ')' + 
                (msg.gameInfo.BT ? ' ' + msg.gameInfo.BT : ''); 
            textNode = document.createTextNode(infoString);
            blackBox.replaceChild(textNode, blackInfo);
            blackInfo = textNode;
        }

        if (msg.navChange || msg.stoneChange) {
            current = editor.getCurrent();
            if (current.move && current.move.x === 0 && current.move.y === 0) {
                passFlag = current.move.color;
            }
            updateText(whiteCaps, (passFlag === 1 ? 'Passed  ' : '') + current.whiteCaps);
            updateText(blackCaps, current.blackCaps + (passFlag === -1 ? '  Passed' : ''));
        }
    }

    function updateText(parent, text) {
        var textNode = document.createTextNode(text);
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
        parent.appendChild(textNode);
    }
};besogo.parseSgf = function(text) {
    'use strict';
    var at = 0, 
        ch = text.charAt(at); 

    findOpenParens(); 
    return parseTree(); 

    
    function error(msg) {
        throw {
            name: "Syntax Error",
            message: msg,
            at: at,
            text: text
        };
    }

    
    function next(check) {
        if (check && check !== ch) { 
            error( "Expected '" + check + "' instead of '" + ch + "'");
        }
        at++;
        ch = text.charAt(at);
        return ch;
    }

    
    function white() {
        while (ch && ch <= ' ') {
            next();
        }
    }

    
    function findOpenParens() {
        while (ch && ch !== '(') {
            next();
        }
    }

    
    
    function lineBreak() {
        if (ch === '\n') { 
            if (text.charAt(at + 1) === '\r') { 
                next(); 
            }
            return true;
        } else if (ch === '\r') { 
            if (text.charAt(at + 1) === '\n') { 
                next(); 
            }
            return true;
        }
        return false; 
    }

    
    function parseTree() {
        var rootNode, 
            currentNode, 
            nextNode; 

        next('('); 
        white(); 

        if (ch !== ";") { 
            error("Sub-tree missing root");
        }
        rootNode = parseNode(); 
        white(); 

        currentNode = rootNode; 
        while (ch === ';') { 
            nextNode = parseNode(); 
            
            currentNode.children.push(nextNode);
            currentNode = nextNode; 
            white(); 
        }

        
        while (ch === "(") {
            nextNode = parseTree(); 
            
            currentNode.children.push(nextNode); 
            white(); 
        }
        next(')'); 

        return rootNode;
    }

    
    function parseNode() {
        var property, 
            node = { props: [], children: [] }; 

        next(';'); 
        white(); 
        
        while ( ch && ch !== ';' && ch !== '(' && ch !== ')') {
            property = parseProperty(); 
            node.props.push(property); 
            white(); 
        }

        return node;
    }

    
    function parseProperty() {
        var property = { id: '', values: [] }; 

        
        while ( ch && /[A-Za-z]/.test(ch) ) {
            if (/[A-Z]/.test(ch)) { 
                property.id += ch; 
            }
            next();
        }
        if (!property.id) { 
            error('Missing property ID');
        }

        white(); 
        while(ch === '[') { 
            property.values.push( parseValue() );
            white(); 
        }
        if (property.values.length === 0) { 
            error('Missing property values');
        }

        return property;
    }

    
    function parseValue() {
        var value = '';
        next('['); 

        
        while ( ch && ch !== ']' ) {
            if ( ch === '\\' ) { 
                next('\\');
                if (lineBreak()) { 
                    
                } else if (ch <= ' ') { 
                    value += ' '; 
                } else {
                    value += ch; 
                }
            } else { 
                if (lineBreak()) { 
                    value += '\n'; 
                } else if (ch <= ' ') { 
                    value += ' '; 
                } else {
                    value += ch; 
                }
            }
            next();
        }
        next(']'); 

        return value;
    }
};

besogo.composeSgf = function(editor) {
    'use strict';
    return '(' + composeNode(editor.getRoot()) + ')';

    
    function composeNode(tree) {
        var string = ';', 
            children = tree.children,
            i; 

        if (!tree.parent) { 
            
            string += composeRootProps(tree);
        }
        string += composeNodeProps(tree); 

        
        if (children.length === 1) { 
            string += '\n' + composeNode(children[0]);
        } else if (children.length > 1) {
            for (i = 0; i < children.length; i++) {
                string += '\n(' + composeNode(children[i]) + ')';
            }
        }

        return string;
    }

    
    function composeRootProps(tree) {
        var string = 'FF[4]GM[1]CA[UTF-8]AP[besogo:' + besogo.VERSION + ']',
            x = tree.getSize().x,
            y = tree.getSize().y,
            gameInfo = editor.getGameInfo(), 
            hasGameInfo = false, 
            id; 

        if (x === y) { 
            string += 'SZ[' + x + ']';
        } else { 
            string += 'SZ[' + x + ':' + y + ']';
        }
        string += 'ST[' + editor.getVariantStyle() + ']\n'; 

        for ( id in gameInfo ) { 
            if (gameInfo.hasOwnProperty(id) && gameInfo[id]) { 
                string += id + '[' + escapeText(gameInfo[id]) + ']';
                hasGameInfo = true;
            }
        }
        string += (hasGameInfo ? '\n' : ''); 

        return string;
    }

    
    function composeNodeProps(node) {
        var string = '',
            props, 
            stone, i, j; 

        
        if (node.getType() === 'move') { 
            stone = node.move;
            string += (stone.color === 1) ? 'W' : 'B';
            string += '[' + coordsToLetters(stone.x, stone.y) + ']';
        } else if (node.getType() === 'setup') { 
            props = { AB: [], AW: [], AE: [] };
            for (i = 1; i <= node.getSize().x; i++) {
                for (j = 1; j <= node.getSize().y; j++) {
                    stone = node.getSetup(i, j);
                    if (stone) { 
                        props[ stone ].push({ x: i, y: j });
                    }
                }
            }
            string += composePointLists(props);
        }

        
        props = { CR: [], SQ: [], TR: [], MA: [], SL: [], LB: [] };
        for (i = 1; i <= node.getSize().x; i++) {
            for (j = 1; j <= node.getSize().y; j++) {
                stone = node.getMarkup(i, j);
                if (stone) { 
                    if (typeof stone === 'string') { 
                        props.LB.push({ x: i, y: j, label: stone });
                    } else { 
                        
                        stone = (['CR', 'SQ', 'TR', 'MA', 'SL'])[stone - 1];
                        props[stone].push({ x: i, y: j });
                    }
                }
            }
        }
        string += composePointLists(props);

        if (node.comment) { 
            string += (string ? '\n' : ''); 
            string += 'C[' + escapeText(node.comment) + ']';
        }

        return string;
    } 

    
    
    
    function composePointLists(lists) {
        var string = '',
            id, points, i; 

        for (id in lists) { 
            if (lists.hasOwnProperty(id)) {
                points = lists[id]; 
                if (points.length > 0) { 
                    string += id;
                    for (i = 0; i < points.length; i++) {
                        string += '[' + coordsToLetters(points[i].x, points[i].y);
                        if (points[i].label) { 
                            string += ':' + escapeText(points[i].label);
                        }
                        string += ']';
                    }
                }
            }
        }
        return string;
    }

    
    function escapeText(input) {
        input = input.replace(/\\/g, '\\\\'); 
        return input.replace(/\]/g, '\\]'); 
    }

    
    function coordsToLetters(x, y) {
        if (x === 0 || y === 0) {
            return '';
        } else {
            return numToChar(x) + numToChar(y);
        }
    }

    function numToChar(num) { 
        if (num > 26) { 
            return String.fromCharCode('A'.charCodeAt(0) + num - 27);
        } else { 
            return String.fromCharCode('a'.charCodeAt(0) + num - 1);
        }
    }
};
(function() {
'use strict';


besogo.RED  = '#be0119'; 
besogo.LRED = '#ff474c'; 
besogo.BLUE = '#0165fc'; 
besogo.PURP = '#9a0eea'; 
besogo.GREY = '#929591'; 
besogo.GOLD = '#dbb40c'; 
besogo.TURQ = '#06c2ac'; 

besogo.BLACK_STONES = 4; 
besogo.WHITE_STONES = 11; 


besogo.svgEl = function(name, attributes) {
    var attr, 
	element = document.createElementNS("http://www.w3.org/2000/svg", name);

    for ( attr in (attributes || {}) ) { 
        if (attributes.hasOwnProperty(attr)) {
            element.setAttribute(attr, attributes[attr]);
        }
    }
    return element;
};


besogo.svgShadowGroup = function() {
    var group = besogo.svgEl('g'),
        filter = besogo.svgEl('filter', { id: 'blur' }),
        blur = besogo.svgEl('feGaussianBlur', {
            in: 'SourceGraphic',
            stdDeviation: '2'
        });

    filter.appendChild(blur);
    group.appendChild(filter);
    return group;
};


besogo.svgShadow = function(x, y) {
    return besogo.svgEl("circle", {
        cx: x,
        cy: y,
        r: 43,
        stroke: 'none',
        fill: 'black',
        opacity: 0.32,
        filter: 'url(#blur)'
    });
};


besogo.realStone = function(x, y, color, index) {
    var element;

    if (color < 0) {
        color = 'black' + (index % besogo.BLACK_STONES);
    } else {
        color = 'white' + (index % besogo.WHITE_STONES);
    }
    color = 'img/' + color + '.png';

    element =  besogo.svgEl("image", {
        x: (x - 44),
        y: (y - 44),
        height: 88,
        width: 88
    });
    element.setAttributeNS('http://www.w3.org/1999/xlink', 'href', color);
    
    return element;
};


besogo.svgStone = function(x, y, color) {
    var className = "besogo-svg-greyStone"; 

    if (color === -1) { 
        className = "besogo-svg-blackStone";
    } else if (color === 1) { 
        className = "besogo-svg-whiteStone";
    }

    return besogo.svgEl("circle", {
        cx: x,
        cy: y,
        r: 42,
        'class': className
    });
};


besogo.svgCircle = function(x, y, color) {
    return besogo.svgEl("circle", {
        cx: x,
        cy: y,
        r: 27,
        stroke: color,
        "stroke-width": 8,
        fill: "none"
    });
};


besogo.svgSquare = function(x, y, color) {
    return besogo.svgEl("rect", {
        x: (x - 23),
        y: (y - 23),
        width: 46,
        height: 46,
        stroke: color,
        "stroke-width": 8,
        fill: "none"
    });
};


besogo.svgTriangle = function(x, y, color) {
    
    var pointString = "" + x + "," + (y - 30) + " " +
        (x - 26) + "," + (y + 15) + " " +
        (x + 26) + "," + (y + 15);

    return besogo.svgEl("polygon", {
        points: pointString,
        stroke: color,
        "stroke-width": 8,
        fill: "none"
    });
};


besogo.svgCross = function(x, y, color) {
    var path = "m" + (x - 24) + "," + (y - 24) + "l48,48m0,-48l-48,48";

    return besogo.svgEl("path", {
        d: path,
        stroke: color,
        "stroke-width": 8,
        fill: "none"
    });
};


besogo.svgPlus = function(x, y, color) {
    var path = "m" + x + "," + (y - 28) + "v56m-28,-28h56";

    return besogo.svgEl("path", {
        d: path,
        stroke: color,
        "stroke-width": 8,
        fill: "none"
    });
};


besogo.svgBlock = function(x, y, color) {
    return besogo.svgEl("rect", {
        x: x - 18,
        y: y - 18,
        width: 36,
        height: 36,
        stroke: "none",
        "stroke-width": 8,
        fill: color
    });
};


besogo.svgLabel = function(x, y, color, label) {
    var element,
        size;

    
    if (label.length > 3) {
        label = label.slice(0, 2) + '…';
    }

    
    switch(label.length) {
        case 1:
            size = 72;
            break;
        case 2:
            size = 56;
            break;
        case 3:
            size = 36;
            break;
    }

    element = besogo.svgEl("text", {
        x: x,
        y: y,
        dy: ".65ex", 
        "font-size": size,
        "text-anchor": "middle", 
        "font-family": "Helvetica, Arial, sans-serif",
        fill: color
    });
    element.appendChild( document.createTextNode(label) );

    return element;
};

})(); 
besogo.makeToolPanel = function(container, editor) {
    'use strict';
    var element, 
        svg, 
        labelText, 
        selectors = {}; 

    svg = makeButtonSVG('auto', 'Auto-play/navigate\n' +
        'crtl+click to force ko, suicide, overwrite\n' +
        'shift+click to jump to move'); 
    svg.appendChild(makeYinYang(0, 0));

    
    

    
    

    svg = makeButtonSVG('addB', 'Set black\nctrl+click to play'); 
    element = besogo.svgEl('g');
    element.appendChild(besogo.svgStone(0, 0, -1)); 
    
    svg.appendChild(element);

    svg = makeButtonSVG('addW', 'Set white\nctrl+click to play'); 
    element = besogo.svgEl('g');
    element.appendChild(besogo.svgStone(0, 0, 1)); 
    
    svg.appendChild(element);

    svg = makeButtonSVG('addE', 'Set empty point'); 
    element = besogo.svgEl('g');
    element.appendChild(besogo.svgStone(0, 0)); 
    element.appendChild(besogo.svgCross(0, 0, besogo.RED)); 
    svg.appendChild(element);

    svg = makeButtonSVG('circle', 'Circle'); 
    svg.appendChild(besogo.svgCircle(0, 0, 'black'));

    svg = makeButtonSVG('square', 'Square'); 
    svg.appendChild(besogo.svgSquare(0, 0, 'black'));

    svg = makeButtonSVG('triangle', 'Triangle'); 
    svg.appendChild(besogo.svgTriangle(0, 0, 'black'));

    svg = makeButtonSVG('cross', 'Cross'); 
    svg.appendChild(besogo.svgCross(0, 0, 'black'));

    svg = makeButtonSVG('block', 'Block'); 
    svg.appendChild(besogo.svgBlock(0, 0, 'black'));

    svg = makeButtonSVG('clrMark', 'Clear mark'); 
    element = besogo.svgEl('g');
    element.appendChild(besogo.svgTriangle(0, 0, besogo.GREY));
    element.appendChild(besogo.svgCross(0, 0, besogo.RED));
    svg.appendChild(element);

    svg = makeButtonSVG('label', 'Label'); 
    svg.appendChild(besogo.svgLabel(0, 0, 'black', 'A1'));

    labelText = document.createElement("input"); 
    labelText.type = "text";
    labelText.title = 'Next label';
    labelText.onblur = function() {
        editor.setLabel(labelText.value);
    };
    labelText.addEventListener('keydown', function(evt) {
        evt = evt || window.event;
        evt.stopPropagation(); 
    });
    container.appendChild(labelText);

    makeButtonText('跳过', 'Pass move', function(){
        var tool = editor.getTool();
        if (tool !== 'navOnly' && tool !== 'auto' && tool !== 'playB' && tool !== 'playW') {
            editor.setTool('auto'); 
        }
        editor.click(0, 0, false); 
    });

    makeButtonText('上升', 'Raise variation', function(){
        editor.promote();
    });

    makeButtonText('下降', 'Lower variation', function(){
        editor.demote();
    });

    makeButtonText('裁剪', 'Remove branch', function(){
        editor.cutCurrent();
    });

    editor.addListener(toolStateUpdate); 
    toolStateUpdate({ label: editor.getLabel(), tool: editor.getTool() }); 


    
    function makeButtonSVG(tool, tooltip) {
        var button = document.createElement('button'),
            svg = besogo.svgEl('svg', { 
                width: '100%',
                height: '100%',
                viewBox: '-55 -55 110 110' }), 
            selected = besogo.svgEl("rect", { 
                x: -50, 
                y: -50,
                width: 100,
                height: 100,
                fill: 'none',
                'stroke-width': 8,
                stroke: besogo.GOLD,
                rx: 20, 
                ry: 20, 
                visibility: 'hidden'
            });

        container.appendChild(button);
        button.appendChild(svg);
        button.onclick = function() {
            editor.setTool(tool);
        };
        button.title = tooltip;
        selectors[tool] = selected;
        svg.appendChild(selected);
        return svg; 
    }

    
    function makeButtonText(text, tip, callback) {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = text;
        button.title = tip;
        button.onclick = callback;
        container.appendChild(button);
    }

    
    function toolStateUpdate(msg) {
        var tool;
        if (msg.label) {
            labelText.value = msg.label;
        }
        if (msg.tool) {
            for (tool in selectors) { 
                if (selectors.hasOwnProperty(tool)) {
                    if (msg.tool === tool) {
                        selectors[tool].setAttribute('visibility', 'visible');
                    } else {
                        selectors[tool].setAttribute('visibility', 'hidden');
                    }
                }
            }
        }
    }

    
    function makeYinYang(x, y) {
        var element = besogo.svgEl('g');

        
        element.appendChild( besogo.svgEl("path", {
            d: "m" + x + "," + (y - 44) + " a44 44 0 0 1 0,88z",
            stroke: "none",
            fill: "black"
        }));

        
        element.appendChild( besogo.svgEl("path", {
            d: "m" + x + "," + (y + 44) + "a44 44 0 0 1 0,-88a22 22 0 0 1 0,44z",
            stroke: "none",
            fill: "white"
        }));

        
        element.appendChild( besogo.svgEl("circle", {
            cx: x,
            cy: y + 22,
            r: 22,
            stroke: "none",
            fill: "black"
        }));

        return element;
    }
};
besogo.makeTreePanel = function(container, editor) {
    'use strict';
    var svg,
        pathGroup,
        bottomLayer,
        currentMarker,
        SCALE = 0.25; 

    rebuildNavTree();
    editor.addListener(treeUpdate);


    
    function treeUpdate(msg) {
        if (msg.treeChange) { 
            rebuildNavTree(); 
        } else if (msg.navChange) { 
            updateCurrentMarker(); 
        } else if (msg.stoneChange) { 
            updateCurrentNodeIcon();
        }
    }

    
    function updateCurrentMarker() {
        var current = editor.getCurrent();

        setSelectionMarker(currentMarker);
        setCurrentMarker(current.navTreeMarker);
    }

    
    function setCurrentMarker(marker) {
        var width = container.clientWidth,
            height = container.clientHeight,
            top = container.scrollTop,
            left = container.scrollLeft,
            markX = (marker.getAttribute('x') - 5) * SCALE, 
            markY = (marker.getAttribute('y') - 5) * SCALE,
            GRIDSIZE = 120 * SCALE; 

        if (markX < left) { 
            container.scrollLeft = markX;
        } else if (markX + GRIDSIZE > left + width) {
            container.scrollLeft = markX + GRIDSIZE - width;
        }
        if (markY < top) { 
            container.scrollTop = markY;
        } else if (markY + GRIDSIZE > top + height) {
            container.scrollTop = markY + GRIDSIZE - height;
        }

        marker.setAttribute('opacity', 1); 
        marker.onmouseover = null; 
        marker.onmouseout = null; 
        bottomLayer.appendChild(marker); 
        currentMarker = marker;
    }

    
    function setSelectionMarker(marker) {
        marker.setAttribute('opacity', 0); 
        marker.onmouseover = function() { 
            marker.setAttribute('opacity', 0.5);
        };
        marker.onmouseout = function() { 
            marker.setAttribute('opacity', 0);
        };
        svg.appendChild(marker); 
    }

    
    function rebuildNavTree() {
        var current = editor.getCurrent(), 
            root = editor.getRoot(), 
            nextOpen = [], 
            oldSvg = svg, 
            background = besogo.svgEl("rect", { 
                height: '100%',
                width: '100%',
                'class': 'besogo-svg-board besogo-svg-backer'
            }),
            path, 
            width, 
            height;

        svg = besogo.svgEl("svg");
        bottomLayer = besogo.svgEl("g"); 
        pathGroup = besogo.svgEl("g"); 

        svg.appendChild(background); 
        svg.appendChild(bottomLayer); 
        svg.appendChild(pathGroup); 

        path = recursiveTreeBuild(root, 0, 0, nextOpen); 
        pathGroup.appendChild(finishPath(path, 'black')); 

        width = 120 * nextOpen.length; 
        height = 120 * Math.max.apply(Math, nextOpen);
        svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        svg.setAttribute('height', height * SCALE); 
        svg.setAttribute('width', width * SCALE);

        if (oldSvg) { 
            container.replaceChild(svg, oldSvg);
        } else { 
            container.appendChild(svg);
        }

        setCurrentMarker(current.navTreeMarker); 
    } 

    
    function recursiveTreeBuild(node, x, y, nextOpen) {
        var children = node.children,
            position,
            path,
            childPath,
            i; 

        if (children.length === 0) { 
            path = 'm' + svgPos(x) + ',' + svgPos(y); 
        } else { 
            position = (nextOpen[x + 1] || 0); 
            position = (position < y) ? y : position; 

            if (y < position - 1) { 
                y = position - 1; 
            }
            
            path = recursiveTreeBuild(children[0], x + 1, position, nextOpen) +
                extendPath(x, y, nextOpen);

            
            for (i = 1; i < children.length; i++) {
                position = nextOpen[x + 1];
                childPath = recursiveTreeBuild(children[i], x + 1, position, nextOpen) +
                    extendPath(x, y, nextOpen, position - 1);
                
                pathGroup.appendChild(finishPath(childPath, 'black'));
            }
        }
        svg.appendChild(makeNodeIcon(node, x, y));
        addSelectionMarker(node, x, y);

        nextOpen[x] = y + 1; 
        return path;
    } 

    function makeNodeIcon(node, x, y) { 
        var element,
            color;

        switch(node.getType()){
            case 'move': 
                color = node.move.color;
                element = besogo.svgEl("g");
                element.appendChild( besogo.svgStone(svgPos(x), svgPos(y), color) );
                color = (color === -1) ? "white" : "black";
                element.appendChild( besogo.svgLabel(svgPos(x), svgPos(y), color,
                    '' + node.moveNumber) );
                break;
            case 'setup': 
                element = besogo.svgEl("g");
                element.appendChild(besogo.svgStone(svgPos(x), svgPos(y))); 
                element.appendChild(besogo.svgPlus(svgPos(x), svgPos(y), besogo.RED));
                break;
            default: 
                element = besogo.svgStone(svgPos(x), svgPos(y)); 
        }
        node.navTreeIcon = element; 
        node.navTreeX = x; 
        node.navTreeY = y;

        return element;
    } 

    function updateCurrentNodeIcon() { 
        var current = editor.getCurrent(), 
            oldIcon = current.navTreeIcon,
            newIcon = makeNodeIcon(current, current.navTreeX, current.navTreeY);
        svg.replaceChild(newIcon, oldIcon);
    }

    function addSelectionMarker(node, x, y) {
        var element = besogo.svgEl("rect", { 
            x: svgPos(x) - 55,
            y: svgPos(y) - 55,
            width: 110,
            height: 110,
            fill: besogo.TURQ
        });
        element.onclick = function() {
	    if(disable_tree_status == false){
		if(client == 'MOBILE'){
		    var a = besogo.editor.getCurrent().moveNumber;
		    var b = besogo.editor.getCurrent()
		    while(b.children.length){
			b = b.children[0];
			a++;
		    }
		    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[15].max = a;
		    document.body.childNodes[1].childNodes[1].childNodes[0].childNodes[15].value = node.moveNumber;
		}
		editor.setCurrent(node);
	    }
        };

        node.navTreeMarker = element; 
        setSelectionMarker(element); 
    }

    function extendPath(x, y, nextOpen, prevChildPos) { 
        var childPos = nextOpen[x + 1] - 1; 
        if (childPos === y) { 
            return 'h-120'; 
        } else if (childPos === y + 1) { 
            return 'l-120,-120'; 
        } else if (prevChildPos && prevChildPos !== y) {
            
            return 'l-60,-60v-' + (120 * (childPos - prevChildPos));
        } else { 
            return 'l-60,-60v-' + (120 * (childPos - y - 1)) + 'l-60,-60';
        }
    }

    function finishPath(path, color) { 
        var element = besogo.svgEl("path", {
            d: path,
            stroke: color,
            "stroke-width": 8,
            fill: "none"
        });
        return element;
    }

    function svgPos(x) { 
        return (x * 120) + 60;
    }
};
