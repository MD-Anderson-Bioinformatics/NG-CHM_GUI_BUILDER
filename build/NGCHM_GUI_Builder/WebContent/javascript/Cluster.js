//Define Namespace for NgChmGui MatrixFile
NgChmGui.createNS('NgChmGui.CLUSTER');
NgChmGui.isHalfScreen = true;
NgChmGui.tileWrite = false;


/**********************************************************************************
 * FUNCTION - loadData: This function populates the dropdowns for row
 * and column ordering on the cluster screen.
 **********************************************************************************/
NgChmGui.CLUSTER.loadData =  function() {
	var builderConfig = NgChmGui.mapProperties.builder_config;
	NgChmGui.UTIL.setUpAdvanced();
	if (NgChmGui.UTIL.loadHeaderData()) {
		if (typeof NgChmGui.mapProperties.col_configuration !== 'undefined') {
			document.getElementById("ColOrder").value = NgChmGui.mapProperties.col_configuration.order_method;
			document.getElementById("colCuts").value = builderConfig.colCuts;
			document.getElementById("colCutsName").value = builderConfig.colCutsLabel;
			if (document.getElementById("ColOrder").value !== "Hierarchical") {
				document.getElementById("ColDistance").value = "euclidean";
				document.getElementById("ColAgglomeration").value = "ward";
				document.getElementById("colAddCuts").checked = false;
			} else {
				document.getElementById("ColDistance").value = NgChmGui.mapProperties.col_configuration.distance_metric;
				document.getElementById("ColAgglomeration").value = NgChmGui.mapProperties.col_configuration.agglomeration_method;
				if (builderConfig.colCuts > 0) {
					document.getElementById("colAddCuts").checked = true;
				}
			}
			NgChmGui.CLUSTER.setColOrderVisibility();
			NgChmGui.CLUSTER.setColCutVisibility();
		}
		if (typeof NgChmGui.mapProperties.row_configuration !== 'undefined') {
			document.getElementById("RowOrder").value = NgChmGui.mapProperties.row_configuration.order_method;
			document.getElementById("rowCuts").value = builderConfig.rowCuts;
			document.getElementById("rowCutsName").value = builderConfig.rowCutsLabel;
			if (document.getElementById("RowOrder").value !== "Hierarchical") {
				document.getElementById("RowDistance").value = "euclidean";
				document.getElementById("RowAgglomeration").value = "ward";
				document.getElementById("rowAddCuts").checked = false;
			} else {
				document.getElementById("RowDistance").value = NgChmGui.mapProperties.row_configuration.distance_metric;
				document.getElementById("RowAgglomeration").value = NgChmGui.mapProperties.row_configuration.agglomeration_method;
				if (builderConfig.rowCuts > 0) {
					document.getElementById("rowAddCuts").checked = true;
				}
			}
			NgChmGui.CLUSTER.setRowOrderVisibility();
			NgChmGui.CLUSTER.setRowCutVisibility();
		}
		NgChmGui.UTIL.loadHeatMapView();
		NgChmGui.CLUSTER.validateEntries(false);
	}
}

/**********************************************************************************
 * FUNCTION - the validate function is called on page load, page exit, and when
 * user operations are performed.  It creates conditional messages in the message
 * area including errors and warnings.  It also returns false if errors are detected.  
 **********************************************************************************/

NgChmGui.CLUSTER.validateEntries = function(leavingPage) {
	var valid = true;
	var pageText = "";
	
	//Generate build error messages
	var buildErrors = NgChmGui.mapProperties.builder_config.buildErrors;
	if (buildErrors !== "") {
		pageText = pageText + "<b><font color='red'>" + buildErrors + "</font></b> Build error must be resolved to continue." + NgChmGui.UTIL.nextLine;
		valid = false;
	}

	//Page exit processing
	if (leavingPage) {
		//Do nothing for this page
	} 
	
	//Generate warning messages
	var buildWarnings = NgChmGui.mapProperties.builder_config.buildWarnings;     
	if (buildWarnings.length > 0) {  
		for (var i=0; i< buildWarnings.length; i++) {
			pageText = pageText + NgChmGui.UTIL.warningPrefix + buildWarnings[i] + NgChmGui.UTIL.nextLine;
		}
	}
	
	//Add in page instruction text
	// if we already have class bars
	if ((typeof NgChmGui.mapProperties.col_configuration !== 'undefined') && (NgChmGui.mapProperties.col_configuration.order_method == "Hierarchical") ||
		(typeof NgChmGui.mapProperties.row_configuration !== 'undefined') && (NgChmGui.mapProperties.row_configuration.order_method == "Hierarchical"))   {
	   pageText = pageText + "Select other ordering methods, clustering distance measures, or agglomeration methods if clustering results are not a good fit for your data.  When the row and column ordering is good, hit next." ;
	} else {
	   pageText = pageText + "Select the ordering method you would like for rows and columns. Generally, hierarchial clustering is applied to rows, columns, or both.  Various distance measures and agglomeration methods can be selected for clustering.  Eucledian and Ward generally produce good results.  Hit apply to see the dendrogram and reordered matrix.  Clustering can take some time if the matrix is large. " ;
	}
	NgChmGui.UTIL.setScreenNotes(pageText);
	
	return valid;
}

/**********************************************************************************
 * FUNCTION - clusteringComplete: This function gets called when the ordering has
 * been changed and sent to the server to perform clustering.
 **********************************************************************************/
NgChmGui.CLUSTER.clusteringComplete = function(){
	NgChmGui.UTIL.getHeatmapProperties(NgChmGui.CLUSTER.loadData); 
}

/**********************************************************************************
 * FUNCTION - setColOrderVisibility: This function sets the visibility of the column
 * agglomeration and distance metric dropdowns, based on the order method selected.
 **********************************************************************************/
NgChmGui.CLUSTER.setColOrderVisibility =  function() {
	var distance = document.getElementById("col_distance");
	var agglom = document.getElementById("col_method");
	var cuts = document.getElementById("col_treecuts");
	if (document.getElementById("ColOrder").value !== "Hierarchical") {
		distance.style.display = 'none';
		agglom.style.display = 'none';
		cuts.style.display = 'none';
	} else {
		distance.style.display = '';
		agglom.style.display = '';
		cuts.style.display = '';
	}
}

/**********************************************************************************
 * FUNCTION - setColCutVisibility: This function sets the visibility of the 
 * cluster based column covariate bar controls.
 **********************************************************************************/
NgChmGui.CLUSTER.setColCutVisibility =  function() {
	var checkBox = document.getElementById("colAddCuts");
	var options = document.getElementById("col_treecuts_options");
	var name = document.getElementById("colCutsName");
	var cuts = document.getElementById("colCuts");
	if (checkBox.checked == true) {
		options.style.display = '';
	} else {
		options.style.display = 'none';
		name.value = "Clusters";
		cuts.value = "0";
	}	
}

/**********************************************************************************
 * FUNCTION - setRowOrderVisibility: This function sets the visibility of the row
 * agglomeration and distance metric dropdowns, based on the order method selected.
 **********************************************************************************/
NgChmGui.CLUSTER.setRowOrderVisibility =  function() {
	var distance = document.getElementById("row_distance");
	var agglom = document.getElementById("row_method");
	var cuts = document.getElementById("row_treecuts");
	if (document.getElementById("RowOrder").value !== "Hierarchical") {
		distance.style.display = 'none';
		agglom.style.display = 'none';
		cuts.style.display = 'none';
	} else {
		distance.style.display = '';
		agglom.style.display = '';
		cuts.style.display = '';
	}
}

/**********************************************************************************
 * FUNCTION - setRowCutVisibility: This function sets the visibility of the 
 * cluster based row covariate bar controls.
 **********************************************************************************/
NgChmGui.CLUSTER.setRowCutVisibility =  function() {
	var checkBox = document.getElementById("rowAddCuts");
	var options = document.getElementById("row_treecuts_options");
	var name = document.getElementById("rowCutsName");
	var cuts = document.getElementById("rowCuts");
	if (checkBox.checked == true) {
		options.style.display = '';
	} else {
		options.style.display = 'none';
		name.value = "Clusters";
		cuts.value = "0";
	}	
}

/**********************************************************************************
 * FUNCTION - applyClusterPrefs: This function applys changes made in the cluster
 * panel to the mapProperties object in advance of saving the properties.
 **********************************************************************************/
NgChmGui.CLUSTER.applyClusterPrefs = function() {
	NgChmGui.UTIL.setTileWrite();
	NgChmGui.tileWrite = false;
	NgChmGui.mapProperties.row_configuration.order_method = document.getElementById('RowOrder').value;
	NgChmGui.mapProperties.row_configuration.distance_metric = document.getElementById('RowDistance').value;
	NgChmGui.mapProperties.row_configuration.agglomeration_method = document.getElementById('RowAgglomeration').value;
	if (document.getElementById('RowOrder').value !== "Hierarchical") {
		NgChmGui.mapProperties.builder_config.rowCuts = "0";
		NgChmGui.mapProperties.builder_config.rowCutsLabel = "Clusters";
	} else {
		NgChmGui.mapProperties.builder_config.rowCuts = document.getElementById("rowCuts").value;
		NgChmGui.mapProperties.builder_config.rowCutsLabel = document.getElementById("rowCutsName").value;
	}
	NgChmGui.mapProperties.col_configuration.order_method = document.getElementById('ColOrder').value;
	NgChmGui.mapProperties.col_configuration.distance_metric = document.getElementById('ColDistance').value;
	NgChmGui.mapProperties.col_configuration.agglomeration_method = document.getElementById('ColAgglomeration').value;
	if (document.getElementById('ColOrder').value !== "Hierarchical") {
		NgChmGui.mapProperties.builder_config.colCuts = "0";
		NgChmGui.mapProperties.builder_config.colCutsLabel = "Clusters";
	} else {
		NgChmGui.mapProperties.builder_config.colCuts = document.getElementById("colCuts").value;
		NgChmGui.mapProperties.builder_config.colCutsLabel = document.getElementById("colCutsName").value;
	}
	return true;
}

/**********************************************************************************
 * FUNCTION - applyClusterSettings: This function invokes the application of user
 * screen preference changes to the heatmapProperties and calls the appropriate
 * build/cluster function.
 **********************************************************************************/
NgChmGui.CLUSTER.applyClusterSettings = function(applyFunction, nextFunction) {
	if (NgChmGui.UTIL.validSession()) {
		if (NgChmGui.UTIL.buildProps() === true) {
			//Reset builder warnings before calling a new build
			NgChmGui.UTIL.clearBuildErrors();
			if (applyFunction()) {
				NgChmGui.UTIL.clusterBuildHeatMap(nextFunction);
			} else {
				return;
			};
		} else {
			nextFunction();
		}
	}
}





