function radiansToDegrees (_val) {  
  return _val * (Math.PI/180);
}

var lensBezier = MorphSVGPlugin.pathDataToBezier('M120,0H0v16c0,60,60,60,60,60c19.5,0,36.8-9.4,47.8-23.9c0.2-0.1,0.4-0.3,0.6-0.5l6.1-5.8c3.6-3.4,7.3-3.4,10.9,0l6.1,5.8  c0.2,0.2,0.4,0.3,0.6,0.5C143.1,66.6,160.5,76,180,76h0c33,0,60-27,60-60V0H120z', {
  offsetX: 0,
  offsetY: 0
})


let animationObject = { zoom:1, rotationX:0,rotationY:0  };


let svg = document.querySelector('.zdog-svg');
let container = document.querySelector('.container');

let scene = new Zdog.Anchor({
  translate: {x: 400, y: 300},
	zoom: 2,
	scale: 2
});
const rainbowBezierArray = [
	'M394.2,198.2c0-108.2-87.8-196-196-196S2.2,90,2.2,198.2',
	'M381.2,198.2c0-101.1-82-183-183-183s-183,82-183,183',
	'M368.3,198.2c0-93.9-76.2-170.1-170.1-170.1S28.1,104.3,28.1,198.2',
	'M355.3,198.2c0-86.8-70.4-157.1-157.1-157.1S41.1,111.4,41.1,198.2',
	'M342.4,198.2c0-79.6-64.5-144.2-144.2-144.2S54,118.6,54,198.2',
	'M329.4,198.2c0-72.5-58.7-131.2-131.2-131.2S67,125.7,67,198.2',
	'M316.5,198.2c0-65.3-52.9-118.3-118.3-118.3S79.9,132.9,79.9,198.2',
	'M303.5,198.2c0-58.2-47.1-105.3-105.3-105.3S92.9,140,92.9,198.2'
	
].reverse();

const rainbowColorArray = [
	'#F63959',
	'#F96937',
	'#FCD100',
	'#CECF00',
	'#70B44E',
	'#0C9DC5',
	'#344DC6',
	'#6535C4'
].reverse()

const mainGroup = new Zdog.Anchor({
  addTo: scene,
  translate: {y: 0, z: -0 }
});

const makeRings = () => {
	let shape, count = 160;
	for(let i = 0; i < 8; i++) {
		
		shape = new Zdog.Ellipse({
			translate: {x: -0, y: -0, z: count * 0.7 },
			addTo: mainGroup,
			diameter: count,
			closed: false,
			stroke: 40 ,
			fill: false,
			color: rainbowColorArray[i]
		});
		count -= 46;
	}
}

makeRings()

function animate() {

	scene.rotate.x  = radiansToDegrees(animationObject.rotationX);
	scene.rotate.y  = radiansToDegrees(animationObject.rotationY);

  scene.updateGraph();
  render();
}

function render() {
  empty( container );
  scene.renderGraphSvg( container );
}

function empty( element ) {
  while ( element.firstChild ) {
    element.removeChild( element.firstChild );
  }
}

var tl = new TimelineMax({  onUpdate: animate});
tl.to(animationObject, 12, {
	counter: 360,
	clockWise: 360,
  ease: Linear.easeNone,
	repeat: -1
})
.to(animationObject, 6, {
	rotationY: 360,
  ease: Sine.easeInOut,
	repeat: -1
}, 0)


TweenMax.globalTimeScale(0.5)