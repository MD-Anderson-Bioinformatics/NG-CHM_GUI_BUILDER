
//Define Namespace for NgChmGui MatrixFile
NgChmGui.createNS('NgChmGui.TRANS');

NgChmGui.TRANS.matrixInfo = null; /* Will get loaded with statistics about the matrix */

/**********************************************************************************
 * FUNCTION - loadData: This function will be executed when the transform page
 * is opened for the first time.  
 **********************************************************************************/
NgChmGui.TRANS.loadData =  function() {
	NgChmGui.UTIL.showLoading();
	if (NgChmGui.UTIL.loadHeaderData()) {
		NgChmGui.TRANS.getWorkingMatrix();
	}
	NgChmGui.TRANS.populateLog();
}

/**********************************************************************************
 * FUNCTION - validateEntries: This function validates user entries on the transform
 * screen.
 **********************************************************************************/
NgChmGui.TRANS.validateEntries = function(leavingPage, formatError) {
	var valid = true;
	var pageText = "";
	
	//Generate error messages
	if (leavingPage) {
		if (NgChmGui.TRANS.matrixInfo.numInvalid > 0) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "INVALID VALUES MUST BE CORRECTED.</p>" + NgChmGui.UTIL.nextLine;
			valid = false;
		}	
		if (NgChmGui.TRANS.matrixInfo.numRows < 1) {
			pageText = pageText + "<p class='error_message'>"+ NgChmGui.UTIL.errorPrefix + "MATRIX HAS NO ROWS.</p>" + NgChmGui.UTIL.nextLine;
			valid = false;
		}
		if(NgChmGui.TRANS.matrixInfo.numCols < 1) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "MATRIX HAS NO COLUMNS.</p>" + NgChmGui.UTIL.nextLine;
			valid = false;
		}	
		
		
		if (NgChmGui.TRANS.matrixInfo.numRows > 4000) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "MATRIX HAS TOO MANY ROWS (>4000) FOR BUILDER. USE FILTER TO REMOVE ROWS.</p>" + NgChmGui.UTIL.nextLine;
			valid = false;
		}	
		if (NgChmGui.TRANS.matrixInfo.numCols > 4000) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "MATRIX HAS TOO MANY COLUMNS (>4000) FOR BUILDER. USE FILTER TO REMOVE COLUMNS.</p>" + NgChmGui.UTIL.nextLine;
			valid = false;
		}	
	} else if (formatError){
		pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Please enter a valid value for transform.</p>" + NgChmGui.UTIL.nextLine;
		valid = false;
	} else {
		//Generate warning messages

		if (NgChmGui.TRANS.matrixInfo.numRows > 1000) {
			pageText = pageText + NgChmGui.UTIL.warningPrefix + "Your matrix has a large number of rows consider using the Filter Data transform to remove non-informative rows" + NgChmGui.UTIL.nextLine;
		}	

		if (NgChmGui.TRANS.matrixInfo.numCols > 1000) {
			pageText = pageText + NgChmGui.UTIL.warningPrefix + "Your matrix has a large number of columns consider using the Filter Data transform to remove non-informative rows" + NgChmGui.UTIL.nextLine;
		}	
	}
	
	//if (NgChmGui.TRANS.matrixInfo.minValue < 0) {
	//	pageText = pageText + NgChmGui.UTIL.warningPrefix + "Your matrix has negative values.  A log transform would result in invalid values - use a different transform to remove negative values prior to log transforms." + NgChmGui.UTIL.nextLine;
	//}	
	
		
	
	//Add in page instruction text
	pageText = pageText + "This page provides summary statistics of your matrix data including the distribution of values and row/column standard deviations.  Filters and transforms can be used to manipulate the matrix to produce better heat maps.  For example, a Z-norm transform could be used to normalize rows with values that differ in magnitude and a standard deviation filter could be used to remove rows with values that do not differ much across the columns." ;
	NgChmGui.UTIL.setScreenNotes(pageText);
	
	return valid;
}

/**********************************************************************************
 * FUNCTION - hideAllTransDivs: This function toggles all the panels on the tranforms
 * page to invisible.
 **********************************************************************************/
NgChmGui.TRANS.hideAllTransDivs =  function() {
	document.getElementById('missingDiv').style.display = 'none';
	document.getElementById('filterDiv').style.display = 'none';
	document.getElementById('transDiv').style.display = 'none';
}

/**********************************************************************************
 * FUNCTION - showTransSelection: This function toggles the panels on the Transform
 * page to the value selected in the Tranforms dropdown.
 **********************************************************************************/
NgChmGui.TRANS.showTransSelection =  function() {
	var transList = document.getElementById("transPref_list");
	NgChmGui.TRANS.hideAllTransDivs();
	var key = transList.options[transList.selectedIndex].value;
	document.getElementById(key).style.display="block";
}

/**********************************************************************************
 * FUNCTION - getWorkingMatrix: This function calls the GetWorkingMatrix servlet
 * to load the top corner of the data matrix in the view panel.
 **********************************************************************************/
NgChmGui.TRANS.getWorkingMatrix =  function() {
	var req = new XMLHttpRequest();
	req.open("GET", "GetWorkingMatrix", true);
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	NgChmGui.UTIL.hideLoading();
	            console.log('Failed to get working matrix '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
				NgChmGui.TRANS.matrixInfo = JSON.parse(req.response);
	        	document.getElementById('numRows').innerHTML = NgChmGui.TRANS.matrixInfo.numRows;
	        	document.getElementById('numCols').innerHTML = NgChmGui.TRANS.matrixInfo.numCols;
	        	document.getElementById('numInvalid').innerHTML = NgChmGui.TRANS.matrixInfo.numInvalid;
	        	document.getElementById('numMissing').innerHTML = NgChmGui.TRANS.matrixInfo.numMissing;
	        	document.getElementById('maxVal').innerHTML = NgChmGui.TRANS.matrixInfo.maxValue;
	        	document.getElementById('minVal').innerHTML = NgChmGui.TRANS.matrixInfo.minValue;
	        	topMatrixString = NgChmGui.TRANS.matrixInfo.matrixsample;
	        	var matrixBox = document.getElementById('trans_data');
	        	var matrixDisplayBox = document.getElementById('transMatrixDisplay');
	        	matrixBox.style.display = '';
	        	matrixDisplayBox.style.display = '';
	        	dataTable = Object.keys(topMatrixString).map(function(k) { return topMatrixString[k] });
	        	loadDataFromFile();
	        	
	        	var ctx = document.getElementById("histo_canvas").getContext("2d");
    
	        	var graph = new BarGraph(ctx);
	        	graph.margin = 2;
	        	graph.width = 450;
	        	graph.height = 150;
	        	var histoBins = NgChmGui.TRANS.matrixInfo.histoBins;
	        	histoBins.unshift("Missing");
	        	var colors = new Array(histoBins.length);
	        	colors[0] = 'black';
	        	colors.fill('blue',1,colors.length);
	        	graph.colors = colors;
	        	graph.xAxisLabelArr = histoBins;//["Missing Values", NgChmGui.TRANS.matrixInfo.histoBins];
	        	var histoCounts = NgChmGui.TRANS.matrixInfo.histoCounts; 
	        	histoCounts.unshift(NgChmGui.TRANS.matrixInfo.numMissing);
	        	graph.update(histoCounts);//[NgChmGui.TRANS.matrixInfo.numMissing,NgChmGui.TRANS.matrixInfo.histoCounts]);
	        	
	        	var rowSDCtx = document.getElementById("row_sd_histo_canvas").getContext("2d");
	            
	        	var rowSDGraph = new BarGraph(rowSDCtx);
	        	rowSDGraph.margin = 2;
	        	rowSDGraph.width = 450;
	        	rowSDGraph.height = 150;
	        	rowSDGraph.colors = ['blue'];
	        	var histoBins = NgChmGui.TRANS.matrixInfo.rowStdHistoBins;
//	        	histoBins.unshift("Missing");
	        	rowSDGraph.xAxisLabelArr = histoBins;//["Missing Values", NgChmGui.TRANS.matrixInfo.histoBins];
	        	var histoCounts = NgChmGui.TRANS.matrixInfo.rowStdHistoCounts; 
//	        	histoCounts.unshift(NgChmGui.TRANS.matrixInfo.numMissing);
	        	rowSDGraph.update(histoCounts);//[NgChmGui.TRANS.matrixInfo.numMissing,NgChmGui.TRANS.matrixInfo.histoCounts]);
	        	
	        	var colSDCtx = document.getElementById("col_sd_histo_canvas").getContext("2d");
	            
	        	var colSDGraph = new BarGraph(colSDCtx);
	        	colSDGraph.margin = 2;
	        	colSDGraph.width = 450;
	        	colSDGraph.height = 150;
	        	colSDGraph.colors = ['blue'];
	        	var histoBins = NgChmGui.TRANS.matrixInfo.colStdHistoBins;
//	        	histoBins.unshift("Missing");
	        	colSDGraph.xAxisLabelArr = histoBins;//["Missing Values", NgChmGui.TRANS.matrixInfo.histoBins];
	        	var histoCounts = NgChmGui.TRANS.matrixInfo.colStdHistoCounts; 
//	        	histoCounts.unshift(NgChmGui.TRANS.matrixInfo.numMissing);
	        	colSDGraph.update(histoCounts);//[NgChmGui.TRANS.matrixInfo.numMissing,NgChmGui.TRANS.matrixInfo.histoCounts]);
	        	NgChmGui.TRANS.validateEntries(false);
	        	NgChmGui.UTIL.hideLoading();
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

	    	var container = document.getElementById('transMatrixDisplay');
	    	//clear out matrix from previous runs
	    	while (container.hasChildNodes()) {
	    		container.removeChild(container.lastChild);
	    	}

		    var hot = new Handsontable(container, {
				data: getData(),
				stretchH: 'all',
			    cells: function(row, col, prop) {
			        var cellProperties = {};
			        cellProperties.editor = false; 
			        return cellProperties;
			      }
		    });
		    //This statement fills the table view with colors (blue for labels/green for data)
    	    for(var i = 0; i < hot.countRows(); i++){
    		    for(var j = 0; j < hot.countCols(); j++){
    		    	if (i === 0) {
    		    		hot.setCellMeta(i, j, 'className', 'label');
    		    	} else {
    		    		if (j === 0) {
    		    			hot.setCellMeta(i, j, 'className', 'label');
    		    		} else {
    		    			hot.setCellMeta(i, j, 'className', 'data');
    		    		}
    		    	}
    			}
    	    }
	        hot.render();
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
	document.getElementById('ReplaceInvalid').style.display = 'none';
	document.getElementById('FillMissing').style.display = 'none';
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
	document.getElementById('Variation').style.display = 'none';
	document.getElementById('Range').style.display = 'none';
	document.getElementById('MissingData').style.display = 'none';
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
	document.getElementById('Log').style.display = 'none';
	document.getElementById('MeanCenter').style.display = 'none';
	document.getElementById('Z-Norm').style.display = 'none';
	document.getElementById('Arithmetic').style.display = 'none';
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
	if (formData){
		req.open("POST", "CorrectMatrix", true);
		req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		req.onreadystatechange = function () {
			if (NgChmGui.UTIL.debug) {console.log('state change');}
			if (req.readyState == req.DONE) {
				if (NgChmGui.UTIL.debug) {console.log('done');}
		        if (req.status != 200) {
		        	NgChmGui.UTIL.hideLoading();
		            console.log('Failed to correct matrix '  + req.status);
		        } else {
					if (NgChmGui.UTIL.debug) {console.log('200');}
		        	NgChmGui.mapProperties = JSON.parse(req.response);
		        	if (NgChmGui.UTIL.validSession()) {
			        	NgChmGui.TRANS.updateLog(document.getElementById("missing_frm"));
			        	NgChmGui.TRANS.processTransforms();
			        	NgChmGui.TRANS.getWorkingMatrix();
		        	}
			    }
			}
		};
		req.send(formData);
		NgChmGui.UTIL.showLoading();
	} else {
		NgChmGui.TRANS.validateEntries(false, true);
	}
}

NgChmGui.TRANS.filterMatrixData =  function() {
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("filter_frm") );
	if (formData){
		req.open("POST", "FilterMatrix", true);
		req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		req.onreadystatechange = function () {
			if (NgChmGui.UTIL.debug) {console.log('state change');}
			if (req.readyState == req.DONE) {
				if (NgChmGui.UTIL.debug) {console.log('done');}
		        if (req.status != 200) {
		        	NgChmGui.UTIL.hideLoading();
		            console.log('Failed to filter matrix '  + req.status);
		        } else {
					if (NgChmGui.UTIL.debug) {console.log('200');}
		        	NgChmGui.mapProperties = JSON.parse(req.response);
		        	if (NgChmGui.UTIL.validSession()) {
			        	NgChmGui.TRANS.updateLog(document.getElementById("filter_frm") );
			        	NgChmGui.TRANS.processTransforms();
			        	NgChmGui.TRANS.getWorkingMatrix();
		        	}
			    }
			}
		};
		req.send(formData);
		NgChmGui.UTIL.showLoading();
	} else {
		NgChmGui.TRANS.validateEntries(false, true);
	}
}

NgChmGui.TRANS.transformMatrixData =  function() {
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("trans_frm") );
	if (formData){
		req.open("POST", "TransformMatrix", true);
		req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		req.onreadystatechange = function () {
			if (NgChmGui.UTIL.debug) {console.log('state change');}
			if (req.readyState == req.DONE) {
				if (NgChmGui.UTIL.debug) {console.log('done');}
		        if (req.status != 200) {
		        	NgChmGui.UTIL.hideLoading();
		            console.log('Failed to filter matrix '  + req.status);
		        } else {
					if (NgChmGui.UTIL.debug) {console.log('200');}
		        	NgChmGui.mapProperties = JSON.parse(req.response);
		        	if (NgChmGui.UTIL.validSession()) {
			        	NgChmGui.TRANS.updateLog(document.getElementById("trans_frm"));
			        	NgChmGui.TRANS.processTransforms();
			        	NgChmGui.TRANS.getWorkingMatrix();
		        	}
			    }
			}
		};
		req.send(formData);
		NgChmGui.UTIL.showLoading();
	} else {
		NgChmGui.TRANS.validateEntries(false, true);
	}
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
	        	NgChmGui.UTIL.hideLoading();
	            console.log('Failed to filter matrix '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	NgChmGui.mapProperties = JSON.parse(req.response);
	        	if (NgChmGui.UTIL.validSession()) {
		        	NgChmGui.TRANS.updateLog();
		        	NgChmGui.TRANS.processTransforms();
		        	NgChmGui.TRANS.getWorkingMatrix();
	        	}
		    }
		}
	};
	req.send(formData);
	NgChmGui.UTIL.showLoading();
}

NgChmGui.TRANS.populateLog = function(){
	var transformConfig = NgChmGui.mapProperties.builder_config.transform_config;
	var log = document.getElementById("change_select");
	if (transformConfig && transformConfig.logText.length > 0){
		for (var i = 0; i < transformConfig.logText.length; i++){
			var updateDiv = document.createElement("option");
			updateDiv.classList.add("change_option");
			var logText = transformConfig.logText[i];
			var formid = transformConfig.formId[i];
			var uri = transformConfig.Uri[i];
			updateDiv.innerHTML = logText + "<br>";
			updateDiv.attributes.logText = logText;
			updateDiv.attributes.formID = formid;
			updateDiv.attributes.URI = uri;
			updateDiv.value = i;
			log.appendChild(updateDiv);
		}
	}
}

NgChmGui.TRANS.updateLog =  function(form){//formData) {
	var options = document.getElementById("change_select");
	if (form){ // This logic is called when an actual transform is taking place
		var updateDiv = document.createElement("option");
		updateDiv.classList.add("change_option");
		var updateText = "";
		updateDiv.attributes.formID = form.id == "trans_frm" ? "Transform" : form.id == "missing_frm" ? "Correct" : form.id == "filter_frm" ? "Filter" : "";
		updateDiv.attributes.URI = NgChmGui.UTIL.toURIString(form);
		updateDiv.value = document.getElementsByClassName("change_option").length;
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
		updateDiv.attributes.logText = text;
		updateDiv.innerHTML = updateText + "<br>";
		options.appendChild(updateDiv);
	} else { // this logic is triggered when the Reset is called
		var cds = log.getElementsByClassName("change_option");
		while (cds.length > 0 ){
			cds[0].remove();
		}
	}
	
}

NgChmGui.TRANS.revertToState =  function() {
//	console.log(this.attributes);
//	var el = this;
	var els = document.getElementsByClassName("change_option");
	var value = document.getElementById("change_select").value;
	
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( );
	req.open("POST", "ResetMatrix", true);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	NgChmGui.UTIL.hideLoading();
	            console.log('Failed to filter matrix '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	NgChmGui.mapProperties = JSON.parse(req.response);
	        	if (NgChmGui.UTIL.validSession()) {
	        		nextFunc(0,value);
		        	var delIndex = parseInt(value)+1;
		        	while (els[delIndex]){
		        		els[delIndex].remove();
		        	}
		        	NgChmGui.TRANS.processTransforms();
		        	NgChmGui.TRANS.getWorkingMatrix();
	        	}
		    }
		}
	};
	req.send(formData);
	NgChmGui.UTIL.showLoading();
//	
	function nextFunc(index, stop) {
		if (index <= stop){
			var changeOptions = document.getElementsByClassName("change_option");
			var req = new XMLHttpRequest();
			var formType = changeOptions[index].attributes.formID;
			var formData = changeOptions[index].attributes.URI;
			console.log("formType: " + formType + " formData: " + formData);
			req.open("POST", formType+"Matrix", true);
			req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			req.onreadystatechange = function () {
				if (NgChmGui.UTIL.debug) {console.log('state change');}
				if (req.readyState == req.DONE) {
					if (NgChmGui.UTIL.debug) {console.log('done');}
			        if (req.status != 200) {
			        	NgChmGui.UTIL.hideLoading();
			            console.log('Failed to filter matrix '  + req.status);
			        } else {
						if (NgChmGui.UTIL.debug) {console.log('200');}
			        	result = req.response;
			        	console.log("finished nextFunc and index = " + index)
			        	index++;
			        	nextFunc(index,stop);
//			        	NgChmGui.TRANS.updateLog(document.getElementById("trans_frm"));
			        	NgChmGui.TRANS.getWorkingMatrix();
				    }
				}
			};
			req.send(formData);
			NgChmGui.UTIL.showLoading();
		}
	}
}

//Function called when Next button is pressed.  
NgChmGui.TRANS.done =  function() {
	//Validation Checks
	if (!NgChmGui.TRANS.validateEntries(true))
		return;
	
	var callbackFunc = function(){
		NgChmGui.UTIL.showLoading();
		NgChmGui.UTIL.buildHeatMap(NgChmGui.TRANS.update); 
	}
	NgChmGui.TRANS.processTransforms(callbackFunc);

}

NgChmGui.TRANS.processTransforms = function(callback){
	var cds = document.getElementsByClassName("change_option");
	var formIDs = [];
	var URIs = [];
	var logTexts = [];
	for (var i = 0; i < cds.length; i++){
		var cd = cds[i];
		formIDs.push(cd.attributes.formID);
		URIs.push(cd.attributes.URI);
		logTexts.push(cd.attributes.logText);
	}
	var json = JSON.stringify({logText: logTexts, formId: formIDs, Uri: URIs});
	
	var req = new XMLHttpRequest();
	req.open("POST", "ProcessTransforms", true);
	req.setRequestHeader("Content-Type", "application/json");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	NgChmGui.UTIL.hideLoading();
	            console.log('Failed to process matrix '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
				if (callback){
					callback();
				}
		    }
		}
	};
	req.send(json);
}

//After heatmpap builds, fetch the properties to get
//updated properties like color map.
NgChmGui.TRANS.update = function () {
	NgChmGui.UTIL.getHeatmapProperties(NgChmGui.TRANS.next);
}

//When update completes, go to next page.
NgChmGui.TRANS.next = function() {
	window.open("Edit_Covariates.html","_self");
}

