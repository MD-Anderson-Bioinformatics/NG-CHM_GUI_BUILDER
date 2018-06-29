//Define Namespace for NgChmGui MatrixFile
NgChmGui.createNS('NgChmGui.FILE');

/**********************************************************************************
 * FUNCTION - Matrix: This function creates a matrix file object for displaying the
 * user selected matrix on the Matrix screen.
 **********************************************************************************/
NgChmGui.FILE.Matrix = function() {
	this.getMatrixFile = function () {
		return  new NgChmGui.FILE.MatrixFile( );
	}	
};  

/**********************************************************************************
 * FUNCTION - matrixLoad: This function populates the name and description fields
 * on the Matrix Screen
 **********************************************************************************/
NgChmGui.FILE.loadData = function() {
	var properties = NgChmGui.mapProperties;
	var matrixFile = new NgChmGui.FILE.Matrix();
	NgChmGui.matrixFile = matrixFile.getMatrixFile();
	if (NgChmGui.UTIL.elemExist(NgChmGui.mapProperties.chm_name)) {
		document.getElementById("mapNameValue").value = NgChmGui.mapProperties.chm_name;
		document.getElementById("mapDescValue").value = NgChmGui.mapProperties.chm_description;
	}
	var chmFileItem = document.getElementById('image-upload');
	chmFileItem.addEventListener('change', NgChmGui.matrixFile.sendMatrix, false);
	NgChmGui.FILE.validateEntries(false);
}

/**********************************************************************************
 * FUNCTION - addCovarDataEntry: This function will add a covariate file
 * color type preference panel to the data entry (left) panel on the Matrix
 * screen when a user adds a covariate bar by clicking on  on the matrix display 
 * handsontable.
 **********************************************************************************/
NgChmGui.FILE.addCovarDataEntry = function(item, id, name, itemCtr) {
	var prefsPanelDiv = document.getElementById("matrixCovsPanel");
	if (itemCtr === 0) {
		NgChmGui.FILE.addCovarPrefsTitle();
	}
   	var covarDiv = NgChmGui.UTIL.getDivElement(item+"Div_"+id);
   	covarDiv.className = 'pref-header';
	var colorTypeOptionsSelect = "<select name='"+name+"' id='"+item+"Pref_"+id+"' class='cov_color_pref' onchange='NgChmGui.FILE.colorTypeChange();';>" 
	var colorTypeOptions = "<option value='none'></option><option value='discrete'>Discrete</option><option value='continuous'>Continuous</option></select>";
	colorTypeOptionsSelect = colorTypeOptionsSelect+colorTypeOptions;
	covarDiv.innerHTML = "&nbsp;&nbsp;"+name+":&nbsp;&nbsp;"+colorTypeOptionsSelect;
	prefsPanelDiv.appendChild(covarDiv);
	covarDiv.style.display = '';
}

/**********************************************************************************
 * FUNCTION - addCovarPrefsTitle: This function adds a header above the covariate
 * color type preferences in the data entry panel.  It is called when covariates
 * are selected from the matrix AND when the matrix is reloaded from properties.
 **********************************************************************************/
NgChmGui.FILE.addCovarPrefsTitle = function() {
	var prefsPanelDiv = document.getElementById("matrixCovsPanel");
   	var covarTitle = NgChmGui.UTIL.getDivElement("covarPrefsTitle");
   	covarTitle.className = 'sec-header';
   	covarTitle.innerHTML = "<br>Enter Color Type for Covariates"
	covarTitle.style.display = '';
	prefsPanelDiv.appendChild(covarTitle);
}

/**********************************************************************************
 * FUNCTION - colorTypeChange: This function updates the "hasChanged" indicator 
 * variable on the MatrixFile object.  It fires when the user changes a value on
 * any of the color_type dropdowns on the Matrix screen. This will be used to determine 
 * whether the Matrix screen needs to be processed when the NEXT button is pressed.
 **********************************************************************************/
NgChmGui.FILE.colorTypeChange = function() {
	NgChmGui.matrixFile.setChangedState(true);
}

/**********************************************************************************
 * FUNCTION - changeNameDesc: This function updates the "hasChanged" indicator 
 * variable on the MatrixFile object.  It fires when the user changes the value for
 * heat map name or description on the Matrix screen. This will be used to determine 
 * whether the Matrix screen needs to be processed when the NEXT button is pressed.
 **********************************************************************************/
NgChmGui.FILE.changeNameDesc = function() {
	if (document.getElementById('mapNameValue').value !== NgChmGui.mapProperties.chm_name) {
		NgChmGui.matrixFile.setChangedState(true);
	}
	if (document.getElementById('mapDescValue').value !== NgChmGui.mapProperties.chm_description) {
		NgChmGui.matrixFile.setChangedState(true);
	}
}

/**********************************************************************************
 * FUNCTION - removeCovarDataEntry: This function will remove a covariate file
 * color type preference panel from the data entry (left) panel on the Matrix
 * screen when a user removes a covariate bar by clicking on it for a second time
 * on the matrix display handsontable.
 **********************************************************************************/
NgChmGui.FILE.removeCovarDataEntry = function(item, id, itemCtr) {
	var itemDiv = document.getElementById(item+"Div_"+id); 
	itemDiv.remove();
	if (itemCtr === 1) {
		document.getElementById("covarPrefsTitle").remove(); 
	}
}

/**********************************************************************************
 * FUNCTION - MatrixFile: This function defines the MatrixFile object.
 **********************************************************************************/
NgChmGui.FILE.MatrixFile = function() {
	var hasChanged = false;
	var dataTable = [];
	var colLabelCol = 0;
	var rowLabelRow = 0;
	var dataStartPos = [1,1];
	var rowCovs = [];
	var colCovs = [];
	var firstDataPos = [0,0];
	var errMessages = "";
	var warnMessages = "";
	
	/**********************************************************************************
	 * FUNCTION - setChangedState: This function sets the "changed state" for the 
	 * MatrixFile object and is called from outside the object.
	 **********************************************************************************/
	this.setChangedState = function(state) {
		hasChanged = state;
	}
	
	/**********************************************************************************
	 * FUNCTION - isLoaded: This function indicates whether a data file has been loaded.
	 **********************************************************************************/
	this.isLoaded = function() {
		if (dataTable.length > 0)
			return true;
		else
			return false;
	}
	
	/**********************************************************************************
	 * FUNCTION - sendMatrix: This function executes when a user uploads a matrix file
	 * by selecting a matrix file.  It calls a servlet that uploads the matrix file
	 * to the session directory for the current heat map, receives a grid (portion) of
	 * that matrix file, and displays that grid in a handsontable object.
	 **********************************************************************************/
	this.sendMatrix = function(isSample) {
		var req = new XMLHttpRequest();
		var formData = new FormData( document.getElementById("matrix_frm") );
		if (isSample === true) {
			req.open("GET", "UploadMatrix", true);
		} else {
			req.open("POST", "UploadMatrix", true);
		}
		req.onreadystatechange = function () {
			if (NgChmGui.UTIL.debug) {console.log('state change');}
			if (req.readyState == req.DONE) {
				if (NgChmGui.UTIL.debug) {console.log('done');}
		        if (req.status != 200) {
		    		if (NgChmGui.UTIL.debug) {console.log('not 200');}
		            console.log('Failed to upload matrix '  + req.status);
		        } else {
		    		if (NgChmGui.UTIL.debug) {console.log('200');}
		        	//Remove any previous dtat from matrix display box
		        	clearDisplayBox();
		        	//Got corner of matrix data.
		    		resetGridToDefaults();
		        	topMatrixString = JSON.parse(req.response);
		        	var matrixBox = document.getElementById('matrix');
		        	var matrixDisplayBox = document.getElementById('matrixDisplay');
		        	matrixBox.style.display = '';
		        	matrixDisplayBox.style.display = '';
		        	document.getElementById('matrixNextButton').style.display = ''
		        	dataTable = Object.keys(topMatrixString).map(function(k) { return topMatrixString[k] });
		        	loadDataFromFile();
		        	NgChmGui.FILE.validateEntries(false);
		    		document.getElementById("mapNameValue").value = "";
		    		document.getElementById("mapDescValue").value = "";
					NgChmGui.UTIL.hideLoading();
			    }
			}
		};
		NgChmGui.UTIL.showLoading();
		req.send(formData);
	}
	
	/**********************************************************************************
	 * FUNCTION - processMatrix: This function executes when a user presses the next
	 * button on the Matrix screen.  It processes the matrix to create a working matrix
	 * based upon user inputs from the Matrix screen and calls the next screen
	 * in the build process.
	 **********************************************************************************/
	this.processMatrix = function() {
		var req = new XMLHttpRequest();
		var validMatrix = NgChmGui.FILE.validateEntries(true);
		var dataChanged = getChangeState();
		if (validMatrix) {
			if (dataChanged) {
				var matrixJson = getJsonData();
				req.open("POST", "ProcessMatrix", true);
				req.setRequestHeader("Content-Type", "application/json");
				req.onreadystatechange = function () {
					if (NgChmGui.UTIL.debug) {console.log('state change');}
					if (req.readyState == req.DONE) {
						if (NgChmGui.UTIL.debug) {console.log('done');}
				        if (req.status != 200) {
							if (NgChmGui.UTIL.debug) {console.log('not 200');}
				            console.log('Failed to process matrix '  + req.status);
				            NgChmGui.UTIL.matrixLoadingError();
				        } else {
							if (NgChmGui.UTIL.debug) {console.log('200');}
							NgChmGui.UTIL.gotoTransformScreen();
					    }
					}
				};
				req.send(matrixJson);
			} else {
				NgChmGui.UTIL.gotoTransformScreen();
			}
		}
	}
	
	/**********************************************************************************
	 * FUNCTION - getErrMessages: This function returns any error messages set on 
	 * the MatrixFile object to the external matrix validate function.
	 **********************************************************************************/
	this.getErrMessages = function() {
		return errMessages;
	}

	/**********************************************************************************
	 * FUNCTION - getWarnMessages: This function returns any warning messages set on 
	 * the MatrixFile object to the external matrix validate function.
	 **********************************************************************************/
	this.getWarnMessages = function() {
		return warnMessages;
	}
	
	/**********************************************************************************
	 * FUNCTION - setChangedState: This function sets the "changed state" for the 
	 * MatrixFile object and is called from outside the object.
	 **********************************************************************************/
	this.setWarnMessages = function(msg) {
		setWarnMessages = msg;
	}
	
	/**********************************************************************************
	 * FUNCTION - resetGridToDefaults: This function resets all user grid selections
	 * to their default values.  It is run whenever a new matrix file is opened.
	 **********************************************************************************/
	function resetGridToDefaults() {
		//Reset grid positioning/selections to defaults
		dataTable = [];
		colLabelCol = 0;
		rowLabelRow = 0;
		dataStartPos = [1,1];
		rowCovs = [];
		colCovs = [];
		firstDataPos = [0,0];
		hasChanged = true;
		//Remove any color_type dropdown lists from Matrix screen
		var colorDropdowns = document.querySelectorAll('*[id*="ColorTypeDiv"]');
		for (var i=0;i<colorDropdowns.length;i++) {
			var elem = colorDropdowns[i]
			elem.remove();
		}
		var covarTitleBlock = document.getElementById("covarPrefsTitle");
		if (NgChmGui.UTIL.elemExist(covarTitleBlock)) {
			covarTitleBlock.remove(); 
		}
	}
	
	function getChangeState() {
		return hasChanged;
	}

	/**********************************************************************************
	 * FUNCTION - clearDisplayBox: This function clears all contents of the handsontable
	 * object.
	 **********************************************************************************/
	function clearDisplayBox() {
		colLabelCol = 0;
		rowLabelRow = 0;
		dataStartPos = [1,1];
		rowCovs = [];
		colCovs = [];
    	var container = document.getElementById('matrixDisplay');
    	while (container.hasChildNodes()) {
    		container.removeChild(container.lastChild);
    	}
	}
	
	/**********************************************************************************
	 * FUNCTION - getJsonData: This function create a JSON data object of all the 
	 * user entries in the Matrix screen to be passed to the ProcessMatrix servlet.
	 **********************************************************************************/
	 function getJsonData() { 
		var colCovTypes = [];
		var rowCovTypes = [];
		for (var i=0;i<colCovs.length;i++) {
			var covPos = colCovs[i];
			colCovTypes.push(document.getElementById("colColorTypePref_"+covPos).value);
		}
		for (var i=0;i<rowCovs.length;i++) {
			var covPos = rowCovs[i];
			rowCovTypes.push(document.getElementById("rowColorTypePref_"+covPos).value);
		}
		var someData =  {mapName: document.getElementById('mapNameValue').value.trim(),
		                 mapDesc: document.getElementById('mapDescValue').value.trim(),
		                 matrixName: document.getElementById('matrixNameValue').value,
		                 firstDataRow: firstDataPos[0],
		                 firstDataCol: firstDataPos[1],
		                 dataStartRow: dataStartPos[0],
		                 dataStartCol: dataStartPos[1],
		                 rowLabelRow: rowLabelRow,
		                 colLabelCol: colLabelCol,
		                 rowCovs: rowCovs,
		                 colCovs: colCovs,
				         rowCovTypes: rowCovTypes,
				         colCovTypes: colCovTypes};
		return JSON.stringify(someData);
	}

	/**********************************************************************************
	 * FUNCTION - loadDataFromFile: This function loads the handsontable object with
	 * data retrieved from the user selected input matrix.
	 **********************************************************************************/
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
		    var hot = new Handsontable(container, {
				data: getData(),
				stretchH: 'all',
			    cells: function(row, col, prop) {
			        var cellProperties = {};
			        cellProperties.editor = false; 
			        return cellProperties;
			      }
		    });
	   	 	Handsontable.hooks.add('afterOnCellMouseDown', function(evt, data){
				var rowLabelRadio  = document.getElementById('rowlabelPos');
				var colLabelRadio  = document.getElementById('collabelPos');
				var rowCovRadio  = document.getElementById('rowCovPos');
				var colCovRadio  = document.getElementById('colCovPos');
				var dataStartRadio  = document.getElementById('dataStart');
				var selColor;
		      	var row = data.row;
		      	var col = data.col;
		      	var covCtr = colCovs.length+rowCovs.length;
				var rowMeta = hot.getCellMeta(row, 0);
				var colMeta = hot.getCellMeta(0, col);
				var changeType = 'lab';
				if (rowLabelRadio.checked) {
					rowLabelRow = row;
				} else if (colLabelRadio.checked) {
					colLabelCol = col;
				} else if (rowCovRadio.checked) {
					changeType = 'cov';
					var colPos = rowCovs.indexOf(col);
					if (col == colLabelCol) {
						errMessages = errMessages + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "The Label column cannot be overlaid with a covariate bar.</p><br>"
						warnMessages = warnMessages + NgChmGui.UTIL.warningPrefix + "Row Covariate was not selected. <br>";	
					} else {
						if (colPos < 0) {
							rowCovs.push(col);
							NgChmGui.FILE.addCovarDataEntry("rowColorType", col, hot.getDataAtCell(rowLabelRow,col),covCtr); 
						} else {
							rowCovs.splice(colPos, 1);
							NgChmGui.FILE.removeCovarDataEntry("rowColorType", col, covCtr);
						}
					}
				} else if (colCovRadio.checked) {
					changeType = 'cov';
					var rowPos = colCovs.indexOf(row);
					if (row == rowLabelRow) {
						errMessages = errMessages + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "The Label column cannot be overlaid with a covariate bar.</p><br>"
						warnMessages = warnMessages + NgChmGui.UTIL.warningPrefix + "Column Covariate was not selected. </p><br>";	
					} else {
						if (rowPos < 0) {
							colCovs.push(row);
							NgChmGui.FILE.addCovarDataEntry("colColorType", row, hot.getDataAtCell(row,colLabelCol),covCtr); 
						} else {
							colCovs.splice(rowPos, 1);
							NgChmGui.FILE.removeCovarDataEntry("colColorType", row, covCtr); 
						}
					}
				} else if (dataStartRadio.checked) {
					changeType = 'ds';
					dataStartPos = [row,col];
				}   
				clearAllSelections(hot);
				setAllSelections(hot,changeType);
		        hot.render();
		      },hot);

		    Handsontable.dom.addEvent(window, 'hashchange', function(event){
			hot.loadData(getData());
			
	    });
		setAllSelections(hot,'lab')
        hot.render();
		return hot;
	}

	/**********************************************************************************
	 * FUNCTION - applyCovSelections: This function draws the cells for all covariate
	 * bars in yellow.
	 **********************************************************************************/
	function applyCovSelections(hot) {
	    var selStyle = 'covar';
		for (var i=0;i<colCovs.length;i++) {
			var row = colCovs[i];
	        for(var j = 0; j < hot.countCols(); j++){
	        	if (j >= rowLabelRow) {
	        		hot.setCellMeta(row, j, 'className', selStyle);
	        	}
	        }
		}
		for (var i=0;i<rowCovs.length;i++) {
			var col = rowCovs[i];
	        for(var j = 0; j < hot.countRows(); j++){
	        	if (j >= colLabelCol) {
	        		hot.setCellMeta(j, col, 'className', selStyle);
	        	}
	        }
		}
	}
	  
	/**********************************************************************************
	 * FUNCTION - applyDataStartSelection: This function draws the cells for all data cells
	 * in green.
	 **********************************************************************************/
	function applyDataStartSelection(hot) {
	    var dsRow = dataStartPos[0];
	    var dsCol = dataStartPos[1];
	    for(var i = dsRow; i < hot.countRows(); i++){
		    for(var j = dsCol; j < hot.countCols(); j++){
	          hot.setCellMeta(i, j, 'className', 'data');
		    }
	    }
	}
	  
	/**********************************************************************************
	 * FUNCTION - applyLabelSelections: This function draws the cells for all label
	 * rows and columns in blue.
	 **********************************************************************************/
	function applyLabelSelections(hot) {
	    var selStyle = 'label';
        for(var j = 0; j < hot.countCols(); j++){
        	if (j >= colLabelCol) {
    			hot.setCellMeta(rowLabelRow, j, 'className', selStyle);
        	}
        }
        for(var j = 0; j < hot.countRows(); j++){
        	if (j >= rowLabelRow) {
    			hot.setCellMeta(j, colLabelCol, 'className', selStyle);
        	}
        }
	}
	  
	/**********************************************************************************
	 * FUNCTION - setFirstDataPos: This function calculates and sets the position of the
	 * first data element in the matrix (label or covariate bar top left position).  
	 **********************************************************************************/
	function setFirstDataPos(hot) {
		  var firstRowCov = 100;
		  var firstColCov = 100;
		  for (var i=0;i<colCovs.length;i++) {
			  var row = colCovs[i];
			  if (row < firstColCov) {
				  firstColCov = row;
			  }
		  }
		  for (var i=0;i<rowCovs.length;i++) {
			  var col = rowCovs[i];
			  if (col < firstRowCov) {
				  firstRowCov = col;
			  }
		  }
		  if (rowLabelRow < firstColCov) {
			  firstColCov = rowLabelRow;
		  }
		  if (colLabelCol < firstRowCov) {
			  firstRowCov = colLabelCol;
		  }
		  firstDataPos[0] = firstColCov;
		  firstDataPos[1] = firstRowCov;
	}
	  
	/**********************************************************************************
	 * FUNCTION - adjustDataStart: This function calculates and sets the position of the
	 * first data element (i.e. non-covariate or label) in the matrix.  This will be used 
	 * to pull data from the matrix when it is processed on the back end.
	 **********************************************************************************/
	function adjustDataStart(hot) {
		  var changeFound = false;
		  var lastRowCov = 0;
		  var lastColCov = 0;
		  for (var i=0;i<colCovs.length;i++) {
			  var row = colCovs[i];
			  if (row > lastColCov) {
				  lastColCov = row;
			  }
		  }
		  for (var i=0;i<rowCovs.length;i++) {
			  var col = rowCovs[i];
			  if (col > lastRowCov) {
				  lastRowCov = col;
			  }
		  }
		  if (colLabelCol > lastRowCov) {
			  lastRowCov = colLabelCol;
		  }
		  if (rowLabelRow > lastColCov) {
			  lastColCov = rowLabelRow;
		  }
		  if (dataStartPos[0] <= lastColCov) {
			  dataStartPos[0] = lastColCov+1;
			  changeFound = true;
		  }
		  if (dataStartPos[1] <= lastRowCov) {
			  dataStartPos[1] = lastRowCov+1;
			  changeFound = true;
		  }
		  return changeFound;
	}
	  
	/**********************************************************************************
	 * FUNCTION - setAllSelections: This function fires at screen load and whenever
	 * a user clicks on the matrix.  It performs validations on the state of the matrix
	 * after the click and then redraws the matrix on the screen.
	 **********************************************************************************/
	function setAllSelections(hot,change) {
		validateHotSelections(hot);
		setFirstDataPos(hot);
		applyDataStartSelection(hot);
		applyLabelSelections(hot) 
		applyCovSelections(hot);
	}
	
	/**********************************************************************************
	 * FUNCTION - validateHotSelections: This function validates user selections (by 
	 * click) on the matrix handsontable object.
	 **********************************************************************************/
	function validateHotSelections(hot) {
		if (dsCheckCovEntries(rowCovs, colLabelCol, colCovs.length+rowCovs.length, "rowColorType")) {
			  warnMessages = warnMessages + NgChmGui.UTIL.warningPrefix + "Row Covariate(s) removed as a result of this selection.<br>";
		}
		if (dsCheckCovEntries(colCovs, rowLabelRow, colCovs.length+rowCovs.length, "colColorType")) {
			warnMessages = warnMessages + NgChmGui.UTIL.warningPrefix + "Column Covariate(s) removed as a result of this selection.<br>";
		} 
		if (adjustDataStart(hot)) {
			warnMessages = warnMessages + NgChmGui.UTIL.warningPrefix + "Data Start Position cannot overlay labels and covariates.  Value adjusted to:  Row: " + (dataStartPos[0]+1) + " Column: " + (dataStartPos[1]+1) + "<br>";
		}
		//call validate routine to draw error and warning messages to screen
		NgChmGui.FILE.validateEntries(false);
		//initialize errors after to validation
		errMessages = "";
		warnMessages = "";
	}
	  
	/**********************************************************************************
	 * FUNCTION - dsCheckCovEntries: This function evaluates the position of covariate
	 * bars and removes them if they are obscured by a row/col label selection.
	 **********************************************************************************/
	function dsCheckCovEntries(rcCovs, rElem, covCtr, listId) {
		var covRemoved = false;
		var remCov = [];
		for (var i=0;i<rcCovs.length;i++) {
			var rCov = rcCovs[i];
			if (rCov == rElem) {
				NgChmGui.FILE.removeCovarDataEntry(listId, rCov, covCtr);
				remCov.push(rCov);
				covCtr--;
			}
		}
		if (remCov.length > 0) {
			covRemoved = true;
			for (var i=0;i<remCov.length;i++) {
				for (var j=0;j<rcCovs.length;j++) {
					if (rcCovs[j] === remCov[i]) {
						rcCovs.splice(j, 1)
					}
				}
			}
		}
		return covRemoved;
	}
	
	/**********************************************************************************
	 * FUNCTION - clearAllSelections: This function clears any selections from the 
	 * handsontable prior to a redraw of the table on the screen.
	 **********************************************************************************/
	function clearAllSelections(hot) {
		    for(var i = 0; i < hot.countRows(); i++){
			    for(var j = 0; j < hot.countCols(); j++){
		        	hot.setCellMeta(i, j, 'className', undefined);
			    }
		    }
	}
	
	/**********************************************************************************
	 * FUNCTION - reloadGridFromConfig: This function reloads the handsontable from 
	 * saved grid config properties.  Colors that table and creates/populates any
	 * covariate color type dropdowns on the Matrix screen.
	 **********************************************************************************/
	function reloadGridFromConfig() {
		var gridConfig = NgChmGui.mapProperties.builder_config.matrix_grid_config;
		colLabelCol = gridConfig.colLabelCol;
		rowLabelRow = gridConfig.rowLabelRow;
		dataStartPos = [gridConfig.dataStartRow, gridConfig.dataStartCol];
		rowCovs = gridConfig.rowCovs;
		colCovs = gridConfig.colCovs;
		firstDataPos = [gridConfig.firstDataRow, gridConfig.firstDataCol];
		loadDataFromFile();
		if ((colCovs.length+rowCovs.length) > 0) {
			NgChmGui.FILE.addCovarPrefsTitle();
		}
		if (colCovs.length > 0) {
			for (var i =0;i<colCovs.length;i++) {
				var heading = dataTable[(colCovs[i])] [colLabelCol];
				NgChmGui.FILE.addCovarDataEntry("colColorType", colCovs[i], heading, colCovs.length+rowCovs.length); 
				var colorType = "discrete";
				for (var j=0;j<NgChmGui.mapProperties.classification_files.length;j++) {
					if ((heading === NgChmGui.mapProperties.classification_files[j].name) && (NgChmGui.mapProperties.classification_files[j].position = "column")) {
						colorType = NgChmGui.mapProperties.classification_files[j].color_map.type;
						break;
					}
				}
				document.getElementById("colColorTypePref_"+ colCovs[i]).value = colorType;
			}
		}
		if (rowCovs.length > 0) {
			for (var i =0;i<rowCovs.length;i++) {
				var heading = dataTable[rowLabelRow] [(rowCovs[i])];
				NgChmGui.FILE.addCovarDataEntry("rowColorType", rowCovs[i], heading, colCovs.length+rowCovs.length); 
				var colorType = "discrete";
				for (var j=0;j<NgChmGui.mapProperties.classification_files.length;j++) {
					if ((heading === NgChmGui.mapProperties.classification_files[j].name) && (NgChmGui.mapProperties.classification_files[j].position = "row")) {
						colorType = NgChmGui.mapProperties.classification_files[j].color_map.type;
						break;
					}
				}
				document.getElementById("rowColorTypePref_"+ rowCovs[i]).value = colorType;
			}
		}
	}
	
	/**********************************************************************************
	 * This section of JS runs when a Matrix File object is created.  If the map properties 
	 * contain the builder_config JSON node that contains a user's previous handsontable 
	 * grid selections, this function will retrieve the original top-left matrix grid
	 * and reload the handsontable, adding covariate dropdowns and grid coloring
	 * where necessary to the Matrix screen.
	 **********************************************************************************/
	if (NgChmGui.UTIL.elemExist(NgChmGui.mapProperties.builder_config)) {
		var req = new XMLHttpRequest();
		req.open("POST", "ReloadMatrix", true);
		req.onreadystatechange = function () {
			if (NgChmGui.UTIL.debug) {console.log('state change');}
			if (req.readyState == req.DONE) {
				if (NgChmGui.UTIL.debug) {console.log('done');}
		        if (req.status != 200) {
		    		if (NgChmGui.UTIL.debug) {console.log('not 200');}
		            console.log('Failed to upload matrix '  + req.status);
		        } else {
		        	//Remove any previous dtat from matrix display box
		        	clearDisplayBox();
		        	//Got corner of matrix data.
		    		if (NgChmGui.UTIL.debug) {console.log('200');}
		    		var responseStr = req.response;
		    		if (responseStr.trim() !==  "no_data") {
			        	topMatrixString = JSON.parse(req.response);
			        	var matrixBox = document.getElementById('matrix');
			        	var matrixDisplayBox = document.getElementById('matrixDisplay');
			        	matrixBox.style.display = '';
			        	matrixDisplayBox.style.display = '';
			        	document.getElementById('matrixNextButton').style.display = ''
			        	dataTable = Object.keys(topMatrixString).map(function(k) { return topMatrixString[k] });
			        	reloadGridFromConfig();
			        	NgChmGui.FILE.validateEntries(false);
						NgChmGui.UTIL.hideLoading();
		    		}
			    }
			}
		};
		NgChmGui.UTIL.showLoading();
		req.send();
	}
	
};

/**********************************************************************************
 * FUNCTION - validateEntries: This function validates user entries and generates
 * user help messages in the main text area.  If user is trying to exit the screen
 * additional validation is done.
 **********************************************************************************/
NgChmGui.FILE.validateEntries = function(leavingPage) {
	NgChmGui.FILE.pageText1 = "NG-CHM heat maps require a tab delimited text file with a matrix of data.  The file must have row and column headers with labels that identify the content of the rows / columns and numeric values in the rest of the matrix.  Use the Open Matrix File button to load your matrix.   If you don't have a matrix and want to try the application use the Sample Matrix open button.";
	NgChmGui.FILE.pageText2 = "The builder needs to know where the row labels, column labels, matrix data, and covariate data (if included) are located in the uploaded file.  The labels should be blue and data should be green.  If not select from the following controls and click on the grid to indicate the location of labels, covariate bars, and the location at which the matrix data begins in the imported file.";
	var pageText = "";
	var valid = true;
	
	//Add matrix selection error messages
	if ((NgChmGui.matrixFile.getErrMessages() !== "")) {
		pageText = pageText + NgChmGui.matrixFile.getErrMessages();
		valid = false;
	}
	
	if (leavingPage) {
		//Generate error messages
		var mapName = document.getElementById('mapNameValue').value.trim();
		if (mapName === "") {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "HEAT MAP NAME ENTRY MISSING.</p>" + NgChmGui.UTIL.nextLine;
			valid = false
		}
		if (!NgChmGui.UTIL.isAlphaNumeric(mapName)) {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "HEAT MAP NAME CANNOT CONTAIN NON-ALPHANUMERIC CHARACTERS. (Exceptions: space, hyphen, and underscore)</p>" + NgChmGui.UTIL.nextLine;
			valid = false
		}
		var mapDesc = document.getElementById('mapDescValue').value.trim();
		if (mapDesc === "") {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "HEAT MAP DESCRIPTION ENTRY MISSING.</p>" + NgChmGui.UTIL.nextLine;
			valid = false
		}
		if (!NgChmGui.UTIL.isAlphaNumeric(mapDesc)) {
			pageText = pageText  + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "HEAT MAP DESCRIPTION CANNOT CONTAIN NON-ALPHANUMERIC CHARACTERS (Exceptions: space, hyphen, and underscore).</p>" + NgChmGui.UTIL.nextLine;
			valid = false
		}
		
		if (document.getElementById('matrixNameValue').value.trim() === "") {
			pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "MISSING MATRIX NAME ENTRY.</p>" + NgChmGui.UTIL.nextLine;
			valid = false
		}
		
		//validate covariate color pref selections
		var covColorTypes = document.getElementsByClassName("cov_color_pref");
		for (var i=0;i<covColorTypes.length;i++) {
			var type = covColorTypes[i];
			if (type.value === 'none') {
				pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "MISSING COLOR TYPE ENTRY FOR COVARIATE: " + type.name + "</p>" +NgChmGui.UTIL.nextLine;
				valid = false
			}
		}

	}
	
	//Generate warning messages (if any)
	pageText = pageText + NgChmGui.matrixFile.getWarnMessages();
	
	//Add in page instruction text
	if (NgChmGui.matrixFile.isLoaded()){
		pageText = pageText + NgChmGui.FILE.pageText2 + NgChmGui.UTIL.nextLine;
	} else {
		pageText = pageText + NgChmGui.FILE.pageText1 + NgChmGui.UTIL.nextLine;;
	}

	NgChmGui.UTIL.setScreenNotes(pageText);
	
	return valid;
}

