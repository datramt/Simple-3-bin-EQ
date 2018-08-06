//FILTERED GENERATORS
//Simple 3-band EQ built with p5.js by Dan Tramte
// © dan tramte 2018

//declare global variables
let omniNoise, eq, noiseFFT;
let handles = [];
let audioOnOff, sourceOptions;
let sourceType;
let pitchSlider, volumeSlider; //add this!
let volLabel, pitchLabel;

//===========================================================\\
//INITIALIZATIONS
function setup() {
  createCanvas(600, 300);

  //initialize source type to default white noise
  sourceType = ['white', 'noise']

  //assign p5 sound objects
  omniNoise = new p5.Noise('white');
  omniOsc = new p5.Oscillator();
  eq = new p5.EQ(3);
  noiseFFT = new p5.FFT();

  //assign eq handles
  handles[0] = new EQHandle('low');
  handles[1] = new EQHandle('mid');
  handles[2] = new EQHandle('high');

  //init sound objects
  omniNoise.amp(0);
  omniOsc.amp(0);
  omniNoise.disconnect();
  omniOsc.disconnect();

  //======assign DOM ELEMENTS======\\
  audioOnOff = createButton('play').position(10, 10).style('background', 'transparent').style('color', 'white');
  audioOnOff.mousePressed(() => {
    if (omniNoise.started || omniOsc.started) {
      if (true) {
        omniNoise.stop();
        omniOsc.stop();
        audioOnOff.html('play');
      }
    } else {
      if (sourceType[1] === 'noise') {
        eq.process(omniNoise);
        omniNoise.start();
        audioOnOff.html('stop');
      } else if (sourceType[1] === 'wave') {
        omniOsc.start();
        audioOnOff.html('stop');
      }
    }
  });

  sourceOptions = createSelect().position(50, 10).style('background', 'transparent').style('color', 'white');
  loadMenuOptions();
  sourceOptions.changed(() => {
    sourceType = sourceOptions.value().split(" ");
    // console.log(sourceType);
    if (sourceType[1] === 'noise') {
      let noiseType = sourceType[0];
      pitchSlider.hide();
      pitchLabel.hide();
      omniNoise.setType(noiseType);
      eq.process(omniNoise);
      if (omniOsc.started) {
        omniOsc.stop();
        omniNoise.start();
      }
    } else if (sourceType[1] === 'wave') {
      let oscType = sourceType[0];
      pitchSlider.show();
      pitchLabel.show();
      omniOsc.setType(oscType);
      eq.process(omniOsc);
      if (omniNoise.started) {
        omniNoise.stop();
        omniOsc.start();
      }
    }
  });
  
  volumeSlider = createSlider(-60, 0, 0, 1).position(160, 10);
  volumeSlider.style('-webkit-appearance', 'none').style('border-radius', '15px').style('background','gray').style('opacity', '0.5');
  volumeSlider.input(() => {
    if (volumeSlider.value() === -60) {
    	volLabel.value('vol: ' + '-inf' + ' dB');
    } else {
    	volLabel.value('vol: ' + volumeSlider.value() + ' dB');
    }
    omniOsc.amp(pow(10, volumeSlider.value()/20)-0.001, 0.1)
    omniNoise.amp(pow(10, volumeSlider.value()/20)-0.001, 0.1)
  	// console.log(pow(10, -10/20)-0.001);
  });
  
  volLabel = createInput('vol: -inf dB');
  volLabel.position(296, 10);
  volLabel.style('background', 'Transparent').style('border', 'none');
  
  pitchSlider = createSlider(0, 127, 69, 1).position(370, 10);
  pitchSlider.style('-webkit-appearance', 'none').style('border-radius', '15px').style('background','gray').style('opacity', '0.5');
  pitchSlider.input(() => {
  	omniOsc.freq(midiToFreq(pitchSlider.value()));
    pitchLabel.value('freq: ' + midiToFreq(pitchSlider.value()).toFixed(2));
  })
  pitchSlider.hide();
  
  pitchLabel = createInput('freq: 440');
  pitchLabel.position(506, 10);
  pitchLabel.style('background', 'Transparent').style('border', 'none');
  pitchLabel.hide();
}

//===========================================================\\
//DRAW LOOP
function draw() {

  background(80);
  stroke(200);
  line(0, height / 2, width, height / 2);
  noStroke();

  let noiseSpectrum = noiseFFT.analyze();

  beginShape();
  vertex(0, height);
  for (let i = 0; i < noiseSpectrum.length; i++) {
    vertex(map(log(i), 0, log(noiseSpectrum.length), 0, width), map(noiseSpectrum[i], 0, 255, height, 0));
  }
  vertex(width, height);
  endShape();

  fill(100, 255, 150);
  for (let i = 0; i < handles.length; i++) {
    handles[i].moveMe();
  }
}

//===========================================================\\
//DEFINE OBJECTS
class EQHandle {
  constructor(type) {
    this.type = type;
    this.freq = 500;
    this.gain = 0;
    this.subhandles = false;
    if (this.type == 'low') {
      this.position = createVector(0, height / 2);
      eq.bands[0].setType('lowshelf');
    } else if (this.type == 'mid') {
      this.position = createVector(width / 2, height / 2);
      this.subhandles = true;
      this.qdistance = 70;
      this.shPositionR = createVector(this.position.x + this.qdistance, this.position.y);
      this.shPositionL = createVector(this.position.x - this.qdistance, this.position.y);
      this.shLockedR = false;
      this.shLockedL = false;
      this.shMouseOverR = false;
    } else if (this.type == 'high') {
      this.position = createVector(width, height / 2);
      eq.bands[2].setType('highshelf');
    }

    this.imTouched = false;
    this.size = 16;
    this.enableClick = true;
    this.target = false;
    this.mouseOver = false;
    this.xoffset = 0;
    this.yoffset = 0;

  }

  moveMe() {

    if (dist(mouseX, mouseY, this.position.x, this.position.y) < this.size / 2) {
      this.mouseOver = true;
      if (this.target) {
        stroke(255);
        // strokeWeight(2);
      } else {
        noStroke();
      }
    } else {
      this.mouseOver = false;
      noStroke();
      fill(0, 255, 10);
    }

    this.position = createVector(constrain(this.position.x, this.size / 2, width - this.size / 2), constrain(this.position.y, this.size / 2, height - this.size / 2));
    ellipse(this.position.x, this.position.y, this.size);

    //SUBHANDLES—————————————————
    if (this.subhandles) {

      this.shPositionR.x = this.position.x + this.qdistance;
      this.shPositionL.x = this.position.x - this.qdistance;
      this.shPositionL.y = this.shPositionR.y = this.position.y;

      if (dist(mouseX, mouseY, this.shPositionR.x, this.shPositionR.y) < this.size / 3) {
        this.shMouseOverR = true;
      } else {
        this.shMouseOverR = false;
      }

      if (dist(mouseX, mouseY, this.shPositionL.x, this.shPositionL.y) < this.size / 3) {
        this.shMouseOverL = true;

      } else {
        this.shMouseOverL = false;
      }

      fill(0, 150, 50);
      stroke(0, 150, 100);
      line(this.shPositionL.x, this.position.y, this.position.x - this.size / 2, this.position.y);
      line(this.shPositionR.x, this.position.y, this.position.x + this.size / 2, this.position.y);

      ellipse(this.shPositionR.x, this.position.y, this.size * 2 / 3);
      ellipse(this.shPositionL.x, this.position.y, this.size * 2 / 3);
    }
    noStroke();
    fill(0, 255, 150);

    this.freq = midiToFreq(map(this.position.x, 0, width, 11, 140));
    this.gain = map(this.position.y, height, 0, -80, 80);
    this.res = pow(map(this.qdistance, 100, this.size, 0.1, 10), 2);

    if (this.type == 'low') {
      eq.bands[0].freq(this.freq);
      eq.bands[0].gain(this.gain);
    } else if (this.type == 'mid') {
      eq.bands[1].freq(this.freq);
      eq.bands[1].gain(this.gain);
      eq.bands[1].res(this.res);
      // console.log(this.freq);
    } else if (this.type == 'high') {
      eq.bands[2].freq(this.freq);
      eq.bands[2].gain(this.gain);
    }
  }
}

//===========================================================\\
//EVENT LISTENERS
function mousePressed() {
  for (let i = 0; i < handles.length; i++) {

    if (handles[i].mouseOver) {
      handles[i].target = true;
    } else {
      handles[i].target = false;
    }

    handles[i].xoffset = mouseX - handles[i].position.x;
    handles[i].yoffset = mouseY - handles[i].position.y;

    if (handles[i].subhandles) {
      if (handles[i].shMouseOverR) {
        handles[i].shLockedR = true;
      } else if (handles[i].shMouseOverL) {
        handles[i].shLockedL = true;
      } else {
        handles[i].shLockedR = false;
        handles[i].shLockedL = false;
      }
    }
  }
}

function mouseDragged() {
  for (let i = 0; i < handles.length; i++) {
    if (handles[i].target) {
      handles[i].position.x = mouseX - handles[i].xoffset;
      handles[i].position.y = mouseY - handles[i].yoffset;
    }
    if (handles[i].shLockedR) {
      handles[i].qdistance = constrain(mouseX - handles[i].position.x, handles[i].size, 100);
    }
    if (handles[i].shLockedL) {
      handles[i].qdistance = constrain(handles[i].position.x - mouseX, handles[i].size, 100);
    }
  }
}

function mouseReleased() {
  for (let i = 0; i < handles.length; i++) {
    handles[i].target = false;
    handles[i].shLockedR = false;
    handles[i].shLockedL = false;
  }
}

//Keep Audio Context ON
function touchStarted() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}

//===========================================================\\
//Encapsulation 
function loadMenuOptions() {
  sourceOptions.option('white noise');
  sourceOptions.option('pink noise');
  sourceOptions.option('brown noise');
  sourceOptions.option('sine wave');
  sourceOptions.option('triangle wave');
  sourceOptions.option('sawtooth wave');
  sourceOptions.option('square wave');
}

