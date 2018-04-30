
//Define Namespace for NgChmGui MatrixFile
NgChmGui.createNS('NgChmGui.TRANS');

NgChmGui.TRANS.getWorkingMatrix =  function() {
	var req = new XMLHttpRequest();
	req.open("GET", "GetWorkingMatrix", true);
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to get working matrix '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	matrixInfo = JSON.parse(req.response);
	        	document.getElementById('numRows').innerHTML = matrixInfo.numRows;
	        	document.getElementById('numCols').innerHTML = matrixInfo.numCols;
	        	document.getElementById('numInvalid').innerHTML = matrixInfo.numInvalid;
	        	document.getElementById('numMissing').innerHTML = matrixInfo.numMissing;
	        	topMatrixString = matrixInfo.matrixsample;
	        	var matrixBox = document.getElementById('trans_data');
	        	var matrixDisplayBox = document.getElementById('matrixDisplay');
	        	matrixBox.style.display = '';
	        	matrixDisplayBox.style.display = '';
	        	dataTable = Object.keys(topMatrixString).map(function(k) { return topMatrixString[k] });
	        	loadDataFromFile();
	        	
	        	var ctx = document.getElementById("histo_canvas").getContext("2d");
    
	        	var graph = new BarGraph(ctx);
	        	graph.margin = 2;
	        	graph.width = 450;
	        	graph.height = 150;
	        	graph.colors = ['blue'];
	        	var histoBins = matrixInfo.histoBins;
	        	histoBins.unshift("Missing");
	        	graph.xAxisLabelArr = histoBins;//["Missing Values", matrixInfo.histoBins];
	        	var histoCounts = matrixInfo.histoCounts; 
	        	histoCounts.unshift(matrixInfo.numMissing);
	        	graph.update(histoCounts);//[matrixInfo.numMissing,matrixInfo.histoCounts]);
		    }
		}
	};
	req.send();
	
	function loadDataFromFile() {

		var getData = (function () {
			return function () {
				    var page = parseInt(window.location.hash.replace('#', ''), 10) || 1,
					limit = 50,
					row = (page - 1) * limit,
					count = page * limit,
					part = dataTable;
				    return part;
				};
		    })();

	    	var container = document.getElementById('matrixDisplay');
	    	//clear out matrix from previous runs
	    	while (container.hasChildNodes()) {
	    		container.removeChild(container.lastChild);
	    	}

		    var hot = new Handsontable(container, {
				data: getData(),
			    cells: function(row, col, prop) {
			        var cellProperties = {};
			        return cellProperties;
			      }
		    });
	        hot.render();
	}
}

NgChmGui.TRANS.resetPanel = function(dropdown_set) {
	document.getElementById('ReplaceNonNumeric').style.display = 'none';
	document.getElementById('FillMissing').style.display = 'none';
	document.getElementById('Variation').style.display = 'none';
	document.getElementById('Range').style.display = 'none';
	document.getElementById('MissingData').style.display = 'none';
	document.getElementById('Log').style.display = 'none';
	document.getElementById('MeanCenter').style.display = 'none';
	document.getElementById('Z-Norm').style.display = 'none';
	document.getElementById('Arithmetic').style.display = 'none';
		
	if (dropdown_set != 'Correction') {
		document.getElementById('Correction').value = '';	
		document.getElementById('correct_btn').style.display = 'none';
	}
	if (dropdown_set != 'Filter') {
		document.getElementById('Filter').value = '';	
		document.getElementById('filter_btn').style.display = 'none';
	}
	if (dropdown_set != 'Transform') {
		document.getElementById('Transform').value = '';	
		document.getElementById('trans_btn').style.display = 'none';
	}
}

NgChmGui.TRANS.selectCorrection =  function() {
	NgChmGui.TRANS.resetPanel('Correction');
	var sel = document.getElementById('Correction');
	var correction = sel.options[sel.selectedIndex].value;
		
	var div = document.getElementById(correction);
	
	if (div !== undefined && div !== null) {
		div.style.display = '';
		document.getElementById('correct_btn').style.display = '';
	}	else {
		document.getElementById('correct_btn').style.display = 'none';
	}
}

NgChmGui.TRANS.selectFilter =  function() {
	NgChmGui.TRANS.resetPanel('Filter');
	var sel = document.getElementById('Filter');
	var filter = sel.options[sel.selectedIndex].value;
		
	var div = document.getElementById(filter);
	
	if (div !== undefined && div !== null) {
		div.style.display = '';
		document.getElementById('filter_btn').style.display = '';
	}	else {
		document.getElementById('filter_btn').style.display = 'none';
	}
}

NgChmGui.TRANS.selectTransform =  function() {
	NgChmGui.TRANS.resetPanel('Transform');
	var sel = document.getElementById('Transform');
	var filter = sel.options[sel.selectedIndex].value;
		
	var div = document.getElementById(filter);
	
	if (div !== undefined && div !== null) {
		div.style.display = '';
		document.getElementById('trans_btn').style.display = '';
	}	else {
		document.getElementById('trans_btn').style.display = 'none';
	}
}

NgChmGui.TRANS.enableButton = function(buttonId) {
	document.getElementById(buttonId).style.opacity = 1.0;
	document.getElementById(buttonId).disabled = false;
}

NgChmGui.TRANS.correctMatrixData =  function() {
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("missing_frm") );
	req.open("POST", "CorrectMatrix", true);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to correct matrix '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	result = req.response;
	        	NgChmGui.TRANS.getWorkingMatrix();
		    }
		}
	};
	req.send(formData);
}

NgChmGui.TRANS.filterMatrixData =  function() {
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("filter_frm") );
	req.open("POST", "FilterMatrix", true);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to filter matrix '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	result = req.response;
	        	NgChmGui.TRANS.getWorkingMatrix();
		    }
		}
	};
	req.send(formData);
}

NgChmGui.TRANS.transformMatrixData =  function() {
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("trans_frm") );
	req.open("POST", "TransformMatrix", true);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to filter matrix '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	result = req.response;
	        	NgChmGui.TRANS.getWorkingMatrix();
		    }
		}
	};
	req.send(formData);
}

NgChmGui.TRANS.resetMatrix =  function() {
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("trans_frm") );
	req.open("POST", "ResetMatrix", true);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to filter matrix '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	result = req.response;
	        	NgChmGui.TRANS.getWorkingMatrix();
		    }
		}
	};
	req.send(formData);
}