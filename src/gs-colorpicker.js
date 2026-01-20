// @ts-check
/*!
 * gs-colorpicker
 * https://github.com/Alkadia/gs-colorpicker
 *
 * Copyright (c) 2026, Alkadia.
 * Released under the MIT License.
 */

import {
    COLOR_NAMES,
    PALETTE_MATERIAL_500,
    PALETTE_MATERIAL_CHROME,
    rgbToHex,
    hslToRgb,
    rgbToHsl,
    rgbToHsv,
    rgbToInt,
    intToRgb,
    cssColorToRgb,
    cssColorToRgba,
    parseColorToRgb,
    parseColorToRgba,
    parseColorToHsl,
    parseColorToHsla,
    parseColor,
    getLuminance,
    limit,
    ensureArray,
    nvl
} from './utils.js';
const isPlainObject = value => value?.constructor === Object;

let  HTML_BOX = `
<div class="gs-colorpicker-row gs-colorpicker-stack gs-colorpicker-row-top">
    <canvas class="gs-colorpicker-sl gs-colorpicker-transparent"></canvas>
    <div class="gs-colorpicker-dot"></div>
</div>
<div class="gs-colorpicker-row">
   
    <div class="gs-colorpicker-stack gs-colorpicker-transparent gs-colorpicker-circle">
        <div class="gs-colorpicker-preview">
            <input class="gs-colorpicker-clipbaord" type="text">
        </div>
    </div>
    
    <div class="gs-colorpicker-column color-sliders">
        <div class="gs-colorpicker-cell gs-colorpicker-stack">
            <canvas class="gs-colorpicker-h"></canvas>
            <div class="gs-colorpicker-dot"></div>
        </div>
        <div class="gs-colorpicker-cell gs-colorpicker-alpha gs-colorpicker-stack" show-on-alpha>
            <canvas class="gs-colorpicker-a gs-colorpicker-transparent"></canvas>
            <div class="gs-colorpicker-dot"></div>
        </div>
    </div>
    
    <div class="gs-colorpicker-stack gs-colorpicker-eyedropper">
            <svg stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M7 13.161L12.4644 7.6966C12.8549 7.30607 13.4881 7.30607 13.8786 7.6966L15.9999 9.81792C16.3904 10.2084 16.3904 10.8416 15.9999 11.2321L14.0711 13.161M7 13.161L4.82764 15.3334C4.73428 15.4267 4.66034 15.5376 4.61007 15.6597L3.58204 18.1563C3.07438 19.3892 4.30728 20.6221 5.54018 20.1145L8.03681 19.0865C8.1589 19.0362 8.26981 18.9622 8.36317 18.8689L14.0711 13.161M7 13.161H14.0711" stroke="#000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M13.878 3.45401L15.9993 5.57533M20.242 9.81798L18.1206 7.69666M15.9993 5.57533L17.4135 4.16112C17.8041 3.7706 18.4372 3.7706 18.8277 4.16112L19.5349 4.86823C19.9254 5.25875 19.9254 5.89192 19.5349 6.28244L18.1206 7.69666M15.9993 5.57533L18.1206 7.69666" stroke="#000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    </div>
    
</div>
<div class="gs-colorpicker-row gs-colorpicker-hsl" show-on-hsl>
    <label>H</label>
    <input nameref="H" type="number" maxlength="3" min="0" max="360" value="0">
    <label>S</label>
    <input nameref="S" type="number" maxlength="3" min="0" max="100" value="0">
    <label>L</label>
    <input nameref="L" type="number" maxlength="3" min="0" max="100" value="0">
</div>
<div class="gs-colorpicker-row gs-colorpicker-rgb" show-on-rgb>
    <label>R</label>
    <input nameref="R" type="number" maxlength="3" min="0" max="255" value="0">
    <label>G</label>
    <input nameref="G" type="number" maxlength="3" min="0" max="255" value="0">
    <label>B</label>
    <input nameref="B" type="number" maxlength="3" min="0" max="255" value="0">
</div>
<div class="gs-colorpicker-row gs-colorpicker-rgbhex gs-colorpicker-single-input" show-on-single-input>
    <label>HEX</label>
    <input nameref="RGBHEX" type="text" pleceholder="HEX" select-on-focus>
</div>
<div class="gs-colorpicker-row gs-colorpicker-palette"></div>
`;

const VERSION = '1.2.2';

const IS_EDGE = typeof window !== 'undefined' && window.navigator.userAgent.indexOf('Edge') > -1,
    IS_IE11 = typeof window !== 'undefined' && window.navigator.userAgent.indexOf('rv:') > -1;

const DEFAULT = {
    id: null,
    attachTo: 'body',
    showHSL: true,
    showRGB: true,
    showHEX: true,
    showAlpha: false,
    color: '#ff0000',
    palette: null,
    paletteEditable: false,
    useAlphaInPalette: 'auto', //true|false|auto
    slBarSize: [232, 150],
    hueBarSize: [130, 11],
    alphaBarSize: [130, 11]
};

const HUE = 'H',
    SATURATION = 'S',
    LUMINANCE = 'L',
    RGB = 'RGB',
    RED = 'R',
    GREEN = 'G',
    BLUE = 'B',
    RGBHEX = 'RGBHEX',
    COLOR = 'COLOR',
    RGBA_USER = 'RGBA_USER',
    HSLA_USER = 'HSLA_USER',
    ALPHA = 'ALPHA';

function parseElement(element, defaultElement, fallToDefault) {
    if (!element) {
        return defaultElement;
    } else if (element instanceof HTMLElement) {
        return element;
    } else if (element instanceof NodeList) {
        return element[0];
    } else if (typeof element == 'string') {
        return document.querySelector(element);
    } else if (element.jquery) {
        return element.get(0); //TODO: da testare parseElement con jQuery
    } else if (fallToDefault) {
        return defaultElement;
    } else {
        return null;
    }
}

function parseElements(selector) {
    if (!selector) {
        return [];
    } else if (Array.isArray(selector)) {
        return selector;
    } else if (selector instanceof HTMLElement) {
        return [selector];
    } else if (selector instanceof NodeList) {
        return [...selector];
    } else if (typeof selector == 'string') {
        return [...document.querySelectorAll(selector)];
    } else if (selector.jquery) {
        return selector.get(); //TODO: da testare parseElements con jQuery
    } else {
        return [];
    }
}

function canvasHelper(canvas) {
    const ctx = canvas.getContext('2d'),
        width = +canvas.width,
        height = +canvas.height;
    // questo gradiente da bianco (alto) a nero (basso) viene applicato come sfondo al canvas
    const whiteBlackGradient = ctx.createLinearGradient(1, 1, 1, height - 1);
    whiteBlackGradient.addColorStop(0, 'white');
    whiteBlackGradient.addColorStop(1, 'black');
    return {
        setHue(hue) {
            // gradiente con il colore relavito a lo HUE da sinistra a destra partendo da trasparente a opaco
            // la combinazione del gradiente bianco/nero e questo permette di avere un canvas dove
            // sull'asse delle ordinate è espressa la saturazione, e sull'asse delle ascisse c'è la luminosità
            const colorGradient = ctx.createLinearGradient(1, 0, width - 1, 0);
            colorGradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
            colorGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 1)`);
            // applico i gradienti
            ctx.fillStyle = whiteBlackGradient;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = colorGradient;
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'source-over';
        },

        grabColor(x, y) {
            // recupera il colore del pixel in formato RGBA
            return ctx.getImageData(x, y, 1, 1).data;
        },

        findColor(r, g, b) {
            const [, s, v] = rgbToHsv(r, g, b);
            const x = s * width;
            const y = height - (v * height);
            return [x, y];
        }
    };
}

function parseAttrBoolean(value, ifNull, ifEmpty) {
    if (value === null) {
        return ifNull;
    } else if (/^\s*$/.test(value)) {
        return ifEmpty;
    } else if (/true|yes|1/i.test(value)) {
        return true;
    } else if (/false|no|0/i.test(value)) {
        return false;
    } else {
        return ifNull;
    }
}

function parseAttrDimensionArray(value, ifNull, ifEmpty) {
    if (value === null) {
        return ifNull;
    } else if (/^\s*$/.test(value)) {
        return ifEmpty;
    } else {
        const dimensions = value.split(',').map(Number);
        if (dimensions.length === 2 && dimensions[0] && dimensions[1]) {
            return dimensions
        }
        return ifNull;
    }
}

function copyOptionsFromElement(options, element, attrPrefix = 'acp-') {
    // getAttribute() dovrebbe restituire null se l'attr non esiste, ma le vecchie specifiche prevedono il ritorno di una stringa vuota
    //  quindi è meglio verificare l'esistenza dell'attr con hasAttribute()
    if (element.hasAttribute(attrPrefix + 'show-hsl')) {
        options.showHSL = parseAttrBoolean(element.getAttribute(attrPrefix + 'show-hsl'), DEFAULT.showHSL, true);
    }
    if (element.hasAttribute(attrPrefix + 'show-rgb')) {
        options.showRGB = parseAttrBoolean(element.getAttribute(attrPrefix + 'show-rgb'), DEFAULT.showRGB, true);
    }
    if (element.hasAttribute(attrPrefix + 'show-hex')) {
        options.showHEX = parseAttrBoolean(element.getAttribute(attrPrefix + 'show-hex'), DEFAULT.showHEX, true);
    }
    if (element.hasAttribute(attrPrefix + 'show-alpha')) {
        options.showAlpha = parseAttrBoolean(element.getAttribute(attrPrefix + 'show-alpha'), DEFAULT.showAlpha, true);
    }
    if (element.hasAttribute(attrPrefix + 'palette-editable')) {
        options.paletteEditable = parseAttrBoolean(element.getAttribute(attrPrefix + 'palette-editable'), DEFAULT.paletteEditable, true);
    }
    if (element.hasAttribute(attrPrefix + 'sl-bar-size')) {
        options.slBarSize = parseAttrDimensionArray(element.getAttribute(attrPrefix + 'sl-bar-size'), DEFAULT.slBarSize, [232, 150]);
    }
    if (element.hasAttribute(attrPrefix + 'hue-bar-size')) {
        options.hueBarSize = parseAttrDimensionArray(element.getAttribute(attrPrefix + 'hue-bar-size'), DEFAULT.hueBarSize, [150, 11]);
        options.alphaBarSize = options.hueBarSize
    }
    if (element.hasAttribute(attrPrefix + 'palette')) {
        const palette = element.getAttribute(attrPrefix + 'palette');
        switch (palette) {
            case 'PALETTE_MATERIAL_500':
                options.palette = PALETTE_MATERIAL_500;
                break;
            case 'PALETTE_MATERIAL_CHROME':
            case '':
                options.palette = PALETTE_MATERIAL_CHROME;
                break;
            default:
                options.palette = palette.split(/[;|]/);
                break;
        }
    }
    if (element.hasAttribute(attrPrefix + 'color')) {
        options.color = element.getAttribute(attrPrefix + 'color');
    }
}

class ColorPicker {

    static setHTMLTemplate(html){
        HTML_BOX = html;
    }

    #defaultOptions = {
        id: null,
        attachTo: 'body',
        showHSL: true,
        showRGB: true,
        showHEX: true,
        showAlpha: false,
        color: '#ff0000',
        palette: null,
        paletteEditable: false,
        useAlphaInPalette: 'auto', //true|false|auto
        slBarSize: [232, 150],
        hueBarSize: [130, 11],
        alphaBarSize: [130, 11]
    }

    constructor(container, options) {
        console.warn(container, options);
        switch(container instanceof HTMLElement) {
            case true:
                this.container = parseElement(container);
                this.options = Object.assign({}, this.#defaultOptions, options);
                break;
            default:
                options = (container && isPlainObject(container) ? container : (options || {}));
                if(container && isPlainObject(container)) container = null;
                this.options = Object.assign({}, this.#defaultOptions, options);
                this.container = parseElement(nvl(container, this.options.attachTo));
                break;
        }
        if (this.container) {
            copyOptionsFromElement(this.options, this.container);
            this.#buildTemplate();
        } else {
            throw new Error(`Container not found: ${this.options.attachTo}`);
        }
    }

    #buildTemplate(){
        this.H = 0;
        this.S = 0;
        this.L = 0;
        this.R = 0;
        this.G = 0;
        this.B = 0;
        this.A = 1;
        // andrà a contenere la palette di colori effettivamente usata
        // compresi i colori aggiunti o rimossi dall'utente, non sarà modificabile dirretamente dall'utente
        this.palette = { /*<color>: boolean*/ };

        // creo gli elementi HTML e li aggiungo al container
        this.element = document.createElement('div');
        if (this.options.id) {
            this.element.id = this.options.id;
        }
        this.element.className = 'gs-colorpicker';
        if (!this.options.show) this.element.classList.add('hidden');
        // // se falsy viene nascosto .gs-colorpicker-rgb
        // if (!this.options.showRGB) this.element.className += ' hide-rgb';
        // // se falsy viene nascosto .gs-colorpicker-hsl
        // if (!this.options.showHSL) this.element.className += ' hide-hsl';
        // // se falsy viene nascosto .gs-colorpicker-single-input (css hex)
        // if (!this.options.showHEX) this.element.className += ' hide-single-input';
        // // se falsy viene nascosto .gs-colorpicker-a
        // if (!this.options.showAlpha) this.element.className += ' hide-alpha';
        this.element.innerHTML = HTML_BOX;
        this.container.appendChild(this.element);

        // ADD EYEDROP TOOL
        if ('EyeDropper' in window) {
            // The API is available!
            let ed = this.element.querySelector('.gs-colorpicker-eyedropper');
            const eyeDropper = new EyeDropper();
            ed.addEventListener('click', (e) => {
                eyeDropper.open()
                    .then((result) => {
                        this.onValueChanged(RGBHEX, result.sRGBHex);
                    })
                    .catch(() => {})
            })
        }else{
            this.element.dataset.noEyeDropper;
        }
        // ADD HUE BAR
        const hueBar = this.element.querySelector('.gs-colorpicker-h');
        this.setupHueCanvas(hueBar);
        this.hueBarHelper = canvasHelper(hueBar);
        this.huePointer = this.element.querySelector('.gs-colorpicker-h+.gs-colorpicker-dot');

        // SETUP CANVAS SATURATION & LUMINANCE
        const slBar = this.element.querySelector('.gs-colorpicker-sl');
        this.setupSlCanvas(slBar);
        this.slBarHelper = canvasHelper(slBar);
        this.slPointer = this.element.querySelector('.gs-colorpicker-sl+.gs-colorpicker-dot');

        // SETUP COLOR  PREVIEW
        this.preview = this.element.querySelector('.gs-colorpicker-preview');
        this.setupClipboard(this.preview.querySelector('.gs-colorpicker-clipbaord'));

        // CONFIGURE HSL INPUTS
        this.setupInput(this.inputH = this.element.querySelector('.gs-colorpicker-hsl>input[nameref=H]'));
        this.setupInput(this.inputS = this.element.querySelector('.gs-colorpicker-hsl>input[nameref=S]'));
        this.setupInput(this.inputL = this.element.querySelector('.gs-colorpicker-hsl>input[nameref=L]'));


        // CONFIGURE RGB INPUTS
        this.setupInput(this.inputR = this.element.querySelector('.gs-colorpicker-rgb>input[nameref=R]'));
        this.setupInput(this.inputG = this.element.querySelector('.gs-colorpicker-rgb>input[nameref=G]'));
        this.setupInput(this.inputB = this.element.querySelector('.gs-colorpicker-rgb>input[nameref=B]'));

        // CONFIGURE RGB HEX
        this.setupInput(this.inputRGBHEX = this.element.querySelector('input[nameref=RGBHEX]'));
        this.element.querySelector('.gs-colorpicker-rgbhex').hidden = !this.options.showHEX;

        // CONFIGURE EDITABLE PALETTE
        this.setPalette(this.paletteRow = this.element.querySelector('.gs-colorpicker-palette'));
        this.paletteRow = this.element.querySelector('.gs-colorpicker-palette');

        // ADD OPACITY SLIDER
        this.setupAlphaCanvas(this.element.querySelector('.gs-colorpicker-a'));
        this.alphaPointer = this.element.querySelector('.gs-colorpicker-a+.gs-colorpicker-dot');


        this.element.style.width = `${this.options.slBarSize[0]}px`;
        this.onValueChanged(COLOR, this.options.color);
        if(this.options.afterTemplateConfiguration && typeof this.options.afterTemplateConfiguration === 'function'){
            this.options.afterTemplateConfiguration.call(this)
        }

        this.#updateUIVisibility();
        // AUTO OPEN IF REQUIRED
        if(this.options.open) this.element.setAttribute('open');
    }

    #updateUIVisibility(){
        this.element.querySelector('.gs-colorpicker-hsl').hidden = !this.options.showHSL;
        this.element.querySelector('.gs-colorpicker-rgb').hidden = !this.options.showRGB;
        this.element.querySelector('.gs-colorpicker-alpha').hidden = !(this.options.showAlpha);
        this.paletteRow.hidden = !(this.options.paletteEditable || (this.options.palette && this.options.palette.length > 0));
    }

    setOptions(options){
        this.options = Object.assign({}, this.options, options);
        this.updatePalette();
        this.#updateUIVisibility();
    }

    setupHueCanvas(canvas) {
        canvas.width = this.options.hueBarSize[0];
        canvas.height = this.options.hueBarSize[1];
        const ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, this.options.hueBarSize[0], 0),
            step = 1 / 360;
        // aggiungo tutti i 361 step al gradiente
        for (let ii = 0; ii <= 1; ii += step) {
            gradient.addColorStop(ii, `hsl(${360 * ii}, 100%, 50%)`);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.options.hueBarSize[0], this.options.hueBarSize[1]);
        const onMouseMove = (e) => {
            const x = limit(e.clientX - canvas.getBoundingClientRect().left, 0, this.options.hueBarSize[0]),
                hue = Math.round(x * 360 / this.options.hueBarSize[0]);
            this.huePointer.style.left = (x - 7) + 'px';
            this.onValueChanged(HUE, hue);
        };
        const onMouseUp = () => {
            // rimuovo i listener, verranno riattivati al prossimo mousedown
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        // mouse down sul canvas: intercetto il movimento, smetto appena il mouse viene sollevato
        canvas.addEventListener('mousedown', (e) => {
            onMouseMove(e);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    setupSlCanvas(canvas) {
        canvas.width = this.options.slBarSize[0];
        canvas.height = this.options.slBarSize[1];
        // gestisco gli eventi per la selezione del valore e segnalo il cambiamento tramite callbak
        // una volta che il puntatore è premuto sul canvas (mousedown)
        // intercetto le variazioni nella posizione del puntatore (mousemove)
        // relativamente al document, in modo che il puntatore in movimento possa uscire dal canvas
        // una volta sollevato (mouseup) elimino i listener
        const onMouseMove = (e) => {
            const x = limit(e.clientX - canvas.getBoundingClientRect().left, 0, this.options.slBarSize[0] - 1),
                y = limit(e.clientY - canvas.getBoundingClientRect().top, 0, this.options.slBarSize[1] - 1),
                c = this.slBarHelper.grabColor(x, y);
            // console.log('grab', x, y, c)
            this.slPointer.style.left = (x - 7) + 'px';
            this.slPointer.style.top = (y - 7) + 'px';
            this.onValueChanged(RGB, c);
        };
        const onMouseUp = () => {
            // rimuovo i listener, verranno riattivati al prossimo mousedown
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        // mouse down sul canvas: intercetto il movimento, smetto appena il mouse viene sollevato
        canvas.addEventListener('mousedown', (e) => {
            onMouseMove(e);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    setupAlphaCanvas(canvas) {
        canvas.width = this.options.alphaBarSize[0];
        canvas.height = this.options.alphaBarSize[1];
        // disegno sul canvas con un gradiente che va dalla piena trasparenza al pieno opaco
        const ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, canvas.width - 1, 0);
        gradient.addColorStop(0, `hsla(0, 0%, 50%, 0)`);
        gradient.addColorStop(1, `hsla(0, 0%, 50%, 1)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.options.alphaBarSize[0], this.options.alphaBarSize[1]);
        // gestisco gli eventi per la selezione del valore e segnalo il cambiamento tramite callbak
        // una volta che il puntatore è premuto sul canvas (mousedown)
        // intercetto le variazioni nella posizione del puntatore (mousemove)
        // relativamente al document, in modo che il puntatore in movimento possa uscire dal canvas
        // una volta sollevato (mouseup) elimino i listener
        const onMouseMove = (e) => {
            const x = limit(e.clientX - canvas.getBoundingClientRect().left, 0, this.options.alphaBarSize[0]),
                alpha = +(x / this.options.alphaBarSize[0]).toFixed(2);
            this.alphaPointer.style.left = (x - 7) + 'px';
            this.onValueChanged(ALPHA, alpha);
        };
        const onMouseUp = () => {
            // rimuovo i listener, verranno riattivati al prossimo mousedown
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        // mouse down sul canvas: intercetto il movimento, smetto appena il mouse viene sollevato
        canvas.addEventListener('mousedown', (e) => {
            onMouseMove(e);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    setupInput(input) {
        const min = +input.min,
            max = +input.max,
            prop = input.getAttribute("nameref");
        if (input.hasAttribute('select-on-focus')) {
            input.addEventListener('focus', () => {
                //non funziona in IE/Edge
                input.select();
            });
        }
        if (input.type === 'text') {
            input.addEventListener('change', () => {
                this.onValueChanged(prop, input.value);
            });
        } else {
            if (IS_EDGE || IS_IE11) {
                // edge modifica il valore con le frecce MA non scatena l'evento change
                // quindi le intercetto impostando e.returnValue a false in modo
                // che non il valore non venga modificato anche da edge subito dopo il keydown
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Up') {
                        input.value = limit((+input.value) + 1, min, max);
                        this.onValueChanged(prop, input.value);
                        e.returnValue = false;
                    } else if (e.key === 'Down') {
                        input.value = limit((+input.value) - 1, min, max);
                        this.onValueChanged(prop, input.value);
                        e.returnValue = false;
                    }
                });
            }
            input.addEventListener('change', () => {
                const value = +input.value;
                this.onValueChanged(prop, limit(value, min, max));
            });
        }
    }

    setupClipboard(input) {
        // l'input ricopre completamente la preview ma è totalmente trasparente
        input.title = 'click to copy';
        input.addEventListener('click', () => {
            // non uso direttamente inputRGBHEX perchè potrebbe contenere un colore non valido
            //  converto in hexcss4 quindi aggiunge anche il valore hex dell'alpha ma solo se significativo (0<=a<1)
            input.value = parseColor([this.R, this.G, this.B, this.A], 'hexcss4');
            input.select();
            document.execCommand('copy');
        });
    }

    setPalette(/** @type {Element} */ row) {
        // indica se considerare il canale alpha nei controlli della palette
        // se 'auto' dipende dall'opzione showAlpha (se true allora alpha è considerata anche nella palette)
        const useAlphaInPalette = this.options.useAlphaInPalette === 'auto' ? this.options.showAlpha : this.options.useAlphaInPalette;
        // palette è una copia di this.options.palette
        let palette = null;
        switch (this.options.palette) {
            case 'PALETTE_MATERIAL_500':
                palette = PALETTE_MATERIAL_500;
                break;
            case 'PALETTE_MATERIAL_CHROME':
                palette = PALETTE_MATERIAL_CHROME;
                break;
            default:
                palette = ensureArray(this.options.palette);
                break;
        }
        if (this.options.paletteEditable || palette.length > 0) {
            const addColorToPalette = (color, refElement, fire) => {
                // se il colore è già presente, non creo un nuovo <div> ma sposto quello esistente in coda
                const el = row.querySelector('.gs-colorpicker-palette-color[data-color="' + color + '"]') ||
                    document.createElement('div');
                el.className = 'gs-colorpicker-palette-color';
                el.style.backgroundColor = color;
                el.setAttribute('data-color', color);
                el.title = color;
                row.insertBefore(el, refElement);
                this.palette[color] = true;
                if (fire) {
                    this.onPaletteColorAdd(color);
                }
            };
            const removeColorToPalette = (element, fire) => {
                // se element è nullo elimino tutti i colori
                if (element) {
                    try {
                        row.removeChild(element);
                        this.palette[element.getAttribute('data-color')] = false;
                        if (fire) {
                            this.onPaletteColorRemove(element.getAttribute('data-color'));
                        }
                    }catch(err){}
                } else {
                    row.querySelectorAll('.gs-colorpicker-palette-color[data-color]').forEach(el => {
                        row.removeChild(el);
                    });
                    Object.keys(this.palette).forEach(k => {
                        this.palette[k] = false;
                    });
                    if (fire) {
                        this.onPaletteColorRemove();
                    }
                }
            };
            // solo i colori validi vengono aggiunti alla palette
            palette.map(c => parseColor(c, useAlphaInPalette ? 'rgbcss4' : 'hex'))
                .filter(c => !!c)
                .forEach(c => addColorToPalette(c));


            if( this.paletteColors) {
                this.paletteColors.map(c => parseColor(c, (this.options.showAlpha && useAlphaInPalette) ? 'rgbcss4' : 'hex'))
                    .filter(c => !!c)
                    .forEach(c => { console.info('COLOR', c); addColorToPalette(c, null, false)});
            }

            // in caso di palette editabile viene aggiunto un pulsante + che serve ad aggiungere il colore corrente
            if (this.options.paletteEditable) {
                const el = document.createElement('div');
                el.className = 'gs-colorpicker-palette-color gs-colorpicker-palette-add';
                el.innerHTML = '+';
                row.appendChild(el);
                // gestisco eventi di aggiunta/rimozione/selezione colori
                row.addEventListener('click', (e) => {
                    if (/gs-colorpicker-palette-add/.test(e.target.className)) {
                        if (e.shiftKey) {
                            // rimuove tutti i colori
                            removeColorToPalette(null, true);
                        } else if (useAlphaInPalette) {
                            // aggiungo il colore e triggero l'evento 'oncoloradd'
                            addColorToPalette(parseColor([this.R, this.G, this.B, this.A], 'rgbcss4'), e.target, true);
                        } else {
                            // aggiungo il colore e triggero l'evento 'oncoloradd'
                            addColorToPalette(rgbToHex(this.R, this.G, this.B), e.target, true);
                        }
                    } else if (/gs-colorpicker-palette-color/.test(e.target.className)) {
                        if (e.shiftKey) {
                            // rimuovo il colore e triggero l'evento 'oncolorremove'
                            removeColorToPalette(e.target, true);
                        } else {
                            // visto che il colore letto da backgroundColor risulta nel formato rgb()
                            // devo usare il valore hex originale
                            this.onValueChanged(COLOR, e.target.getAttribute('data-color'));
                        }
                    }
                });
            } else {
                // gestisco il solo evento di selezione del colore
                row.addEventListener('click', (e) => {
                    if (/gs-colorpicker-palette-color/.test(e.target.className)) {
                        // visto che il colore letto da backgroundColor risulta nel formato rgb()
                        // devo usare il valore hex originale
                        this.onValueChanged(COLOR, e.target.getAttribute('data-color'));
                    }
                });
            }
        } else {
            // la palette con i colori predefiniti viene nasconsta se non ci sono colori
            row.style.display = 'none';
        }
    }

    updatePalette(palette) {
        // elimino tutti i riferimenti all'attuale palette
        this.paletteRow.innerHTML = '';
        this.palette = { };
        // se l'elemento contenitore della palette è stato rimosso (nel costruttore), lo reintegro
        if (!this.paletteRow.parentElement) {
            this.element.appendChild(this.paletteRow);
        }
        // aggiorno le opzioni e ricreo i controlli
        this.options.palette = palette;
        this.setPalette(this.paletteRow);
    }

    onValueChanged(prop, value, options = { silent: false }) {
        // console.log(prop, value);
        switch (prop) {
            case HUE:
                this.H = value;
                [this.R, this.G, this.B] = hslToRgb(this.H, this.S, this.L);
                this.slBarHelper.setHue(value);
                this.updatePointerH(this.H);
                this.updateInputHSL(this.H, this.S, this.L);
                this.updateInputRGB(this.R, this.G, this.B);
                // TODO: #19
                this.updateInputRGBHEX(this.R, this.G, this.B, this.A);
                break;
            case SATURATION:
                this.S = value;
                [this.R, this.G, this.B] = hslToRgb(this.H, this.S, this.L);
                this.updatePointerSL(this.H, this.S, this.L);
                this.updateInputHSL(this.H, this.S, this.L);
                this.updateInputRGB(this.R, this.G, this.B);
                // TODO: #19
                this.updateInputRGBHEX(this.R, this.G, this.B, this.A);
                break;
            case LUMINANCE:
                this.L = value;
                [this.R, this.G, this.B] = hslToRgb(this.H, this.S, this.L);
                this.updatePointerSL(this.H, this.S, this.L);
                this.updateInputHSL(this.H, this.S, this.L);
                this.updateInputRGB(this.R, this.G, this.B);
                // TODO: #19
                this.updateInputRGBHEX(this.R, this.G, this.B, this.A);
                break;
            case RED:
                this.R = value;
                [this.H, this.S, this.L] = rgbToHsl(this.R, this.G, this.B);
                this.slBarHelper.setHue(this.H);
                this.updatePointerH(this.H);
                this.updatePointerSL(this.H, this.S, this.L);
                this.updateInputHSL(this.H, this.S, this.L);
                // TODO: #19
                this.updateInputRGBHEX(this.R, this.G, this.B, this.A);
                break;
            case GREEN:
                this.G = value;
                [this.H, this.S, this.L] = rgbToHsl(this.R, this.G, this.B);
                this.slBarHelper.setHue(this.H);
                this.updatePointerH(this.H);
                this.updatePointerSL(this.H, this.S, this.L);
                this.updateInputHSL(this.H, this.S, this.L);
                // TODO: #19
                this.updateInputRGBHEX(this.R, this.G, this.B, this.A);
                break;
            case BLUE:
                this.B = value;
                [this.H, this.S, this.L] = rgbToHsl(this.R, this.G, this.B);
                this.slBarHelper.setHue(this.H);
                this.updatePointerH(this.H);
                this.updatePointerSL(this.H, this.S, this.L);
                this.updateInputHSL(this.H, this.S, this.L);
                // TODO: #19
                this.updateInputRGBHEX(this.R, this.G, this.B, this.A);
                break;
            case RGB:
                [this.R, this.G, this.B] = value;
                [this.H, this.S, this.L] = rgbToHsl(this.R, this.G, this.B);
                this.updateInputHSL(this.H, this.S, this.L);
                this.updateInputRGB(this.R, this.G, this.B);
                // TODO: #19
                this.updateInputRGBHEX(this.R, this.G, this.B, this.A);
                break;
            case RGBA_USER:
                [this.R, this.G, this.B, this.A] = value;
                [this.H, this.S, this.L] = rgbToHsl(this.R, this.G, this.B);
                this.slBarHelper.setHue(this.H);
                this.updatePointerH(this.H);
                this.updatePointerSL(this.H, this.S, this.L);
                this.updateInputHSL(this.H, this.S, this.L);
                this.updateInputRGB(this.R, this.G, this.B);
                // TODO: #19
                this.updateInputRGBHEX(this.R, this.G, this.B, this.A);
                this.updatePointerA(this.A);
                break;
            case HSLA_USER:
                [this.H, this.S, this.L, this.A] = value;
                [this.R, this.G, this.B] = hslToRgb(this.H, this.S, this.L);
                this.slBarHelper.setHue(this.H);
                this.updatePointerH(this.H);
                this.updatePointerSL(this.H, this.S, this.L);
                this.updateInputHSL(this.H, this.S, this.L);
                this.updateInputRGB(this.R, this.G, this.B);
                // TODO: #19
                this.updateInputRGBHEX(this.R, this.G, this.B, this.A);
                this.updatePointerA(this.A);
                break;
            case RGBHEX:
                // TODO: #19
                [this.R, this.G, this.B, this.A] = cssColorToRgba(value) || [this.R, this.G, this.B, this.A];
                [this.H, this.S, this.L] = rgbToHsl(this.R, this.G, this.B);
                this.slBarHelper.setHue(this.H);
                this.updatePointerH(this.H);
                this.updatePointerSL(this.H, this.S, this.L);
                this.updateInputHSL(this.H, this.S, this.L);
                this.updateInputRGB(this.R, this.G, this.B);
                this.updatePointerA(this.A);
                break;
            case COLOR:
                [this.R, this.G, this.B, this.A] = parseColor(value, 'rgba') || [0, 0, 0, 1];
                [this.H, this.S, this.L] = rgbToHsl(this.R, this.G, this.B);
                this.slBarHelper.setHue(this.H);
                this.updatePointerH(this.H);
                this.updatePointerSL(this.H, this.S, this.L);
                this.updateInputHSL(this.H, this.S, this.L);
                this.updateInputRGB(this.R, this.G, this.B);
                // TODO: #19
                this.updateInputRGBHEX(this.R, this.G, this.B, this.A);
                this.updatePointerA(this.A);
                break;
            case ALPHA:
                this.A = value;
                // TODO: #19
                this.updateInputRGBHEX(this.R, this.G, this.B, this.A);
                break;
        }
        // this.onColorChanged(this.R, this.G, this.B, this.A);

        if (this.A === 1) {
            this.preview.style.backgroundColor = `rgb(${this.R},${this.G},${this.B})`;
        } else {
            this.preview.style.backgroundColor = `rgba(${this.R},${this.G},${this.B},${this.A})`;
        }
        // #21
        if (!options || !options.silent) {
            this.onchange && this.onchange(this.preview.style.backgroundColor);
        }
    }

    // onColorChanged(r, g, b, a) {
    //     if (a === 1) {
    //         this.preview.style.backgroundColor = `rgb(${r},${g},${b})`;
    //     } else {
    //         this.preview.style.backgroundColor = `rgba(${r},${g},${b},${a})`;
    //     }
    //     // this.onchange && this.onchange();
    //     this.onchange && this.onchange(this.preview.style.backgroundColor);
    // }

    onPaletteColorAdd(color) {
        if(!this.paletteColors) this.paletteColors = [];
        this.paletteColors.push(color);
        this.oncoloradd && this.oncoloradd(color);
    }

    onPaletteColorRemove(color) {
        if(this.paletteColors) {
            this.paletteColors = this.paletteColors.filter((c) => c !== color);
        }
        this.oncolorremove && this.oncolorremove(color);
    }

    updateInputHSL(h, s, l) {
        if (!this.options.showHSL) return;

        this.inputH.value = h;
        this.inputS.value = s;
        this.inputL.value = l;
    }

    updateInputRGB(r, g, b) {
        if (!this.options.showRGB) return;

        this.inputR.value = r;
        this.inputG.value = g;
        this.inputB.value = b;
    }

    // TODO: #19
    updateInputRGBHEX(r, g, b, a) {
        if (!this.options.showHEX) return;

        if (this.options.showAlpha) {
            this.inputRGBHEX.value = parseColor([r, g, b, a], 'hexcss4');
        } else {
            this.inputRGBHEX.value = rgbToHex(r, g, b);
        }
    }

    updatePointerH(h) {
        const x = this.options.hueBarSize[0] * h / 360;
        this.huePointer.style.left = (x - 7) + 'px';
    }

    updatePointerSL(h, s, l) {
        const [r, g, b] = hslToRgb(h, s, l);
        const [x, y] = this.slBarHelper.findColor(r, g, b);
        if (x >= 0) {
            this.slPointer.style.left = (x - 7) + 'px';
            this.slPointer.style.top = (y - 7) + 'px';
        }
    }

    updatePointerA(a) {
        if (!this.options.showAlpha) return;

        const x = this.options.alphaBarSize[0] * a;
        this.alphaPointer.style.left = (x - 7) + 'px';
    }
}

class EventEmitter {
    constructor(name) {
        this.name = name;
        this.listeners = [];
    }
    on(callback) {
        if (callback) {
            this.listeners.push(callback);
        }
    }
    off(callback) {
        if (callback) {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        } else {
            this.listeners = [];
        }
    }
    emit(args, _this) {
        const listeners = this.listeners.slice(0);
        for (let ii = 0; ii < listeners.length; ii++) {
            listeners[ii].apply(_this, args);
        }
    }
}

// function wrapEventCallback(ctrl, picker, eventName, cb) {
//     if (cb && typeof cb === 'function') {
//         picker['on' + eventName] = () => {
//             cb.call(null, ctrl, ...arguments);
//         };
//     } else {
//         picker['on' + eventName] = null;
//     }
// }

function keepInViewport (el, targetX, targetY) {
    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate maximum allowed coordinates
    const maxX = viewportWidth - rect.width;
    const maxY = viewportHeight - rect.height;

    // Clamp values between 0 and the max allowed
    const safeX = Math.max(0, Math.min(targetX, maxX));
    const safeY = Math.max(0, Math.min(targetY, maxY));
    el.style.transform = `translate(${safeX}px, ${safeY}px)`;
}
/**
 * Crea il color picker.
 * Le opzioni sono:
 * - attachTo: elemento DOM al quale aggiungere il picker (default 'body')
 * - showHSL: indica se mostrare i campi per la definizione del colore in formato HSL (default true)
 * - showRGB: indica se mostrare i campi per la definizione del colore in formato RGB (default true)
 * - showHEX: indica se mostrare i campi per la definizione del colore in formato RGB HEX (default true)
 * - color: colore iniziale (default '#ff0000')
 *
 * @param      {Object}          element (opzionale) Un elemento HTML che andrà a contenere il picker
 * @param      {Object}          options  (opzionale) Le opzioni di creazione
 * @return     {Object}          ritorna un controller per impostare e recuperare il colore corrente del picker
 */
function createPicker(element, options) {
    let picker = new ColorPicker(element, options);
    // gestione degli eventi: il "controller" assegna le callbak degli eventi ai rispettivi EventEmitter
    // quando il picker triggera un evento,
    //  il "controller" emette lo stesso evento tramite il rispettivo EventEmitter
    let cbEvents = {
        change: new EventEmitter('change'),
        coloradd: new EventEmitter('coloradd'),
        colorremove: new EventEmitter('colorremove')
    };
    let isChanged = true,
        // memoize per la proprietà all
        memAll = {};

    let _addGloablListeners = function(remove){
        if(!remove){
            window.addEventListener('click', _onMouseDown, true);
            window.addEventListener('mousedown', _onMouseDown, true);
            window.addEventListener('keydown', _onKeyDown, true);
        }else{
            window.removeEventListener('click', _onMouseDown, true);
            window.removeEventListener('mousedown', _onMouseDown, true);
            window.removeEventListener('keydown', _onKeyDown, true);
        }
    }

    let _onMouseDown= function(e){
        if(picker.element.contains(e.target)) return;
        controller.hide();
    }

    let _onKeyDown= function(e){
        if(e.key.toUpperCase() !== 'ESCAPE' || picker.element.contains(e.target)) return;
        controller.hide();
    }


    let callback;
    // non permetto l'accesso diretto al picker
    // ma ritorno un "controller" per eseguire solo alcune azioni (get/set colore, eventi, etc.)
    const controller = {
        get element() {
            return picker.element;
        },

        get rgb() {
            return [picker.R, picker.G, picker.B];
        },

        set rgb([r, g, b]) {
            [r, g, b] = [limit(r, 0, 255), limit(g, 0, 255), limit(b, 0, 255)];
            picker.onValueChanged(RGBA_USER, [r, g, b, 1]);
        },

        get hsl() {
            return [picker.H, picker.S, picker.L];
        },

        set hsl([h, s, l]) {
            [h, s, l] = [limit(h, 0, 360), limit(s, 0, 100), limit(l, 0, 100)];
            picker.onValueChanged(HSLA_USER, [h, s, l, 1]);
        },

        get rgbhex() {
            // return rgbToHex(picker.R, picker.G, picker.B);
            return this.all.hex;
        },

        get rgba() {
            return [picker.R, picker.G, picker.B, picker.A];
        },

        set rgba([r, g, b, a]) {
            [r, g, b, a] = [limit(r, 0, 255), limit(g, 0, 255), limit(b, 0, 255), limit(a, 0, 1)];
            picker.onValueChanged(RGBA_USER, [r, g, b, a]);
        },

        get hsla() {
            return [picker.H, picker.S, picker.L, picker.A];
        },

        set hsla([h, s, l, a]) {
            [h, s, l, a] = [limit(h, 0, 360), limit(s, 0, 100), limit(l, 0, 100), limit(a, 0, 1)];
            picker.onValueChanged(HSLA_USER, [h, s, l, a]);
        },

        /**
         * Ritorna il colore corrente nel formato RGB HEX,
         * oppure nella notazione rgba() con alpha != 1.
         *
         * @return     {string}  colore corrente
         */
        get color() {
            // if (picker.A === 1) {
            //     return this.rgbhex;
            // } else {
            //     return `rgba(${picker.R},${picker.G},${picker.B},${picker.A})`;
            // }
            return this.all.toString();
        },

        /**
         * Imposta il colore corrente.
         * Accetta:
         * - il nome di un colore (https://developer.mozilla.org/en-US/docs/Web/CSS/color_value)
         * - un colore espresso nel formato RGB HEX sia esteso (#ffdd00) che compatto (#fd0)
         * - un array di interi [R,G,B]
         *
         * @param      {string|array}  color   il colore
         */
        set color(color) {
            picker.onValueChanged(COLOR, color);
        },

        /**
         * Importa il colore corrente.
         * E' possibile passare un secondo parametro per indicare
         * se si vuole impostare il colore in modo silente, cio senza scatenare eventi.
         *
         * @param {string|array} color il colore
         * @param {boolean} silent se true il colore viene cambiato senza scatenare eventi, false altrimenti
         */
        setColor(color, silent = false) {
            // modifico il colore senza scatenare alcun evento
            picker.onValueChanged(COLOR, color, { silent })
        },

        /**
         * @return  {Object}    oggetto contenente il colore corrente in tutti i formati noti a parseColor()
         */
        get all() {
            if (isChanged) {
                const rgba = [picker.R, picker.G, picker.B, picker.A];
                // la conversione in stringa segue le regole della proprietà color
                const ts = picker.A < 1 ? `rgba(${picker.R},${picker.G},${picker.B},${picker.A})` : rgbToHex(...rgba);
                // passando un oggetto a parseColor come secondo parametro, lo riempirà con tutti i formati disponibili
                memAll = parseColor(rgba, memAll);
                memAll.toString = () => ts;
                isChanged = false;
            }
            // devo per forza passare una copia, altrimenti memAll può esssere modificato dall'esterno
            return Object.assign({}, memAll);
        },

        /**
         * @deprecated
         */
        get onchange() {
            return cbEvents.change && cbEvents.change.listeners[0];
        },

        /**
         * @deprecated  usare on('change', cb)
         */
        set onchange(cb) {
            // wrapEventCallback(this, picker, 'change', cb);
            // cbEvents['change'] = cb;
            this.off('change').on('change', cb);
        },

        /**
         * @deprecated
         */
        get oncoloradd() {
            return cbEvents.coloradd && cbEvents.coloradd.listeners[0];
        },

        /**
         * @deprecated  usare on('coloradd', cb)
         */
        set oncoloradd(cb) {
            // wrapEventCallback(this, picker, 'coloradd', cb);
            // cbEvents['coloradd'] = cb;
            this.off('coloradd').on('coloradd', cb);
        },

        /**
         * @deprecated
         */
        get oncolorremove() {
            return cbEvents.colorremove && cbEvents.colorremove.listeners[0];
        },

        /**
         * @deprecated  usare on('colorremove', cb)
         */
        set oncolorremove(cb) {
            // wrapEventCallback(this, picker, 'colorremove', cb);
            // cbEvents['colorremove'] = cb;
            this.off('colorremove').on('colorremove', cb);
        },

        /**
         * Ritorna la palette dei colori.
         *
         * @return     {Array}  array di colori in formato hex
         */
        get palette() {
            return Object.keys(picker.palette).filter(k => picker.palette[k]);
        },

        /**
         * Imposta la palette di color
         */
        set palette(colors) {
            picker.updatePalette(colors);
        },

        /**
         * Mostra il picker.
         */
        show() {
            picker.element.classList.remove('hidden');
        },

        openPicker({target, x,y, color}, cb){
            if(target && (!x || !y)){
                let bbox = target.getBoundingClientRect();
                x = bbox.x;
                y = bbox.y+bbox.height;;
            }
            if(isNaN(x)) x = window.innerWidth*.5;
            if(isNaN(y)) y = 0;
            //picker.element.style.transform = "translate(" + (x) + "px," + (y) + "px)";
            keepInViewport(picker.element, x, y)
            picker.element.classList.remove('hidden');
            color = parseColor(color || '#000', 'rgba');
            picker.onValueChanged(COLOR, color, { silent: true });
            _addGloablListeners();
            if(cb) {
                callback = cb;
                this.on('change', callback);
            }
        },

        setOptions(options){
            picker.setOptions(options);
        },

        /**
         * Nasconde il picker
         */
        hide() {
            picker.element.classList.add('hidden');
            _addGloablListeners(true);
            if(callback) this.off('change', callback);
            callback = null;
        },

        /**
         * Mostra o nasconde il picker
         */
        toggle() {
            picker.element.classList.toggle('hidden');
            _addGloablListeners(picker.classList.contains('hidden'));
            if(picker.element.classList.contains('hidden') && callback){
                this.off('change', callback);
                callback = null;
            }
        },



        on(eventName, cb) {
            if (eventName) {
                cbEvents[eventName] && cbEvents[eventName].on(cb);
            }
            return this;
        },

        off(eventName, cb) {
            if (eventName) {
                cbEvents[eventName] && cbEvents[eventName].off(cb);
            }
            return this;
        },

        destroy() {
            window.removeEventListener('click', this.onmouseDown, true);
            cbEvents.change.off()
            cbEvents.coloradd.off()
            cbEvents.colorremove.off()
            picker.element.remove()
            cbEvents = null
            picker = null
        }
    };
    // ogni volta che viene triggerato un evento, uso il corrispettivo EventEmitter per propagarlo a tutte le callback associate
    //  le callback vengono richiamate con il "controller" come "this"
    //  e il primo parametro è sempre il "controller" seguito da tutti i parametri dell'evento
    picker.onchange = (...args) => {
        isChanged = true; // così le proprietà in lettura dovranno ricalcolare il loro valore
        cbEvents.change.emit([controller, ...args], controller);
    };
    picker.oncoloradd = (...args) => {
        cbEvents.coloradd.emit([controller, ...args], controller);
    };
    picker.oncolorremove = (...args) => {
        cbEvents.colorremove.emit([controller, ...args], controller);
    };
    // TOOD: trovare un altro nome a ctrl, troppo comune
    // TODO: definirla come readonly
    picker.element.ctrl = controller;
    return controller;
}

/**
 *
 * @param {any} selector
 * @param {object} options
 * @return  un Array di controller così come restituito da createPicker()
 */
function from(selector, options) {
    // TODO: gestire eventuali errori nella creazione del picker
    const pickers = parseElements(selector).map((el, index) => {
        const picker = createPicker(el, options);
        picker.index = index;
        return picker;
    });
    pickers.on = function (eventName, cb) {
        pickers.forEach(picker => picker.on(eventName, cb));
        return this;
    };
    pickers.off = function (eventName) {
        pickers.forEach(picker => picker.off(eventName));
        return this;
    };
    return pickers;
}

export default {
    createPicker,
    from,
    parseColorToRgb,
    parseColorToRgba,
    parseColorToHsl,
    parseColorToHsla,
    parseColor,
    rgbToHex,
    hslToRgb,
    rgbToHsl,
    rgbToHsv,
    rgbToInt,
    intToRgb,
    getLuminance,
    COLOR_NAMES,
    PALETTE_MATERIAL_500,
    PALETTE_MATERIAL_CHROME,
    VERSION
};