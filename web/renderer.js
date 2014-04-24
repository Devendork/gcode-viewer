
function Scene2D(element){
	this.step = 0;
	this.scale = 1; 
	this.w = element.width();
	this.h = element.height();
	this.instructions = [];
	this.draw = SVG('renderArea2d');
	this.circle = this.draw.circle(10).attr({fill:'#fff'});
	this.line = this.draw.line(0,0,1,1).attr({'stroke-width':10, stroke: '#666'});
	this.path = [];
	this.polyline= this.draw.polyline('0,0 1,1').attr({'stroke-width':10, stroke: '#333'});
}

Scene2D.prototype.step = 0;
Scene2D.prototype.scale= 1;
Scene2D.prototype.w= 1;
Scene2D.prototype.h= 1;
Scene2D.prototype.instructions = [];
Scene2D.prototype.draw = null;
Scene2D.prototype.circle= null;
Scene2D.prototype.line = null;
Scene2D.prototype.polyline = null;
Scene2D.prototype.path = [];


Scene2D.prototype.add =function(instructions){
		this.step = 0;
		this.instructions = instructions;	

		//scale by bounding box
		var sx = bbbox.max.x - bbbox.min.x;
		var sy = bbbox.max.y - bbbox.min.y;

		console.log("scale x, y"+sx+" : "+sy);

		box_factor = (sx > sy ) ? sx : sy;
		window_factor = (this.w > this.h) ? this.w : this.h;
		console.log("boxfactor "+box_factor+" window factor"+window_factor);

		this.scale = window_factor / box_factor; 
		this.drawStep();
}

Scene2D.prototype.nextStep = function(){
	if(this.step < instructions.count()) this.step++; 
	this.drawStep();
}

Scene2D.prototype.prevStep= function(){
		if(this.step > 0) this.step--;
		this.drawStep();
}

Scene2D.prototype.drawStep=function(){
		console.log("drawing step "+this.step+" at scale "+this.scale);
		if(instructions && instructions.count() > 0){
		var i = instructions[this.step];
		console.log(i);
		
		$("#itext").text(i.text);

		var offset = {
			x1: (i.from.x)*this.scale- bbbox.min.x,
			y1: (i.from.y)*this.scale- bbbox.min.y,
			x2: (i.to.x)*this.scale- bbbox.min.x,
			y2: (i.to.y)*this.scale-bbbox.min.y
		}

		//delete the polyline at each new layer
		if(i.coords.dz > 0) this.path = [];

		if(this.path.count() == 0) this.path.push(offset.x1+","+offset.y1);
		this.path.push(offset.x2+","+offset.y2);

		var polylist = this.path.join(" ");
		console.log(polylist);

		console.log(offset);
		this.line.plot(offset.x1, offset.y1, offset.x2, offset.y2);
		
		var anitime = i.d_traveling * (20);

		(i.etruding)? this.circle.attr({fill: "#00ff00"}) :this.circle.attr({fill: "#ff0000"});
		this.circle.animate(anitime).move(offset.x2-10, offset.y2-10);
		this.circle.front();
		
		this.polyline.plot(polylist);
		this.polyline.back();

		}
}	

function create3DScene(element) {

  // Renderer
  var split_width = element.width();
  var renderer = new THREE.WebGLRenderer({clearColor:0x000000, clearAlpha: 1});
  renderer.setSize(split_width, element.height());
  element.append(renderer.domElement);
  renderer.clear();

  // Scene
  var scene3d = new THREE.Scene(); 

  // Lights...
  [[0,0,1,  0xFFFFCC],
   [0,1,0,  0xFFCCFF],
   [1,0,0,  0xCCFFFF],
   [0,0,-1, 0xCCCCFF],
   [0,-1,0, 0xCCFFCC],
   [-1,0,0, 0xFFCCCC]].forEach(function(position) {
    var light = new THREE.DirectionalLight(position[3]);
    light.position.set(position[0], position[1], position[2]).normalize();
    scene3d.add(light);
  });

  // Camera...
  var fov    = 45,
      aspect = split_width / element.height(),
      near   = 1,
      far    = 10000,
      camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  //camera.rotationAutoUpdate = true;
  //camera.position.x = 0;
  //camera.position.y = 500;
  camera.position.z = 300;
  //camera.lookAt(scene.position);
  scene3d.add(camera);
  controls = new THREE.TrackballControls(camera);
  controls.noPan = true;
  controls.dynamicDampingFactor = 0.15;

  // Action!
  function render() {
    controls.update();
    renderer.render(scene3d, camera);

    requestAnimationFrame(render); // And repeat...
  }
  render();

  // Fix coordinates up if window is resized.
  $(window).on('resize', function() {
    renderer.setSize(split_width, element.height());
    camera.aspect = split_width / element.height();
    camera.updateProjectionMatrix();
    controls.screen.width = window.innerWidth/2;
    controls.screen.height = window.innerHeight;
  });

  return scene3d;
}

