function Scene2D(element){
	this.element = element;
	this.layer = 0;
	this.step = 0;
	this.scale = 1; 
	this.w = element.width();
	this.h = element.height();
	this.instructions = [];
	this.draw = SVG('renderArea2d');
	this.group= this.draw.group();
	this.path = [];
	this.polylines= [];
	this.ghost_polylines = [];
	this.circle = null;
	this.line = null;
	this.text = this.draw.text("sample");
	this.margin = 40;
	this.offset = [];

	var that = this;

	$(window).on('resize', function(){
		that.resize();
	});

}

Scene2D.prototype.group = null;
Scene2D.prototype.layer = 0;
Scene2D.prototype.offset = [];
Scene2D.prototype.polylines = [];
Scene2D.prototype.ghost_polylines = [];
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
Scene2D.prototype.path = [];
Scene2D.prototype.text = null;

Scene2D.prototype.clearLayerPaths = function(){
	for(var i in this.polylines){
		this.polylines[i].remove();
	}
	this.polylines = [];
	this.path = [];

	for(var i in this.ghost_polylines){
		this.ghost_polylines[i].remove();
	}
	this.ghost_polylines = [];

}

Scene2D.prototype.addLayerPaths = function(){
	var last = null;
	var inst = null;
	for(var i in this.instructions[this.layer]){
		inst = this.instructions[this.layer][i];
		this.addPath(inst, last);
		last = inst;		
	}
}

Scene2D.prototype.addPath= function(inst,last){
	if(inst.extruding){
		if (last == null || !last.extruding){
			var np = [];
			np.push(inst.from.x+","+inst.from.y);
			this.path.push(np);
			this.polylines.push(this.createPolyline());
		}
		this.path[this.path.count()-1].push(inst.to.x+","+inst.to.y);
	}

}

Scene2D.prototype.removePath = function(inst){
	if(inst.extruding){
		var last_ndx = this.path.count() -1;
		this.path[last_ndx].pop();
		
		//if there is only one item left than this inst represeents 
		//the first segment in a polyline, delete the whole path
		if(this.path[last_ndx].count() == 1){
			this.path.pop(); 
			var pl = this.polylines.pop();
			pl.remove();
		}
	}
}

Scene2D.prototype.createPolyline = function(){
	var pl = this.draw.polyline();
	pl.attr({'stroke-width':2/this.scale, stroke: '#333'});
	pl.fill('none');
	this.group.add(pl);
	return pl;	
}



Scene2D.prototype.popPathItem = function(){
	this.path[this.path.count()-1].pop();
}



Scene2D.prototype.add =function(instructions){
		this.step = 0;
		this.layer = 0;
		this.instructions = instructions;	

		//scale by bounding box
		var sx = bbbox.max.x - bbbox.min.x;
		var sy = bbbox.max.y - bbbox.min.y;

		console.log("scale x, y"+sx+" : "+sy);

		box_factor = (sx > sy ) ? sy : sx;
		window_factor = (this.w > this.h) ? this.h : this.w;
		console.log("boxfactor "+box_factor+" window factor"+window_factor);
		

		this.scale = (window_factor-this.margin*2) / box_factor; 		
		console.log("scale: "+this.scale);

		this.offset = {x:-bbbox.min.x + ((this.w - sx*this.scale)/2),
				y:-bbbox.min.y + ((this.h - sy*this.scale)/2)};
		
		this.text.center(this.w/2, this.h - this.margin/2);

		if(this.line != null) this.line.remove();
		if(this.circle != null) this.circle.remove();

		//create scene elements
		this.line = this.group.line(0,0,0,0);
		this.line.attr({'stroke-width':5/this.scale, stroke: '#666'});
		this.circle = this.group.circle(10/this.scale).fill('#000');
		this.group.translate(this.offset.x, this.offset.y);
		this.group.scale(this.scale, this.scale);
	
		this.clearLayerPaths();
		this.drawStep({fwd: true, reset:true});
}

Scene2D.prototype.resize =function(instructions){

	if(this.group != null){
		this.group.translate(-this.offset.x, -this.offset.y);
		this.group.scale(1/this.scale, 1/this.scale);
	}

	this.w = this.element.width();
	this.h = this.element.height();

	//scale by bounding box
	var sx = bbbox.max.x - bbbox.min.x;
	var sy = bbbox.max.y - bbbox.min.y;


	box_factor = (sx > sy ) ? sy : sx;
	window_factor = (this.w > this.h) ? this.h : this.w;

	this.scale = (window_factor-this.margin*2) / box_factor; 		
	this.offset = {x:-bbbox.min.x + ((this.w - sx*this.scale)/2),
				y:-bbbox.min.y + ((this.h - sy*this.scale)/2)};

	this.group.translate(this.offset.x, this.offset.y);
	this.group.scale(this.scale, this.scale);
	this.drawStep({fwd:true, reset:true});
}


Scene2D.prototype.nextLayer = function(){
	this.clearLayerPaths();
	if(this.layer < this.instructions.count()-1){
	       	this.layer++;
		this.step = 0;
	}
	this.drawStep({fwd: true, reset:false});
}


Scene2D.prototype.prevLayer= function(){
	this.clearLayerPaths();
	if(this.layer > 0){
		this.layer--;
		this.step = 0;
	}
	this.drawStep({fwd:true, reset:false});

}

Scene2D.prototype.nextStep = function(){

	if(this.step < this.instructions[this.layer].count()-1){
		this.step++; 
		this.drawStep({fwd:true, reset:false});

	}else{
		this.clearLayerPaths();
		this.step = 0;
		if(this.layer < this.instructions.count()-1) this.layer++;
		this.drawStep({fwd:true, reset:false});
	}

}

Scene2D.prototype.prevStep= function(){
	if(this.step > 0){ 
		this.step--;
		this.drawStep({fwd: false, reset:false});

	}else{
	 	if(this.layer > 0) this.layer--;
		this.addLayerPaths();
		this.step = this.instructions[this.layer].count() -1;
		this.drawStep({fwd: false, reset:false});
	}
}

/***
inc - {next: true/false, forward: true/false, new_layer: true/false}
*/
Scene2D.prototype.drawStep=function(cause){

	if(instructions && instructions.count() > 0){
	
		var i = instructions[this.layer][this.step];
		var li = (this.step > 0) ? instructions[this.layer][this.step-1]: null;
		
		if(!cause.reset){
			if(cause.fwd) this.addPath(i, li);
			else this.removePath(i); 
		}

		var polylist = [];
		for(var p in this.path){
			polylist.push(this.path[p].join(" "));
		}

		var anitime = i.d_traveling * (20); //20ms/mm

		for(var pl in this.polylines){		
			this.polylines[pl].plot(polylist[pl]);
		}
		
		this.line.plot(i.from.x, i.from.y, i.to.x, i.to.y);
		this.line.front();

		(i.extruding)? this.circle.attr({fill: '#0f0'}) :this.circle.attr({fill: '#f00'});
		if(cause.reset) this.circle.center(i.to.x,i.to.y);
		else this.circle.animate(anitime).center(i.to.x,i.to.y);
		this.circle.front();
	

		this.text.attr({fill: '#999'});
		this.text.text("layer: "+this.layer+"/"+this.instructions.count()+"\n "+i.text);
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



