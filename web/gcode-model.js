var bbbox = { min: { x:10000,y:10000,z:10000}, max: { x:-10000,y:-10000,z:-10000} };
var ebbox = { min: { x:10000,y:10000,z:10000}, max: { x:-10000,y:-10000,z:-10000} };

//we need a function that doesn't return object but has the parsing
//2D/3D independent
function createGeometryFromGCode(gcode) {
  
bbbox = { min: { x:10000,y:10000,z:10000}, max: { x:-10000,y:-10000,z:-10000} };
ebbox = { min: { x:10000,y:10000,z:10000}, max: { x:-10000,y:-10000,z:-10000} };

  // GCode descriptions come from:
  //    http://reprap.org/wiki/G-code
  //    http://en.wikipedia.org/wiki/G-code
  //    SprintRun source code
  var instructions = []; //instructions by layer  
  var lastLine = {x:0, y:0, z:0, e:0, f:0, extruding:false};
 
 	var layers = [];
 	var layer = undefined;
 	
	
	var relative = false;
  	function delta(v1, v2) {
		return relative ? v2 : v2 - v1;
	}
	function absolute (v1, v2) {
		return relative ? v1 + v2 : v2;
	}


 	function addMove(p1, p2, itext) {
		
		var s = p2.f; //units: mm/min	
		var e = delta(p1.e, p2.e); //mm's extruded
		var dx = delta(p2.x, p1.x);
		var dy = delta(p2.y, p1.y);
		var dz = delta(p1.z, p2.z);
		var move_distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

		var instruction = {
			text: itext,
			from: p1,
			to: p2,
			speed:s,
		        coords: {dx: dx, dy:dy, dz:dz},	
			d_traveling: move_distance,
			d_extruding: e,
			extruding: (e > 0)
		}

		if(instructions.count() == 0 || instruction.coords.dz > 0){
			instructions.push([]); //create a new layer of instructions	
		}

		instructions[instructions.count()-1].push(instruction);
		
			bbbox.min.x = Math.min(bbbox.min.x, p2.x);
			bbbox.min.y = Math.min(bbbox.min.y, p2.y);
			bbbox.min.z = Math.min(bbbox.min.z, p2.z);
			bbbox.max.x = Math.max(bbbox.max.x, p2.x);
			bbbox.max.y = Math.max(bbbox.max.y, p2.y);
			bbbox.max.z = Math.max(bbbox.max.z, p2.z);

		if (e>0) {
			ebbox.min.x = Math.min(ebbox.min.x, p2.x);
			ebbox.min.y = Math.min(ebbox.min.y, p2.y);
			ebbox.min.z = Math.min(ebbox.min.z, p2.z);
			ebbox.max.x = Math.max(ebbox.max.x, p2.x);
			ebbox.max.y = Math.max(ebbox.max.y, p2.y);
			ebbox.max.z = Math.max(ebbox.max.z, p2.z);
		}
 	}

  
  var parser = new GCodeParser({  	
    G1: function(args, line) {
      // Example: G1 Z1.0 F3000
      //          G1 X99.9948 Y80.0611 Z15.0 F1500.0 E981.64869
      //          G1 E104.25841 F1800.0
      // Go in a straight line from the current (X, Y) point
      // to the point (90.6, 13.8), extruding material as the move
      // happens from the current extruded length to a length of
      // 22.4 mm.

      var newLine = {
        x: args.x !== undefined ? absolute(lastLine.x, args.x) : lastLine.x,
        y: args.y !== undefined ? absolute(lastLine.y, args.y) : lastLine.y,
        z: args.z !== undefined ? absolute(lastLine.z, args.z) : lastLine.z,
        e: args.e !== undefined ? absolute(lastLine.e, args.e) : lastLine.e,
        f: args.f !== undefined ? absolute(lastLine.f, args.f) : lastLine.f,
      };

      var instruction_text = "G1";
      if(args.x !== undefined) instruction_text = instruction_text +" X"+args.x;
      if(args.y !== undefined) instruction_text = instruction_text +" Y"+args.y;
      if(args.z !== undefined) instruction_text = instruction_text +" Z"+args.z;
      if(args.f !== undefined) instruction_text = instruction_text +" F"+args.f;
      if(args.e !== undefined) instruction_text = instruction_text +" E"+args.e;
 	
      addMove(lastLine, newLine, instruction_text);
      lastLine = newLine;

     },

    G21: function(args) {
      // G21: Set Units to Millimeters
      // Example: G21
      // Units from now on are in millimeters. (This is the RepRap default.)

      // No-op: So long as G20 is not supported.
    },

    G90: function(args) {
      // G90: Set to Absolute Positioning
      // Example: G90
      // All coordinates from now on are absolute relative to the
      // origin of the machine. (This is the RepRap default.)

      relative = false;
    },

    G91: function(args) {
      // G91: Set to Relative Positioning
      // Example: G91
      // All coordinates from now on are relative to the last position.

      // TODO!
      relative = true;
    },

    G92: function(args) { // E0
      // G92: Set Position
      // Example: G92 E0
      // Allows programming of absolute zero point, by reseting the
      // current position to the values specified. This would set the
      // machine's X coordinate to 10, and the extrude coordinate to 90.
      // No physical motion will occur.

      // TODO: Only support E0
      var newLine = lastLine;
      newLine.x= args.x !== undefined ? args.x : newLine.x;
      newLine.y= args.y !== undefined ? args.y : newLine.y;
      newLine.z= args.z !== undefined ? args.z : newLine.z;
      newLine.e= args.e !== undefined ? args.e : newLine.e;
      lastLine = newLine;
    },

    M82: function(args) {
      // M82: Set E codes absolute (default)
      // Descriped in Sprintrun source code.

      // No-op, so long as M83 is not supported.
    },

    M84: function(args) {
      // M84: Stop idle hold
      // Example: M84
      // Stop the idle hold on all axis and extruder. In some cases the
      // idle hold causes annoying noises, which can be stopped by
      // disabling the hold. Be aware that by disabling idle hold during
      // printing, you will get quality issues. This is recommended only
      // in between or after printjobs.

      // No-op
    },

    'default': function(args, info) {
      console.error('Unknown command:', args.cmd, args, info);
    },
  });

  parser.parse(gcode);
  console.log("bbox ", bbbox);
  return instructions;
  }

function createObjectFromInstructions(instructions) {
 
 	var layers = [];
 	var layer = undefined;
 

 	function newLayer(line) {
 		layer = { type: {}, layer: layers.count(), z: line.z, };
 		layers.push(layer);
 	}
 	function getLineGroup(i, line){
 		if (layer == undefined)
 			newLayer(line);
 		var grouptype = (i.extruding ? 10000 : 0) + i.speed;
 		var color = new THREE.Color(i.extruding ? 0xffffff : 0x0000ff);
 		if (layer.type[grouptype] == undefined) {
			layer.type[grouptype] = {
 				type: grouptype,
 				feed: i.d_extruding,	
 				extruding: i.extruding,
 				color: color,
 				segmentCount: 0,
 				material: new THREE.LineBasicMaterial({
					  opacity:i.extruding ? 0.5 : 0.4,
					  transparent: true,
					  linewidth: 1,
					  vertexColors: THREE.FaceColors }),
				geometry: new THREE.Geometry(),
			}
		}
		return layer.type[grouptype];
 	}
 	function addSegment(i, p1, p2) {
		var group = getLineGroup(i, p2);
		var geometry = group.geometry;

			
		group.segmentCount++;
        	geometry.vertices.push(new THREE.Vertex(
            new THREE.Vector3(p1.x, p1.y, p1.z)));
        	geometry.vertices.push(new THREE.Vertex(
            new THREE.Vector3(p2.x, p2.y, p2.z)));
        	geometry.colors.push(group.color);
        	geometry.colors.push(group.color);
	}
  
 
	for(var l in instructions){
		for(var ndx in instructions[l]){
		var i = instructions[l][ndx]; 
		var p1 = i.from;
		var p2 = i.to;
		addSegment(i, p1, p2);
		if(ndx == 0) newLayer(p2);
	}
      }
       

  console.log("Layer Count ", layers.count());

  var object = new THREE.Object3D();
	
	for (var lid in layers) {
		var layer = layers[lid];
		for (var tid in layer.type) {
			var type = layer.type[tid];
		  object.add(new THREE.Line(type.geometry, type.material, THREE.LinePieces));
		}
	}

  // Center
  var scale = 2; // TODO: Auto size

  var center = new THREE.Vector3(
  		ebbox.min.x + ((ebbox.max.x - ebbox.min.x) / 2),
  		ebbox.min.y + ((ebbox.max.y - ebbox.min.y) / 2),
  		ebbox.min.z + ((ebbox.max.z - ebbox.min.z) / 2));
	console.log("center ", center);
  
  object.position = center.multiplyScalar(-scale);

  object.scale.multiplyScalar(scale);

  return object;
}
