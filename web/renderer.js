function Scene2D(element){
	this.element = element;
	this.step = 0;
	this.scale = 1; 
	this.w = element.width();
	this.h = element.height();
	this.instructions = [];
	this.draw = SVG('renderArea2d');
	this.circle = this.draw.circle(10).attr({fill:'#fff'});
	this.line = this.draw.line(0,0,1,1);
	this.path = [];
	this.polyline= this.draw.polyline('0,0 1,1').attr({'stroke-width':10, stroke: '#333'});
	this.text = this.draw.text("sample");
	this.margin = 40;

}

Scene2D.prototype.element = null;
Scene2D.prototype.margin = 40;
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
Scene2D.prototype.text = null;

Scene2D.prototype.resize = function(){
		//undo old scaleing
		var offset_x = -bbbox.min.x + ((this.w - sx*this.scale)/2);
		var offset_y = -bbbox.min.y + ((this.h - sy*this.scale)/2);
		
		this.line.translate(-offset_x, -offset_y);
		this.line.scale(1/this.scale, 1/this.scale);
		this.circle.translate(-offset_x, -offset_y);
		this.polyline.translate(-offset_x, -offset_y);
		this.polyline.scale(1/this.scale, 1/this.scale);
	
		//calculate new vars
		this.w = this.element.width();
		this.h = this.element.height();
		
		var sx = bbbox.max.x - bbbox.min.x;
		var sy = bbbox.max.y - bbbox.min.y;

		console.log("scale x, y"+sx+" : "+sy);

		box_factor = (sx > sy ) ? sy : sx;
		window_factor = (this.w > this.h) ? this.h : this.w;
		console.log("boxfactor "+box_factor+" window factor"+window_factor);

		this.scale = (window_factor-this.margin*2) / box_factor; 
		
		offset_x = -bbbox.min.x + ((this.w - sx*this.scale)/2);
		offset_y = -bbbox.min.y + ((this.h - sy*this.scale)/2);
		
		this.line.translate(offset_x, offset_y);
		this.line.scale(this.scale, this.scale);
		this.line.attr({'stroke-width':5/this.scale, stroke: '#666'});
		this.circle.translate(offset_x, offset_y);
		this.polyline.translate(offset_x, offset_y);
		this.polyline.scale(this.scale, this.scale);
		this.polyline.attr({'stroke-width':2/this.scale, stroke: '#333'});

		this.drawStep();
 
}


Scene2D.prototype.add =function(instructions){
		this.step = 0;
		this.instructions = instructions;	

		//scale by bounding box
		var sx = bbbox.max.x - bbbox.min.x;
		var sy = bbbox.max.y - bbbox.min.y;

		console.log("scale x, y"+sx+" : "+sy);

		box_factor = (sx > sy ) ? sy : sx;
		window_factor = (this.w > this.h) ? this.h : this.w;
		console.log("boxfactor "+box_factor+" window factor"+window_factor);

		this.scale = (window_factor-this.margin*2) / box_factor; 
		
		var offset_x = -bbbox.min.x + ((this.w - sx*this.scale)/2);
		var offset_y = -bbbox.min.y + ((this.h - sy*this.scale)/2);

		this.text.center(this.w/2, this.h - this.margin/2);

		
		this.line.translate(offset_x, offset_y);
		this.line.scale(this.scale, this.scale);
		this.line.attr({'stroke-width':5/this.scale, stroke: '#666'});
		this.circle.translate(offset_x, offset_y);
		this.polyline.translate(offset_x, offset_y);
		this.polyline.scale(this.scale, this.scale);
		this.polyline.attr({'stroke-width':2/this.scale, stroke: '#333'});

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
		
	if(instructions && instructions.count() > 0){
		
		var i = instructions[this.step];
		
		if(i.coords.dz != 0) this.path = [];

		if(i.extruding){
			if(this.path.count() == 0) this.path.push(i.from.x+","+i.from.y);
			this.path.push(i.to.x+","+i.to.y);
		}

		var polylist = this.path.join(" ");

		var anitime = i.d_traveling * (20); //20ms/mm

		this.line.plot(i.from.x, i.from.y, i.to.x, i.to.y);

		(i.extruding)? this.circle.attr({fill: '#0f0'}) :this.circle.attr({fill: '#f00'});
		this.circle.animate(anitime).center(i.to.x*this.scale,i.to.y*this.scale);
		this.circle.front();
		
		this.polyline.plot(polylist);
		this.polyline.back();

		this.text.attr({fill: '#999'});
		this.text.text(i.text);
		this.text.front();
		this.text.center(this.w/2, this.h - this.margin/2);

		}else{
		this.text.clear();
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



