
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
	        	document.getElementById('maxVal').innerHTML = matrixInfo.maxValue;
	        	document.getElementById('minVal').innerHTML = matrixInfo.minValue;
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
	        	var histoBins = matrixInfo.histoBins;
	        	histoBins.unshift("Missing");
	        	var colors = new Array(histoBins.length);
	        	colors[0] = 'black';
	        	colors.fill('blue',1,colors.length);
	        	graph.colors = colors;
	        	graph.xAxisLabelArr = histoBins;//["Missing Values", matrixInfo.histoBins];
	        	var histoCounts = matrixInfo.histoCounts; 
	        	histoCounts.unshift(matrixInfo.numMissing);
	        	graph.update(histoCounts);//[matrixInfo.numMissing,matrixInfo.histoCounts]);
	        	
	        	var rowSDCtx = document.getElementById("row_sd_histo_canvas").getContext("2d");
	            
	        	var rowSDGraph = new BarGraph(rowSDCtx);
	        	rowSDGraph.margin = 2;
	        	rowSDGraph.width = 450;
	        	rowSDGraph.height = 150;
	        	rowSDGraph.colors = ['blue'];
	        	var histoBins = matrixInfo.rowStdHistoBins;
//	        	histoBins.unshift("Missing");
	        	rowSDGraph.xAxisLabelArr = histoBins;//["Missing Values", matrixInfo.histoBins];
	        	var histoCounts = matrixInfo.rowStdHistoCounts; 
//	        	histoCounts.unshift(matrixInfo.numMissing);
	        	rowSDGraph.update(histoCounts);//[matrixInfo.numMissing,matrixInfo.histoCounts]);
	        	
	        	var colSDCtx = document.getElementById("col_sd_histo_canvas").getContext("2d");
	            
	        	var colSDGraph = new BarGraph(colSDCtx);
	        	colSDGraph.margin = 2;
	        	colSDGraph.width = 450;
	        	colSDGraph.height = 150;
	        	colSDGraph.colors = ['blue'];
	        	var histoBins = matrixInfo.colStdHistoBins;
//	        	histoBins.unshift("Missing");
	        	colSDGraph.xAxisLabelArr = histoBins;//["Missing Values", matrixInfo.histoBins];
	        	var histoCounts = matrixInfo.colStdHistoCounts; 
//	        	histoCounts.unshift(matrixInfo.numMissing);
	        	colSDGraph.update(histoCounts);//[matrixInfo.numMissing,matrixInfo.histoCounts]);
		    }
	        NgChmGui.UTIL.hideLoading();
		}
	};
	req.send();
	NgChmGui.UTIL.showLoading();
	
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
	document.getElementById('ReplaceInvalid').style.display = 'none';
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

NgChmGui.TRANS.selectHistogram =  function() {
	var sel = document.getElementById('Histogram');
	var histogram = sel.options[sel.selectedIndex].value;
		
	var histos = ["matrix_histo", "row_sd_matrix_histo","col_sd_matrix_histo"];
	for (var i =0; i < histos.length; i ++){
		document.getElementById(histos[i]).style.display = "none";
	}
	var div = document.getElementById(histogram);
	if (div !== undefined && div !== null) {
		div.style.display = '';
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
	        	NgChmGui.TRANS.updateLog(document.getElementById("missing_frm"));
	        	NgChmGui.TRANS.getWorkingMatrix();
		    }
	        NgChmGui.UTIL.hideLoading();
		}
	};
	req.send(formData);
	NgChmGui.UTIL.showLoading();
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
	        	NgChmGui.TRANS.updateLog(document.getElementById("filter_frm") );
	        	NgChmGui.TRANS.getWorkingMatrix();
		    }
	        NgChmGui.UTIL.hideLoading();
		}
	};
	req.send(formData);
	NgChmGui.UTIL.showLoading();
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
	        	NgChmGui.TRANS.updateLog(document.getElementById("trans_frm"));
	        	NgChmGui.TRANS.getWorkingMatrix();
		    }
	        NgChmGui.UTIL.hideLoading();
		}
	};
	req.send(formData);
	NgChmGui.UTIL.showLoading();
}

NgChmGui.TRANS.resetMatrix =  function() {
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( );
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
	        	NgChmGui.TRANS.updateLog();
	        	NgChmGui.TRANS.getWorkingMatrix();
		    }
	        NgChmGui.UTIL.hideLoading();
		}
	};
	req.send(formData);
	NgChmGui.UTIL.showLoading();
}

NgChmGui.TRANS.updateLog =  function(form){//formData) {
	var log = document.getElementById("change_log");
	var updateText = "";
	if (form){
		var urlString = "";
		var elements = form.querySelectorAll( "input, select, textarea");
		for( var i = 0; i < elements.length; ++i) {
			var element = elements[i];
			if ((element.attributes.logText) && (element.offsetParent) && (element.type == 'radio') && (element.checked == true)){
				var text = element.attributes.logText.value;
				var bracketIndex = 0, breaker = 0;
				while (text.indexOf("[",bracketIndex)>-1 && breaker < 10){
					var parseValStart = text.indexOf("[");
					var parseValEnd = text.indexOf("]");
					bracketIndex = parseValStart;
					var name = text.substring(parseValStart+1,parseValEnd);
					var nameEls = document.getElementsByName(name);
					var parseVal = "";
					for (var j = 0; j < nameEls.length; j++){
						if (nameEls[j].type == "radio"){
							if (nameEls[j].checked){
								parseVal = nameEls[j].value;
							}
//							parseVal = nameEls[j].value;
						} else {
							parseVal = nameEls[j].value;
						}
					}
					text = text.replace("[" + name + "]", parseVal);
					breaker++;
				}
				updateText += text;
			}
		}
	} else {
		updateText += "Reset the Matrix";
	}
	log.innerHTML += updateText + "<br>";
	
}

//Function called when Next button is pressed.  
NgChmGui.TRANS.done =  function() {
	//We need to build the heatmap for the next page.
	NgChmGui.UTIL.buildHeatMap(NgChmGui.TRANS.update)
}

//After heatmpap builds, fetch the properties to get
//updated properties like color map.
NgChmGui.TRANS.update = function () {
	NgChmGui.UTIL.getHeatmapProperties(NgChmGui.TRANS.next);
}

//When update completes, go to next page.
NgChmGui.TRANS.next = function() {
	window.open("/NGCHM_GUI_Builder/NGCHMBuilder_Covariates.html","_self");
}
