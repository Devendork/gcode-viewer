

function error(msg) {
  alert(msg);
}




function loadFile(path, callback /* function(contents) */) {
  $.get(path, null, callback, 'text')
    .error(function() { error() });
}

function about() {
  $('#aboutModal').modal();
}

function openDialog() {
  $('#openModal').modal();
}

var scene2d = null;
var scene3d = null;
var object = null;
var plane = null;

function createPlane(){
	var z;
	if(instructions != null){
		var i = instructions[0][0];
		z = i.to.z;
	}else z = 0;


  	var material = new THREE.MeshBasicMaterial( {color: 0x00FBFF, transparant:true, opacity: 0.2, side: THREE.DoubleSide} );
	var geometry = new THREE.PlaneGeometry(ebbox.max.x - ebbox.min.x, ebbox.max.y - ebbox.min.y);

	plane = new THREE.Mesh( geometry, material );
	
	var center = new THREE.Vector3(
  		ebbox.min.x + ((ebbox.max.x - ebbox.min.x) / 2),
  		ebbox.min.y + ((ebbox.max.y - ebbox.min.y) / 2), 
		z);
  
	plane.position = center;
	object.add(plane);	
}


function checkKey(e){


    e = e || window.event;
    if (e.keyCode == '37') {
		    // left arrow
		   scene2d.prevStep();
		}
	else if (e.keyCode == '39') {
		    //right arrow
		scene2d.nextStep();	
	}
	else if(e.keyCode == '38'){
		//up arrow
		scene2d.nextLayer();
	}else if(e.keyCode == '40'){
		//down arrow
		scene2d.prevLayer();
	}

}



function openGCodeFromPath(path) {
  $('#openModal').modal('hide');
  if (hasGL && object) {
    scene3d.remove(object);
  }

  loadFile(path, function(gcode) {
    instructions = createGeometryFromGCode(gcode);
    scene2d.add(instructions);

    if(hasGL){
    object = createObjectFromInstructions(instructions);
    createPlane();
    scene3d.add(object);
    }

    localStorage.setItem('last-loaded', path);
    localStorage.removeItem('last-imported');
  });
}

function openGCodeFromText(gcode) {
  $('#openModal').modal('hide');
  if (hasGL && object) {
    scene3d.remove(object);
    }
  
  instructions = createGeometryFromGCode(gcode);
  scene2d.add(instructions);
  
  if(hasGL){
  	object = createObjectFromInstructions(instructions);
  	createPlane();
	scene3d.add(object);
  }	

  localStorage.setItem('last-imported', gcode);
  localStorage.removeItem('last-loaded');
}

var hasGL = true;
$(function() {


  if (!Modernizr.webgl) {
    //alert('Sorry, you need a WebGL capable browser to use this.\n\nGet the latest Chrome or FireFox.');
    hasGL = false;  
}

  if (!Modernizr.localstorage) {
    alert("Man, your browser is ancient. I can't work with this. Please upgrade.");
    hasGL = false;
  }

  // Show 'About' dialog for first time visits.
  if (!localStorage.getItem("not-first-visit")) {
    localStorage.setItem("not-first-visit", true);
    setTimeout(about, 500);
  }

  
  // Drop files from desktop onto main page to import them.
  $('body').on('dragover', function(event) {
    event.stopPropagation();
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = 'copy'
  }).on('drop', function(event) {
    event.stopPropagation();
    event.preventDefault();
    var files = event.originalEvent.dataTransfer.files;
    if (files.length > 0) {
      var reader = new FileReader();
      reader.onload = function() {
        openGCodeFromText(reader.result);
      };
      reader.readAsText(files[0]);
    }
  });

  scene2d = new Scene2D($('#renderArea2d'));
  if(hasGL) scene3d = create3DScene($('#renderArea3d'));

  var lastImported = localStorage.getItem('last-imported');
  var lastLoaded = localStorage.getItem('last-loaded');
  if (lastImported) {
    openGCodeFromText(lastImported);
  } else {
    openGCodeFromPath(lastLoaded || 'examples/octocat.gcode');
  }
  
  
});

