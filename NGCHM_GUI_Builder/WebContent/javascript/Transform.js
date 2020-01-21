
//Define Namespace for NgChmGui MatrixFile
NgChmGui.createNS('NgChmGui.TRANS');

NgChmGui.TRANS.matrixInfo = null; /* Will get loaded with statistics about the matrix */
NgChmGui.TRANS.changeApplied = false;  

/**********************************************************************************
 * FUNCTION - loadData: This function will be executed when the transform page
 * is opened for the first time.  
 **********************************************************************************/
NgChmGui.TRANS.loadData =  function() {
	NgChmGui.UTIL.clearBuildErrors();
	NgChmGui.UTIL.showLoading();
	if (NgChmGui.UTIL.loadHeaderData()) {
		NgChmGui.TRANS.getWorkingMatrix();
	}
	NgChmGui.TRANS.populateLog();
	if (NgChmGui.UTIL.setUpAdvanced() === true) {
		NgChmGui.TRANS.setAdvanced();
	}
}

/**********************************************************************************
 * FUNCTION - setAdvanced: This function applies special advanced/standard function
 * display rules that apply to the Transform screen.
 **********************************************************************************/
NgChmGui.TRANS.setAdvanced = function() {
	var taskList = document.getElementById('transPref_list');
	if (NgChmGui.UTIL.showAdvanced === 'N') {
		if (taskList.selectedIndex === 3) {
			taskList.selectedIndex = 0;
			NgChmGui.TRANS.showTransSelection();
		}
		for (var i=0; i<taskList.length; i++){
			  if (taskList.options[i].value === 'corrDiv' ) {
				  taskList.remove(i);
			  }
		}
	} else {
		var corrFound = false;
		for (var i=0; i<taskList.length; i++){
			  if (taskList.options[i].value === 'corrDiv' ) {
				  corrFound = true;
			  }
		}
		if (corrFound === false) {
		    var opt = document.createElement('option');
		    opt.value = 'corrDiv';
		    opt.innerHTML = 'Matrix Operations';
		    taskList.appendChild(opt);
		}
	}
}



/**********************************************************************************
 * FUNCTION - validateEntries: This function validates user entries on the transform
 * screen.
 **********************************************************************************/
NgChmGui.TRANS.validateEntries = function(leavingPage, formatError, otherError, otherWarning) {
	var valid = true;
	var pageText = "";
	
	var numRows = NgChmGui.TRANS.matrixInfo.numRows;
	var numCols = NgChmGui.TRANS.matrixInfo.numCols;
	
	//Generate build error messages
	if (typeof NgChmGui.mapProperties.builder_config !== 'undefined') {
		var builderConfig = NgChmGui.mapProperties.builder_config
		var buildErrors = builderConfig.buildErrors;
		if (buildErrors !== "") {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + buildErrors + "</font></b></p>";
			valid = false;
		}
		if ((numRows + numCols) > parseInt(builderConfig.rowsColsMaximum)) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Matrix with " + numRows + " rows and " + numCols + " columns exceeds the maximum matrix size for this builder (" + builderConfig.rowsColsMaximum + ").  Use the Filter action to remove rows or columns so that their sum does not exceed this number.</p>";
			valid = false;
		} 
	}
	if (otherError && otherError !== "") {
		pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + otherError + "</font></b></p>";
		valid = false;
	}
	//Generate error messages
	if (leavingPage) {
		if (NgChmGui.TRANS.matrixInfo.numInvalid > 0) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Matrix contains invalid values. Use the Missing/Invalid action to replace or fill these invalid values.</p>";
			valid = false;
		}	
		if (NgChmGui.TRANS.matrixInfo.numDupeRowLabels > 0) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Matrix contains duplicate row labels. Use the Duplicate action to remove, rename, or combine these duplicates.</p>";
			valid = false;
		}	
		if (NgChmGui.TRANS.matrixInfo.numDupeColLabels > 0) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Matrix contains duplicate column labels. Use the Duplicate action to remove, rename, or combine these duplicates.</p>";
			valid = false;
		}	
		if (NgChmGui.TRANS.matrixInfo.numRows < 1) {
			pageText = pageText + "<p class='error_message'>"+ NgChmGui.UTIL.errorPrefix + "Matrix has no Rows.</p>";
			valid = false;
		}
		if(NgChmGui.TRANS.matrixInfo.numCols < 1) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Matrix has no Columns.</p>";
			valid = false;
		}	
		if(NgChmGui.TRANS.matrixInfo.emptyRows > 0) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Matrix contains " + NgChmGui.TRANS.matrixInfo.emptyRows + " entirely empty data Row(s). All values missing. Use the Filter action to remove rows or replace missing values.</p>";
			valid = false;
		}	
		if(NgChmGui.TRANS.matrixInfo.emptyCols > 0) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Matrix contains " + NgChmGui.TRANS.matrixInfo.emptyCols + " entirely empty data Column(s). All values missing. Use the Filter action to remove Columns or replace missing values.</p>";
			valid = false;
		}	
	} else if (formatError){
		pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Please enter a valid value for transform.</p>";
		valid = false;
	} else {
		//Generate warning messages
		if (valid) {
			var totalVals = NgChmGui.UTIL.getTotalClusterValues();
			if (totalVals >= 3000) {
				pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.warningPrefix + "This large matrix (" + NgChmGui.mapProperties.matrixRows + "x" + NgChmGui.mapProperties.matrixCols + ") may take a several minutes to cluster. You may wish to use the Filter action to reduce matrix size.</p>";
			} else if (totalVals >= 1500) {
				pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.warningPrefix + "This matrix (" + NgChmGui.mapProperties.matrixRows + "x" + NgChmGui.mapProperties.matrixCols + ") may take a minute or two to cluster. You may wish to use the Filter action to reduce matrix size.</p>";
			}
		}
	}
	if (otherWarning && otherWarning !== "") {
		pageText = pageText + NgChmGui.UTIL.warningPrefix + otherWarning + NgChmGui.UTIL.nextLine;
	}
	
	//Add in page instruction text
	pageText = pageText + "This page provides summary statistics of your matrix data including the distribution of values and row/column standard deviations.  Filters and transforms can be used to manipulate the matrix to produce better heat maps.  For example, a Z-norm transform could be used to normalize rows with values that differ in magnitude and a standard deviation filter could be used to remove rows with values that do not differ much across the columns." ;
	NgChmGui.UTIL.setScreenNotes(pageText, true);
	
	if (valid === false) {
		NgChmGui.UTIL.hideLoading();
	}
	
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
	document.getElementById('corrDiv').style.display = 'none';
	document.getElementById('dupeDiv').style.display = 'none';
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
    	numInvalidDisplay = document.getElementById('numInvalid');
    	numDupeRows = document.getElementById('numDupeRows');
    	numDupeCols = document.getElementById('numDupeCols');
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	NgChmGui.UTIL.hideLoading();
	            console.log('Failed to get working matrix '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
				NgChmGui.TRANS.matrixInfo = JSON.parse(req.response);
				var props = NgChmGui.mapProperties;
				props.matrixRows = NgChmGui.TRANS.matrixInfo.numRows;
				props.matrixCols = NgChmGui.TRANS.matrixInfo.numCols;
	        	document.getElementById('numRows').innerHTML = NgChmGui.TRANS.matrixInfo.numRows;
	        	document.getElementById('numCols').innerHTML = NgChmGui.TRANS.matrixInfo.numCols;
	        	if (NgChmGui.TRANS.matrixInfo.numInvalid > 0) {
		        	numInvalidDisplay.style.fontWeight = 'bold';
		        	numInvalidDisplay.style.color = '#FF0000';
	        	} else {
	            	numInvalidDisplay.style.fontWeight = 'normal';
	            	numInvalidDisplay.style.color = '#000000';
	        	}
	        	numInvalidDisplay.innerHTML = NgChmGui.TRANS.matrixInfo.numInvalid;
	        	document.getElementById('numMissing').innerHTML = NgChmGui.TRANS.matrixInfo.numMissing;
	        	if (NgChmGui.TRANS.matrixInfo.numDupeRowLabels > 0) {
	        		numDupeRows.style.fontWeight = 'bold';
	        		numDupeRows.style.color = '#FF0000';
	        	} else {
	        		numDupeRows.style.fontWeight = 'normal';
	        		numDupeRows.style.color = '#000000';
	        	}
	        	numDupeRows.innerHTML = NgChmGui.TRANS.matrixInfo.numDupeRowLabels;
	        	if (NgChmGui.TRANS.matrixInfo.numDupeColLabels > 0) {
	        		numDupeCols.style.fontWeight = 'bold';
		        	numDupeCols.style.color = '#FF0000';
	        	} else {
	        		numDupeCols.style.fontWeight = 'normal';
	            	numDupeCols.style.color = '#000000';
	        	}
	        	numDupeCols.innerHTML = NgChmGui.TRANS.matrixInfo.numDupeColLabels;
        	
	        	
	        	
	        	
	        	document.getElementById('maxVal').innerHTML = Number.parseFloat(NgChmGui.TRANS.matrixInfo.maxValue).toFixed(3);
	        	document.getElementById('minVal').innerHTML = Number.parseFloat(NgChmGui.TRANS.matrixInfo.minValue).toFixed(3);
	        	document.getElementById('minNonZeroVal').innerHTML = Number.parseFloat(NgChmGui.TRANS.matrixInfo.minNonZeroValue);
	        	topMatrixString = NgChmGui.TRANS.matrixInfo.matrixsample;
	        	var matrixBox = document.getElementById('trans_data');
	        	var matrixDisplayBox = document.getElementById('transMatrixDisplay');
	        	matrixBox.style.display = '';
	        	matrixDisplayBox.style.display = '';
	        	dataTable = Object.keys(topMatrixString).map(function(k) { return topMatrixString[k] });
	        	loadDataFromFile();
	        	
	        	//set up histogram graphs	        	
	        	setHistoGraph(document.getElementById("histo_canvas"), NgChmGui.TRANS.matrixInfo.histoBins, NgChmGui.TRANS.matrixInfo.histoCounts, true);
	        	setHistoGraph(document.getElementById("row_sd_histo_canvas"), NgChmGui.TRANS.matrixInfo.rowStdHistoBins, NgChmGui.TRANS.matrixInfo.rowStdHistoCounts, false);
	        	setHistoGraph(document.getElementById("col_sd_histo_canvas"), NgChmGui.TRANS.matrixInfo.colStdHistoBins, NgChmGui.TRANS.matrixInfo.colStdHistoCounts, false);
	        	
	        	NgChmGui.TRANS.validateEntries(false);
	        	NgChmGui.UTIL.hideLoading();
		    }
		}
	};
	NgChmGui.UTIL.showLoading();
	req.send();
	
	function setHistoGraph(canvas, bins, counts, isMatrixData) {
    	var ctx = canvas.getContext("2d");
		var colors = ['blue']; 
    	var graph = new BarGraph(ctx);
    	if (isMatrixData === true) {
    		bins.unshift("Missing");
        	var colors = new Array(bins.length);
        	colors[0] = 'black';
        	colors.fill('blue',1,colors.length);
        	counts.unshift(NgChmGui.TRANS.matrixInfo.numMissing);
        	graph.width = 650;
    	} else {
        	graph.width = 450;
    	}
    	graph.margin = 2;
    	graph.height = 150;
    	graph.colors = colors;
    	graph.xAxisLabelArr = bins; 
    	graph.update(counts); 
	}

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

NgChmGui.TRANS.selectDuplicates =  function() {
	document.getElementById('Remove').style.display = 'none';
	document.getElementById('Rename').style.display = 'none';
	document.getElementById('Combine').style.display = 'none';
	var sel = document.getElementById('Duplicate');
	var filter = sel.options[sel.selectedIndex].value;
	var div = document.getElementById(filter);
	if (div !== undefined && div !== null) {
		div.style.display = '';
		document.getElementById('duplicates_btn').style.display = '';
	}	else {
		document.getElementById('duplicates_btn').style.display = 'none';
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
	document.getElementById('Threshold').style.display = 'none';
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

NgChmGui.TRANS.selectCorrelation =  function() {
	document.getElementById('Transpose').style.display = 'none';
	document.getElementById('Correlation').style.display = 'none';
	var sel = document.getElementById('Correlations');
	var filter = sel.options[sel.selectedIndex].value;
		
	var div = document.getElementById(filter);
	
	if (div !== undefined && div !== null) {
		div.style.display = '';
		document.getElementById('correlation_btn').style.display = '';
	}	else {
		document.getElementById('correlation_btn').style.display = 'none';
	}
}

NgChmGui.TRANS.setRadio = function(buttonId, idx) {
	var radio = document.getElementsByName(buttonId);
	for (i = 0; i < radio.length; i++) {
		if (i === idx) {
			radio[i].checked = true;
		}
	}
}

NgChmGui.TRANS.enableButton = function(buttonId) {
	document.getElementById(buttonId).style.opacity = 1.0;
	document.getElementById(buttonId).disabled = false;
}

NgChmGui.TRANS.correlationSelectionChange = function(el){
	if (el.checked && (el.value == "row_matrix" || el.value == "col_matrix")){
		NgChmGui.TRANS.showDivById("correlation_matrix");
	} else {
		NgChmGui.TRANS.hideDivById("correlation_matrix");
	}
}

NgChmGui.TRANS.showDivById = function(id) {
	document.getElementById(id).style.display = "inherit";
}

NgChmGui.TRANS.hideDivById = function(id) {
	document.getElementById(id).style.display = "none";
}

NgChmGui.TRANS.correctMatrixData =  function() {
	NgChmGui.TRANS.changeApplied = true;
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("missing_frm") );
	if (NgChmGui.TRANS.matrixInfo.numInvalid == 0 || NgChmGui.TRANS.matrixInfo.num == 0){
		if (document.getElementById('Correction').value == "ReplaceInvalid" && NgChmGui.TRANS.matrixInfo.numInvalid == 0){
			NgChmGui.TRANS.validateEntries(false,false,false, "No invalid values to correct. Correction not applied");
			return
		} else if ( document.getElementById('Correction').value == "FillMissing" && NgChmGui.TRANS.matrixInfo.numMissing == 0){
			NgChmGui.TRANS.validateEntries(false,false,false, "No missing values to fill. Correction not applied");
			return
		}
		
	}
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
		        	if (typeof response.error !== 'undefined') {
		        		NgChmGui.TRANS.validateEntries(false,false,response.error,false);
		        	} else {
			        	NgChmGui.mapProperties = JSON.parse(req.response);
			        	if (NgChmGui.UTIL.validSession()) {
				        	NgChmGui.TRANS.updateLog(document.getElementById("missing_frm"));
				        	NgChmGui.TRANS.processTransforms(NgChmGui.TRANS.getWorkingMatrix);
			        	}
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
	NgChmGui.TRANS.changeApplied = true;
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
					var response = JSON.parse(req.response);
		        	if (typeof response.error !== 'undefined') {
		        		NgChmGui.TRANS.validateEntries(false,false,response.error,false);
		        	} else {
			        	NgChmGui.mapProperties = JSON.parse(req.response);
			        	if (NgChmGui.UTIL.validSession()) {
				        	NgChmGui.TRANS.updateLog(document.getElementById("filter_frm") );
				        	NgChmGui.TRANS.processTransforms(NgChmGui.TRANS.getWorkingMatrix);
				        	NgChmGui.TRANS.initSelects();
			        	}
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

NgChmGui.TRANS.duplicateMatrixData =  function() {
	NgChmGui.TRANS.changeApplied = true;
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("duplicate_frm") );
	if (formData){
		req.open("POST", "DuplicateMatrix", true);
		req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		req.onreadystatechange = function () {
			if (NgChmGui.UTIL.debug) {console.log('state change');}
			if (req.readyState == req.DONE) {
				if (NgChmGui.UTIL.debug) {console.log('done');}
		        if (req.status != 200) {
		        	NgChmGui.UTIL.hideLoading();
		            console.log('Failed to process matrix duplicates. '  + req.status);
		        } else {
					if (NgChmGui.UTIL.debug) {console.log('200');}
		        	NgChmGui.mapProperties = JSON.parse(req.response);
		        	if (NgChmGui.UTIL.validSession()) {
			        	NgChmGui.TRANS.updateLog(document.getElementById("duplicate_frm") );
			        	NgChmGui.TRANS.processTransforms(NgChmGui.TRANS.getWorkingMatrix);
			        	NgChmGui.TRANS.initSelects();
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
	NgChmGui.TRANS.changeApplied = true;
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
 		        	NgChmGui.TRANS.getWorkingMatrix();
		        	if (NgChmGui.mapProperties.builder_config.buildErrors == "" && NgChmGui.UTIL.validSession()){
		        		NgChmGui.TRANS.updateLog(document.getElementById("trans_frm"));
			        	NgChmGui.TRANS.processTransforms();
			        	NgChmGui.TRANS.initSelects();
		        	} else {
		        		NgChmGui.TRANS.validateEntries(false);
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


NgChmGui.TRANS.correlateMatrixData =  function() {
	NgChmGui.TRANS.changeApplied = true;
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("corr_frm") );
	if (formData){
		req.open("POST", "CorrelateMatrix", true);
		req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		req.onreadystatechange = function () {
			if (NgChmGui.UTIL.debug) {console.log('state change');}
			if (req.readyState == req.DONE) {
				if (NgChmGui.UTIL.debug) {console.log('done');}
		        if (req.status != 200) {
		        	NgChmGui.UTIL.hideLoading();
		            console.log('Failed to correlate matrix '  + req.status);
		        } else {
					if (NgChmGui.UTIL.debug) {console.log('200');}
		        	NgChmGui.mapProperties = JSON.parse(req.response);
 		        	NgChmGui.TRANS.getWorkingMatrix();
		        	if (NgChmGui.mapProperties.builder_config.buildErrors == "" && NgChmGui.UTIL.validSession()){
		        		NgChmGui.TRANS.updateLog(document.getElementById("corr_frm"));
			        	NgChmGui.TRANS.processTransforms();
		        	} else {
		        		NgChmGui.TRANS.validateEntries(false);
		        	}
		        	NgChmGui.UTIL.hideLoading();
			    }
			}
		};
		req.send(formData);
		NgChmGui.UTIL.showLoading();
	} else {
		NgChmGui.TRANS.validateEntries(false, true);
	}
}

NgChmGui.TRANS.sendMatrix = function() {
	var req = new XMLHttpRequest();
	var formData = new FormData( document.getElementById("corr_frm") );
	var filePath = document.getElementById('correlation_matrix').value;
	var selectedFileName = filePath.substring(12,filePath.length);
	req.open("POST", "UploadCorrelationMatrix", true);
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	NgChmGui.UTIL.hideLoading();
	            console.log('Failed to upload matrix '  + req.status);
	        } else {
	    		if (NgChmGui.UTIL.debug) {console.log('200');}
	    		if (req.response.startsWith("ERROR")) {
	    			NgChmGui.FILE.fileUploadError(req.response);
	    		} else if (!req.response.startsWith("NOFILE")) {
	    		}
				NgChmGui.UTIL.hideLoading();
		    }
		}
	};
	NgChmGui.UTIL.showLoading();
	req.send(formData);
}

NgChmGui.TRANS.doReset = function(){
    NgChmGui.mapProperties.builder_config.transform_config = {};
    NgChmGui.TRANS.validateEntries();  
    NgChmGui.TRANS.revertToState();   
}

NgChmGui.TRANS.initSelects = function() {
	document.getElementsByName('arange_min')[0].value = '';
	document.getElementsByName('arange_max')[0].value = '';
	document.getElementsByName('1range_min')[0].value = '';
	document.getElementsByName('1range_max')[0].value = '';
	document.getElementsByName('range_max')[0].value = '';
	document.getElementsByName('std_limit')[0].value = '';
	document.getElementsByName('std_pct')[0].value = '';
	document.getElementsByName('std_num_keep')[0].value = '';
	document.getElementsByName('std_pct_missing')[0].value = '';
	document.getElementsByName('std_num_missing')[0].value = '';
	document.getElementsByName('add_value')[0].value = '';
	document.getElementsByName('subtract_value')[0].value = '';
	document.getElementsByName('multiply_value')[0].value = '';
	document.getElementsByName('divide_value')[0].value = '';
	document.getElementsByName('min_value')[0].value = '';
	document.getElementsByName('max_value')[0].value = '';
	document.getElementsByName('low_value')[0].value = '';
	document.getElementsByName('high_value')[0].value = '';
}

NgChmGui.TRANS.populateLog = function(){
	var transformConfig = NgChmGui.mapProperties.builder_config.transform_config;
	var log = document.getElementById("changeSelect");
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
	var options = document.getElementById("changeSelect");
	if (form){ // This logic is called when an actual transform is taking place
		var updateDiv = document.createElement("option");
		updateDiv.classList.add("change_option");
		var updateText = "";
		updateDiv.attributes.formID = form.id == "trans_frm" ? "Transform" : form.id == "missing_frm" ? "Correct" : form.id == "filter_frm" ? "Filter" : form.id == "duplicate_frm" ? "Duplicate" : "";
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
							if (nameEls[j].files){
								parseVal = nameEls[j].files[0].name;
							} else {
								parseVal = nameEls[j].value;
							}
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
	NgChmGui.TRANS.changeApplied = true;
	var els = document.getElementsByClassName("change_option");
	var value = document.getElementById("changeSelect").value;
	
	var req = new XMLHttpRequest();
	var formData = JSON.stringify(NgChmGui.mapProperties);  
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
	        	}
		    }
		}
	};
	req.send(formData);
	NgChmGui.UTIL.showLoading();
	
	function nextFunc(index, stop) {
        var stopPos = parseInt(stop);
		if (index <= stopPos){
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
			        	if (index > stopPos) {
                            NgChmGui.TRANS.getWorkingMatrix();
                        }
				    }
				}
			};
			req.send(formData);
			NgChmGui.UTIL.showLoading();
		} else if (stopPos === -1) {
            NgChmGui.TRANS.getWorkingMatrix();
		}
	}
}

//Function called when Next button is pressed.  
NgChmGui.TRANS.done =  function() {
	//Validation Checks
	if (!NgChmGui.TRANS.validateEntries(true))
		return;
	
	if (NgChmGui.TRANS.changeApplied === true) {
		NgChmGui.TRANS.setCluster();
	}
	NgChmGui.UTIL.showLoading();
	NgChmGui.UTIL.clusterBuildHeatMap(NgChmGui.TRANS.update);
}

NgChmGui.TRANS.setCluster = function() {
	var props = NgChmGui.mapProperties;
	if (props.col_configuration.order_method === 'Hierarchical') {
		NgChmGui.UTIL.setBuildCluster('C');
	}
	if (props.row_configuration.order_method === 'Hierarchical') {
		NgChmGui.UTIL.setBuildCluster('R');
	}
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
	        	NgChmGui.mapProperties = JSON.parse(req.response);
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
	NgChmGui.UTIL.gotoClusterScreen();
}

/**********************************************************************************
 * FUNCTION - downloadMatrix: This function downloads the current working matrix
 * file with the original matrix name followed by the literal "_edited".
 **********************************************************************************/
NgChmGui.TRANS.downloadMatrix = function() {
	var outputLocation = NgChmGui.mapProperties.output_location.substring(NgChmGui.mapProperties.output_location.indexOf("MapBuildDir"));
	var downloadPath = outputLocation.substring(0, outputLocation.lastIndexOf("/")) + "/workingMatrix.txt";
	var origMatrixName = NgChmGui.mapProperties.builder_config.matrix_grid_config.matrixFileName;
	var outputFile = origMatrixName.substring(0,origMatrixName.lastIndexOf(".")) + "_edited.txt"
	NgChmGui.UTIL.download(downloadPath, outputFile);
} 



