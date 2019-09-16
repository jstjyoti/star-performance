var  _uniqueid=0;
/**
    *this is only for checking whether rating is Fractional or not taking Number.
    *If rating is fractional then gradient is used 
    *
    * @param {number} rating value out of number of stars
    * @returns {Boolean} true or false for rating fractional or not
**/
function _isFractionalRating(rating) {
    return rating-(rating>> 0);
}
/**
    *this is only for checking whether name is method or not, used for calling APIs attached to update and draw
    *
    * @param {String} name name of a method 
    * @returns {Boolean} true or false for type of methodname is function or not
**/
function _isMethod(nameofMethod) {
    return (typeof nameofMethod === 'function');
}
/** 
    *this function checks all the values of valid digits , percentage and pixel values 
    *and then breaks its into number and unit part so that on using values are clear,later  used in setting value in _ValidateSet 
    *
    * @param {String} size from value passed in attributes
    * @param {String} str keeps name of attribute checked i.e 100% ofHeight 
    * @returns {Object} returns an object having value and unit
**/
function _checkSize(size, str) {
    str = str ? 'of ' + str : '';
    let value= +(size+"").replace(/px/g,"");

    if (!value) {
        if (size) {
            console.error("improper size "+str);
        }
        return {
            value: null,
            unit: ''
        };
    }
    return {
        value: value,
        unit:''
    };
}
/**
  *this function validates color values of any fill stroke rated or unrated are permissible or not
  *
  * @param   {String} color 
  * @returns {Boolean} true if color is valid hex or rgb
  *          
*/
function _validateColor(color) {
    if (!color) {
        return false;
    }
    if (typeof color === 'number') {
        console.error("Incorrect color specified");
        return false;
    }
    if (color.startsWith('#')) {
        if (!color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/g)) {
            console.error("Incorrect hex color code");
            return false;
        }
    } else if (color.startsWith('rgb(')) {
        if (!color.replace(/\s/g, '').match(/^rgb\((\d+),(\d+),(\d+)\)$/g)) {
            console.error("Incorrect rgb color code");
            return false;
        }
    }
    return color;
}

class SVGElement {
    constructor(tag) {
        this._elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
        this.attrs = {};
    }
    getDomsvg() {
        return this._elem;
    }
    removeDomsvg() {
        this._elem.parentNode.removeChild(this._elem);
    }

    appendChild(child) {
        if (child instanceof Node) {
            this._elem.appendChild(child);
        } else if (child instanceof SVGElement) {
            this._elem.appendChild(child.getDomsvg());
        } else {
            console.error("Child must be Node or SVGElement");
        }
    }
    removeChild(child) {
        if (child instanceof Node) {
            this._elem.removeChild(child);
        } else if (child instanceof SVGElement) {
            this._elem.removeChild(child.getDomsvg());
        } else {
            console.error("Child must be Node or SVGElement");
        }
    }

    setAttributes(attrs) {
        let hasChange = false;
        for (let attrName in attrs) {
            if (this.attrs[attrName] !== attrs[attrName]) {
                this._elem.setAttribute(attrName, attrs[attrName]);
                this.attrs[attrName] = attrs[attrName];
                hasChange = true;
            }
        }
        return hasChange;
    }
}
class SVGContainer extends SVGElement {
    constructor(container, height, width) {
        super("svg");//calling constructor of svgElement
        this.getDomsvg().setAttribute("xmlns", "https://www.w3.org/2000/svg");
        container.appendChild(this.getDomsvg());
        this.setAttributes({ height, width });
        [height, width] = this.getSize();
        this.height = height;
        this.width = width;
    }

    getSize() {
        let rect = this.getDomsvg().getBoundingClientRect();
        return [rect.height, rect.width]
    }

    getDefinition() {
        return this._def;
    }

    addDefinition(def) {
        if (def instanceof Definition) {
            this.appendChild(def.defs);
            this._def = def;
        }
    }

    update(height, width) {
        if (this.setAttributes({ height, width })) {
            this.height = height;
            this.width = width;
        }
        return [this.height, this.width]//like a rectangle
    }
}
class Definition {
    constructor(svg) {
        this.defs = new SVGElement("defs");
        this.linearGradient = new SVGElement("linearGradient"),
            this.strokeLinearGradient = new SVGElement("linearGradient"),
            this.Rated = new SVGElement("stop"),
            this.NonRated = new SVGElement("stop"),
            this.strokeRated = new SVGElement("stop"),
            this.strokeNonRated = new SVGElement("stop");
        this.linearGradient.appendChild(this.Rated);
        this.linearGradient.appendChild(this.NonRated);
        this.strokeLinearGradient.appendChild(this.strokeRated);
        this.strokeLinearGradient.appendChild(this.strokeNonRated);
        this.defs.appendChild(this.linearGradient);
        this.defs.appendChild(this.strokeLinearGradient);
        this._config = {};
        this._defid=++_uniqueid;
        svg.addDefinition(this);

    }
    update(rating, ratedFill, nonratedFill, ratedStroke, nonratedStroke, direction, flow) {
        let ratingFraction = (rating - Math.floor(rating)).toFixed(2),
            _configsLG = {"x2": direction == 'row' ? "100%" : "0%","y2": direction == 'column' ? "100%" : "0%"};
        if (ratingFraction === this._config.ratingFraction && this._config.ratedFill === ratedFill && this._config.nonratedFill === nonratedFill && this._config.ratedStroke === ratedStroke && this._config.direction === direction && this._config.flow === flow) {
            return;
        } 
        else {
            this._config.ratingFraction = ratingFraction;
            this._config.ratedFill = ratedFill;
            this._config.nonratedFill = nonratedFill;
            this._config.ratedStroke = ratedStroke;
            this._config.direction = direction;
            this._config.flow = flow;
        }
        this.linearGradient.setAttributes({
            "id": "partial-fill"+this._defid,
            ..._configsLG
        });
        this.strokeLinearGradient.setAttributes({
            "id": "partial-stroke"+this._defid,
            ..._configsLG
        });
        if (flow == 'reverse') {
            [ratedFill, nonratedFill] = [nonratedFill, ratedFill];
            [ratedStroke, nonratedStroke] = [nonratedStroke, ratedStroke];
        }
        this.Rated.setAttributes({
            "offset": (ratingFraction * 100) + "%",
            "style": "stop-color:" + ratedFill + ";stop-opacity:1;"
        });
        this.NonRated.setAttributes({
            "offset": (ratingFraction * 100) + "%",
            "style": "stop-color:" + nonratedFill + ";stop-opacity:1;"
        });
        this.strokeRated.setAttributes({
            "offset": (ratingFraction * 100) + "%",
            "style": "stop-color:" + ratedStroke + ";stop-opacity:1;"
        });
        this.strokeNonRated.setAttributes({
            "offset": (ratingFraction * 100) + "%",
            "style": "stop-color:" + nonratedStroke + ";stop-opacity:1;"
        });
    }
}
class Rating {
    constructor(container, attribs) {
        if (!(container instanceof HTMLElement)) {
            console.error(" Where to draw the class ...no html container found");
            return null;
        }
        this._elem = {};
        this._config = {};
        this._internalConfig = {};
        this._onDraw = {};
        this._internalConfig.firstDraw = true;
        this._elem.container = container;
        this._config.height = 400;
        this._config.width = 400;
        this._config.NofStars = 5
        this._config.rating = undefined;
        this._config.orientation = 'left-to-right';
        this._config.padding = 1;
        this._config.justifyContent = 'start';
        this._config.alignItems = 'center';
        this._config.strokeWidth = 0;
        this._config.ratedFill = "#00f";
        this._config.nonratedFill = "#00ffff";
        this._config.ratedStroke = "none";
        this._config.nonratedStroke = "none";
        //usefull internally
        this._internalConfig.direction = 'row';
        this._internalConfig.startX=0;
        this._internalConfig.startY=0;
        this._internalConfig.xShift=0;
        this._internalConfig.yShift=0;
        this._internalConfig.flow = '';
        this._elem.svg = new SVGContainer(container, this._config.height, this._config.width);
        this._elem.stars = [];
        if (attribs) {
            if (this._validateSet(attribs)) {
                this._calculateSide(this._config.padding, this._config.strokeWidth);
                this._internalConfig.requestedAnimationFrame = true;
                window.requestAnimationFrame(() => {
                    this._draw();
                });
            } else {
                this._elem.svg.removeDomsvg();
                console.error("Stopping execution");
                return null;
            }
        } else {
            this._calculateSide(this._config.padding, this._config.strokeWidth);
            this._internalConfig.requestedAnimationFrame = true;
            window.requestAnimationFrame(() => {
                this._draw();
            });
        }
    }
    _calculateSide(padding, strokeWidth){
        let side, initialSide;
        initialSide = this._internalConfig.direction === 'row' ? this._config.width / this._config.NofStars : this._config.width;
            side = this._internalConfig.direction === 'column' ? this._config.height / this._config.NofStars : this._config.height;
            initialSide = side < initialSide ? side : initialSide;
            if (strokeWidth !== undefined) {
                if (strokeWidth < 0 || strokeWidth > 0.10 * initialSide) {
                    console.error("Incorrect strokeWidth setting to default");
                } else {
                    this._config.strokeWidth = strokeWidth;
                }
            }
            if (padding !== undefined) {
                if (padding < 1 || padding > 0.10 * initialSide) {
                    console.error("Incorrect padding setting to default");
                } else {
                    this._config.padding = 1;
                }
            }
            side = initialSide - (this._config.padding * 2) - (this._config.strokeWidth * 2);

            if (side < 10) {
                return false;
            }
            if (side !== this._internalConfig.side || initialSide !== this._internalConfig.initialSide) {
                this._internalConfig.side = side;
                this._internalConfig.initialSide = initialSide;
            }
    }
    _validateSet(attribs){
        let currentVal, calcSide, strokeWidth, padding;
        if (attribs.orientation !== undefined) {
            if (['left-to-right', 'right-to-left', 'top-to-bottom', 'bottom-to-top'].includes(attribs.orientation) && currentVal !== this._config.orientation) {
                this._config.orientation = attribs.orientation;
                attribs.direction = (attribs.orientation === 'top-to-bottom' || attribs.orientation === 'bottom-to-top') ? 'column' : 'row';
                if (this._internalConfig.direction !== attribs.direction) {
                    this._internalConfig.direction = attribs.direction;
                    calcSide = true;
                }
                this._internalConfig.flow = (attribs.orientation === 'left-to-right' || attribs.orientation === 'top-to-bottom') ? '' : 'reverse';
            }
        }

        if (attribs.height !== undefined) {
            currentVal = _checkSize(attribs.height);
            if (currentVal.value && currentVal.value >= 20 && currentVal.value !== this._config.height) {
                this._config.height = currentVal.value;
                calcSide = true;
            }
        }

        if (attribs.width !== undefined) {
            currentVal = _checkSize(attribs.width);
            if (currentVal.value && currentVal.value >= 20 && currentVal.value !== this._config.width) {
                this._config.width = currentVal.value;
                calcSide = true;
            }
        }

        if (attribs.stars !== undefined) {
            currentVal = +attribs.stars;
            if (currentVal > 0 && currentVal !== this._config.NofStars) {
                this._config.NofStars = currentVal;
                calcSide = true;
            } else if (!currentVal) {
                console.error("Incorrect value for stars: " + attribs.stars);
            }
        }

        if (attribs.padding !== undefined) {
            currentVal = _checkSize(attribs.padding);
            if (currentVal.value && currentVal.value !== this._config.padding) {
                padding = currentVal.value;
            }
        }

        if (attribs.strokeWidth !== undefined) {
            currentVal = _checkSize(attribs.strokeWidth);
            if (currentVal.value && currentVal.value !== this._config.strokeWidth) {
                strokeWidth = currentVal.value;
            }
        }

        if (attribs.rating !== undefined) {
            currentVal = +attribs.rating; //using toFixed reduces performance so do it later
            if (currentVal >= 0 && currentVal <= this._config.NofStars && currentVal !== this._config.rating) {
                this._config.rating = currentVal;
            } else if (!currentVal) {
                console.error('Incorrect rating value: ' + attribs.rating);
            }
        }

        if(attribs.justifyContent != undefined) {
            if (['start', 'end', 'center', 'space-evenly'].includes(attribs.justifyContent) && attribs.justifyContent !== this._config.justifyContent) {
                this._config.justifyContent = attribs.justifyContent;
            }
        }
        if (attribs.alignItems != undefined) {
            if (['start', 'end', 'center'].includes(attribs.alignItems) && attribs.alignItems !== this._config.alignItems) {
                this._config.alignItems = attribs.alignItems;
            }
        }
        if (attribs.ratedFill !== undefined) {
            currentVal = _validateColor(attribs.ratedFill);
            if (currentVal && currentVal !== this._config.ratedFill) {
                this._config.ratedFill = currentVal;
            }
            else if (!currentVal) 
            {
                console.error('Incorrect color for ratedFill: ' + attribs.ratedFill);
            }
        }
        if (attribs.nonratedFill !== undefined) {
            currentVal = _validateColor(attribs.nonratedFill);
            if (currentVal && currentVal !== this._config.nonratedFill) {
                this._config.nonratedFill = currentVal;
            } else if (!currentVal) {
                console.error('Incorrect color for ratedFill: ' + attribs.nonratedFill);
            }
        }
        if (attribs.ratedStroke !== undefined) {
            currentVal = _validateColor(attribs.ratedStroke);
            if (currentVal && currentVal !== this._config.ratedStroke) {
                this._config.ratedStroke = currentVal;
            } else if (!currentVal) {
                console.error('Incorrect color for ratedFill: ' + attribs.ratedStroke);
            }
        }
        if (attribs.nonratedStroke !== undefined) {
            currentVal = _validateColor(attribs.nonratedStroke);
            if (currentVal && currentVal !== this._config.nonratedStroke) {
                this._config.nonratedStroke = currentVal;
            } else if (!currentVal) {
                console.error('Incorrect color for ratedFill: ' + attribs.nonratedStroke);
            }
        }
        if (calcSide) {
            this._calculateSide(padding, strokeWidth);
        }
        return true;
    }
    _orientationShiftsCalculation(){
        let xShift = 0, yShift = 0, startX = 0, startY = 0,
        justifyContent = this._config.justifyContent,
        alignItems = this._config.alignItems,
        side = this._internalConfig.side,
        initialSide = this._internalConfig.initialSide,
        height = this._config.height,
        width = this._config.width,
        NofStars = this._config.NofStars;
            if (this._internalConfig.direction == 'row') {
                xShift = initialSide;
                if (justifyContent == 'start') {
                    startX = (initialSide / 2);
                } else if (justifyContent == 'center') {
                    startX = (initialSide / 2) + ((width - (initialSide * NofStars)) / 2);
                } else if (justifyContent == 'end') {
                    startX = (width - (initialSide * NofStars)) + (initialSide / 2);
                } else if (justifyContent == 'space-evenly') {
                    xShift = width / NofStars;
                    startX = xShift / 2;
                }
                if (alignItems == 'center') {
                    startY = ((initialSide - side) / 2) + ((height - initialSide) / 2);
                } else if (alignItems == 'start') {
                    startY = ((initialSide - side) / 2);
                } else if (alignItems == 'end') {
                    startY = (height - initialSide);
                }
            } else if (this._internalConfig.direction == 'column') {
                yShift = initialSide;
                if (justifyContent == 'start') {
                    startY = (initialSide - side) / 2;
                } else if (justifyContent == 'center') {
                    startY = ((initialSide - side) / 2);
                } else if (justifyContent == 'end') {
                    startY = (height - (initialSide * NofStars));
                } else if (justifyContent == 'space-evenly') {
                    yShift = height / NofStars;
                    startY = (yShift - side) / 2;
                }
                if (alignItems == 'center') {
                    startX = (initialSide / 2) + ((width - initialSide) / 2);
                } else if (alignItems == 'start') {
                    startX = initialSide / 2;
                } else if (alignItems == 'end') {
                    startX = width - (initialSide / 2);
                }
            }
            if (this._internalConfig.startX !== startX) {
                this._internalConfig.startX = startX;
            }
            if (this._internalConfig.startY !== startY) {
                this._internalConfig.startY = startY;
            }
            if (this._internalConfig.xShift !== xShift) {
                this._internalConfig.xShift = xShift;
            }
            if (this._internalConfig.yShift !== yShift) {
                this._internalConfig.yShift = yShift;
            }
            this._onDraw['_reassignPath'] = true;
    }
    _getPath(side) {
        let str ="",
            ax = 0.15,
            bx = (1 - 2 * ax) / 2,
            cx=0.3,
            dx = 0.5,
            ex = 0.3,
            ay = 0.3, by = 0.3,
            cy = (1 - ay - by),
            dy = 0.25,
            am = ax / ay;
        cx = (am * cy);
        ex = ex * am;
        str += "l" + (ax * side) + "," + (ay * side) 
        + " h" + (bx * side)
         +" l-" + (cx * side) + "," + (by * side)
        + " l" + (cx * side) + "," + (cy * side)
        + " l-" + (dx * side) + ",-" + (dy * side)
         + " l-" + (dx * side) + "," + (dy * side)
         + " l" + (cx * side) + ",-" + (cy * side)
         + " l-" + (cx * side) + ",-" + (by * side)
         +" h" + (bx * side)
         + " z";
        
        return str;
    }
    _draw() {
        this._internalConfig.requestedAnimationFrame = false;
        if (_isMethod(this.onPreDraw )) {
            this.onPreDraw();
        } else if (this.onDraw) {
            console.error('onDraw must be a function');
        }
        let i, j,
            rating = !this._config.rating && this._config.rating != 0 ? this._config.NofStars : this._config.rating,
            currentStars = this._elem.stars.length;

        this._internalConfig.relativePath = this._getPath(this._internalConfig.side);
        this._elem.svg.update(this._config.height, this._config.width);
        let defs = this._elem.svg.getDefinition();
        if (_isFractionalRating(rating)) {
            
            if (!defs) {
                defs = new Definition(this._elem.svg);
            }
            defs.update(rating, this._config.ratedFill, this._config.nonratedFill, this._config.ratedStroke, this._config.nonratedStroke, this._internalConfig.direction, this._internalConfig.flow);
        }
        this._orientationShiftsCalculation();
        for (i = 0; i < Math.max(this._config.NofStars,currentStars); i++) {
            j = this._internalConfig.flow == 'reverse' ? this._config.NofStars - i - 1 : i;
            if (i >= currentStars) {
                let star = new SVGElement("path");
                this._elem.stars.push(star);
                this._elem.svg.appendChild(star);
            } else if (i >= this._config.NofStars) {
                this._elem.stars.pop().removeDomsvg();
            }
            if (i < this._config.NofStars) {
                if (_isFractionalRating(rating) && Math.ceil(rating) == j + 1) {
                    this._elem.stars[i].setAttributes({
                        "fill": "url(#partial-fill"+defs._defid+")",
                        "stroke": "url(#partial-stroke"+defs._defid+")",
                        "stroke-width": this._config.strokeWidth + "px",
                        "d": 'M' + (this._internalConfig.startX + (this._internalConfig.xShift * i)) + ',' + (this._internalConfig.startY + (this._internalConfig.yShift * i)) + ' ' + this._internalConfig.relativePath
                    });
                } else {
                    this._elem.stars[i].setAttributes({
                        "fill": j < Math.ceil(rating) ? this._config.ratedFill : this._config.nonratedFill,
                        "stroke": j < Math.ceil(rating) ? this._config.ratedStroke : this._config.nonratedStroke,
                        "stroke-width": this._config.strokeWidth + "px",
                        "d": 'M' + (this._internalConfig.startX + (this._internalConfig.xShift * i)) + ',' + (this._internalConfig.startY + (this._internalConfig.yShift * i)) + ' ' + this._internalConfig.relativePath
                    });
                }
            }
        }
        if (_isMethod(this.onDraw )) {
            this.onDraw();
        } 
        
        this._internalConfig.firstDraw = false;
    }
    update(attribs) {
        if (attribs) {
            if (this._validateSet(attribs)) {
                if (!this._internalConfig.requestedAnimationFrame) {
                    window.requestAnimationFrame(() => {
                        this._draw();
                    });
                    this._internalConfig.requestedAnimationFrame = true;
                }
            } else {
                console.error("Stopping execution");
                return null;
            }
        }
        if (_isMethod(this.onUpdate)) {
            this.onUpdate(this._config);
        }
    }
}