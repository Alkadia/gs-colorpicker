/// <reference path="../gs-colorpicker.d.ts" />
import * as GSColorPicker from '../gs-colorpicker.js';

const c1 = GSColorPicker.parseColor('yellow', 'hex');
const c2 = GSColorPicker.parseColor('yellow');
const c3 = GSColorPicker.parseColor([0, 0, 0]);
const o1: GSColorPicker.ACPColor = GSColorPicker.parseColor('yellow', {});
const o2: Object = GSColorPicker.parseColor('yellow', {});

const a1: GSColorPicker.ACPController = GSColorPicker.createPicker('div');
a1.element;
a1.rgb = [0, 0, 0];
a1.rgba = [0, 0, 0, 0];
a1.hsl = [0, 0, 0];
a1.hsla = [0, 0, 0, 0];
a1.color = 'yellow';
const p1: string = a1.rgbhex;
const p2: GSColorPicker.ACPColor = a1.all;
const cb1: GSColorPicker.ACPCallback = (controller: GSColorPicker.ACPController, color?: string) => {};
const cb2: GSColorPicker.ACPCallback = () => {};
a1.onchange = cb1;
a1.onchange = cb2;
a1.onchange = cb2;
a1.onchange = null;
a1.oncoloradd = cb1;
a1.oncoloradd = cb2;
a1.oncoloradd = cb2;
a1.oncoloradd = null;
a1.oncolorremove = cb1;
a1.oncolorremove = cb2;
a1.oncolorremove = cb2;
a1.oncolorremove = null;
a1.on('change', cb1);
a1.on('change', cb2);
a1.off('change', cb1);
a1.off('change');

// test su proprietà che devono risultare non validi
// a1.element = document.querySelector('body');
// let rgb: Array<number> = a1.element;
// a1.rgbhex = '#ffffff';