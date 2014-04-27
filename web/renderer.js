function Scene2D(element){
	this.element = element;
	this.layer = 0;
	this.step = 0;
	this.scale = 1; 
	this.w = element.width();
	this.h = element.height();
	this.instructions = [];
	this.draw = SVG('renderArea2d');
	this.path = [];
	this.polylines= [];
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

Scene2D.prototype.layer = 0;
Scene2D.prototype.offset = [];
Scene2D.prototype.polylines = [];
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

		this.offset = {x:-bbbox.min.x + ((this.w - sx*this.scale)/2),
				y:-bbbox.min.y + ((this.h - sy*this.scale)/2)};
		
		this.text.center(this.w/2, this.h - this.margin/2);

		this.drawStep();
}

Scene2D.prototype.resize =function(instructions){

	///reset model->scene parameters
	if(this.line != null){
		this.line.translate(-this.offset.x, -this.offset.y);
		this.line.scale(1/this.scale, 1/this.scale);

	}
	if(this.circle != null) this.circle.translate(-this.offset.x, -this.offset.y);
	
	if(this.polylines.count() > 0){
		for(var i in this.polylines){
		var pl = this.polylines[i];
		pl.translate(-this.offset.x, -this.offset.y);
		pl.scale(1/this.scale, 1/this.scale);
		}
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
		
	if(this.line != null){
		this.line.translate(this.offset.x, this.offset.y);
		this.line.scale(this.scale, this.scale);
		this.line.attr({'stroke-width':5/this.scale, stroke: '#666'});
	}
	
	if(this.circle != null) this.circle.translate(this.offset.x, this.offset.y);

	if(this.polylines.count() > 0){
		for(var i in this.polylines){
			var pl = this.polylines[i];
			pl.translate(this.offset.x, this.offset.y);
			pl.scale(this.scale, this.scale);
			pl.attr({'stroke-width':2/this.scale, stroke: '#333'});
		}
	}
	this.drawStep();
}




Scene2D.prototype.nextLayer = function(){
	console.log("next layer");
	if(this.layer < this.instructions.count()){
	       	this.layer++;
		this.step = 0;
	}
	this.drawStep();
}


Scene2D.prototype.prevLayer= function(){
	console.log("prev layer");
	if(this.layer > 0){
		this.layer--;
		this.step = 0;
	}
	this.drawStep();
}

Scene2D.prototype.nextStep = function(){
	if(this.step < this.instructions[this.layer].count()) this.step++; 
	else this.nextLayer();
	this.drawStep();
}

Scene2D.prototype.prevStep= function(){
		if(this.step > 0) this.step--;
		else this.prevLayer();
		this.drawStep();
}

Scene2D.prototype.drawStep=function(){

	function create_line(p){
		var l = p.draw.line(0,0,0,0);
			l.translate(p.offset.x, p.offset.y);
			l.scale(p.scale, p.scale);
			l.attr({'stroke-width':5/p.scale, stroke: '#666'});
			return l;
	}

	function create_circle(p){
		var c = p.draw.circle(10);
		c.translate(p.offset.x, p.offset.y);
		return c;
	}

	function create_polyline(p){
		var pl = p.draw.polyline();
		pl.translate(p.offset.x, p.offset.y);
		pl.scale(p.scale, p.scale);
		pl.attr({'stroke-width':2/p.scale, stroke: '#333'});
		pl.fill('none');
		return pl;
	}

	if(instructions && instructions.count() > 0){
	
		if(this.line == null) this.line = create_line(this);
		if(this.circle == null) this.circle = create_circle(this);
		

		var i = instructions[this.layer][this.step];
		var li = (this.step > 0) ? instructions[this.layer][this.step -1]: i;
		if(this.step == 0){
			this.path = [];
			for(var p in this.polylines){
			   this.polylines[p].remove();
			}
			this.polylines = [];
		}

		if(i.extruding){
			if(this.path.count() == 0 || !li.extruding){
				 this.path.push([]);
				 this.path[this.path.count() -1].push(i.from.x+","+i.from.y);
				 this.polylines.push(create_polyline(this));  
			}
	 		this.path[this.path.count()-1].push(i.to.x+","+i.to.y);
		}

		var polylist = [];
		for(var p in this.path){
			polylist.push(this.path[p].join(" "));
		}


		var anitime = i.d_traveling * (20); //20ms/mm

		console.log(this.polylines.count());
		for(var pl in this.polylines){		
			this.polylines[pl].plot(polylist[pl]);
		}
		
		this.line.plot(i.from.x, i.from.y, i.to.x, i.to.y);
		this.line.front();

		(i.extruding)? this.circle.attr({fill: '#0f0'}) :this.circle.attr({fill: '#f00'});
		this.circle.animate(anitime).center(i.to.x*this.scale,i.to.y*this.scale);
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



