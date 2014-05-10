function Scene2D(element){
	this.num_instructions = 0;
	this.num_per_layer = [];
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
	this.ghost_path = [];
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


Scene2D.prototype.num_per_layer= [];
Scene2D.prototype.num_instructions = 0;
Scene2D.prototype.group = null;
Scene2D.prototype.layer = 0;
Scene2D.prototype.offset = [];
Scene2D.prototype.polylines = [];
Scene2D.prototype.ghost_paths = [];
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
	this.ghost_path = [];

}

Scene2D.prototype.addGhostPaths = function(){
	var last = null;
	var inst = null;	

	for(var i in this.instructions[this.layer]){
		inst = this.instructions[this.layer][i];
		if(inst.type == "G1"){
			this.addGhostPath(inst, last);
			last = inst;
		}
	}
	
	var g_polylist = [];
	for(var g in this.ghost_path){
		g_polylist.push(this.ghost_path[g].join(" "));
	}

	//draw them to screen
	for(var gpl in this.ghost_polylines){		
		this.ghost_polylines[gpl].plot(g_polylist[gpl]);
	}
}


Scene2D.prototype.addLayerPaths = function(){
	var last = null;
	var inst = null;	

	for(var i in this.instructions[this.layer]){
		inst = this.instructions[this.layer][i];
		if(inst.type == "G1"){ 
			this.addPath(inst, last);
			last = inst;	
		}	
	}

}

Scene2D.prototype.addGhostPath= function(inst,last){
	if(inst.type == "G1" && inst.ext){
		if (last == null || !last.ext){
			var np = [];
			np.push(inst.coord.x+","+inst.coord.y);
			this.ghost_path.push(np);
			this.ghost_polylines.push(this.createPolyline(true));
		}
		this.ghost_path[this.ghost_path.count()-1].push(inst.obj.to.x+","+inst.obj.to.y);
	}

}

Scene2D.prototype.addPath= function(inst,last){
	if(inst.type == "G1" && inst.ext){
		if (last == null || !last.ext){
			var np = [];
			np.push(inst.coord.x+","+inst.coord.y);
			this.path.push(np);
			this.polylines.push(this.createPolyline(false));
		}
		this.path[this.path.count()-1].push(inst.obj.to.x+","+inst.obj.to.y);
	}

}

Scene2D.prototype.removePath = function(inst){
	if(inst.type == "G1" && inst.ext){
		
		var last_ndx = this.path.count() -1;
		var last_coord = this.path[last_ndx].pop();

		if(this.path[last_ndx].count() == 1){
			this.path.pop(); 
			var pl = this.polylines.pop();
			pl.remove();
		}
	}
}

Scene2D.prototype.createPolyline = function(ghost){
	var pl = this.draw.polyline();
	if(!ghost) pl.attr({'stroke-width':2/this.scale, stroke: '#999'});
	else pl.attr({'stroke-width':2/this.scale, stroke: '#333'});
	pl.fill('none');
	this.group.add(pl);
	return pl;	
}



Scene2D.prototype.add =function(instructions){
		this.step = 0;
		this.layer = 0;
		this.instructions = instructions;	

		var count = 0;
		
		for(var i in instructions){
			this.num_per_layer.push(count);
			count += instructions[i].count();
		}
		this.num_instructions = count;


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
				y:-bbbox.min.y + ((this.h - sy*this.scale)/4)};
		
		//this.text.center(this.w/2, this.h - 2*this.margin/3);

		if(this.line != null) this.line.remove();
		if(this.circle != null) this.circle.remove();

		//create scene elements
		this.line = this.group.line(0,0,0,0);
		this.line.attr({'stroke-width':5/this.scale, stroke: '#666'});
		this.circle = this.group.circle(10/this.scale).fill('#f00');
		this.circle.move(0,0);
		
	

		this.group.translate(this.offset.x, this.offset.y);
		this.group.scale(this.scale, this.scale);
		this.clearLayerPaths();
		this.addGhostPaths();
		this.drawStep({fwd: true, reset:true});
}

Scene2D.prototype.resize =function(){

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

Scene2D.prototype.updatePlane = function(){
	if(!hasGL) return;
	var instruction = null;
	var i = 0;
	while(instruction == null && i < this.instructions[this.layer].count()){
		instruction = this.instructions[this.layer][i].obj;
		i++;
	}

	var zpos = (instruction == null)? 0 : instruction.to.z;
	var center = new THREE.Vector3(
		ebbox.min.x + ((ebbox.max.x - ebbox.min.x) / 2),
		ebbox.min.y + ((ebbox.max.y - ebbox.min.y) / 2),
		zpos);
	plane.position = center;

}

Scene2D.prototype.nextLayer = function(){
	if(this.layer < this.instructions.count()-1){
		this.clearLayerPaths();
	       	this.layer++;
		this.step = 0;
		this.addGhostPaths();
		this.drawStep({fwd: true, reset:false});
		this.updatePlane();
	}
}


Scene2D.prototype.prevLayer= function(){
	if(this.layer > 0){
		this.clearLayerPaths();
		this.layer--;
		this.step = 0;
		this.addGhostPaths();
		this.drawStep({fwd:true, reset:false});
		this.updatePlane();
	}

}

Scene2D.prototype.nextStep = function(){

	if(this.step < this.instructions[this.layer].count()-1){
		this.step++; 
		this.drawStep({fwd:true, reset:false});

	}else{
		this.clearLayerPaths();
		this.step = 0;
		if(this.layer < this.instructions.count()-1) this.layer++;
		this.addGhostPaths();
		this.drawStep({fwd:true, reset:false});
		this.updatePlane();
	}

}

Scene2D.prototype.prevStep= function(){
	if(this.step > 0){ 
		this.step--;
		this.drawStep({fwd: false, reset:false});

	}else{
	 	if(this.layer > 0){
			this.clearLayerPaths();
			this.layer--;
			this.addGhostPaths();
			this.addLayerPaths();
			this.step = this.instructions[this.layer].count() -1;
			this.drawStep({fwd: false, reset:false});
			this.updatePlane();
		}
	}
}

Scene2D.prototype.getLastGInst = function(){
	var ndx = this.step -1;
	var inst = null
	while(ndx > 0 && inst == null){
		var check = this.instructions[this.layer][ndx];
		if(check.type == "G1") inst = check;
		ndx--;	
	} 
	return inst;
}

/***
inc - {next: true/false, forward: true/false, new_layer: true/false}
*/
Scene2D.prototype.drawStep=function(cause){


	if(instructions && instructions.count() > 0){
			
		var inst = instructions[this.layer][this.step];
		var li = this.getLastGInst(this); 
		var ni = (this.step <= this.instructions[this.layer].count()-1) ? this.instructions[this.layer][this.step+1] : null;
		
		var d = 0;
		if(inst.type == "G1" && !cause.reset && cause.fwd){
			this.addPath(inst, li);
			d = inst.obj.d_traveling;
		}
	
		if(!cause.reset && !cause.fwd && (ni != null && ni.type == "G1")){
			this.removePath(ni);
			d = ni.obj.d_traveling;
		}

		var polylist = [];
		for(var p in this.path){
			polylist.push(this.path[p].join(" "));
		}

			
		var anitime = d * (10); //20ms/mm
		for(var pl in this.polylines){		
			this.polylines[pl].plot(polylist[pl]);
			this.polylines[pl].front();
		}

		if(inst != null){
		if(cause.reset) this.circle.center(inst.coord.x,inst.coord.y);
		else if(inst.type == "G1") this.circle.animate(anitime).center(inst.obj.to.x,inst.obj.to.y);
		else this.circle.animate(anitime).center(inst.coord.x, inst.coord.y);
		}

		if(inst.type == "G1") this.text.attr({fill: '#999'});
		else this.text.attr({fill:'#f00'});

	
		this.circle.front();

		(inst.ext) ? this.circle.attr({fill: '#0f0'}) :this.circle.attr({fill: '#f00'});
		

		this.text.text(inst.text
			      +"\n"+inst.desc
			      +"\nlayer: "+(this.layer+1)+" of "+this.instructions.count()
			      +" // instruction "+(this.num_per_layer[this.layer]+ this.step + 1)+" of "+(this.num_instructions));

		this.text.front();
		this.text.center(this.w/2, this.h - 3*this.margin/2);
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
  //camera.lookAt(plane.position);
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



