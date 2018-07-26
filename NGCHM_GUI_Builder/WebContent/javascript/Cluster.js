//Define Namespace for NgChmGui MatrixFile
NgChmGui.createNS('NgChmGui.CLUSTER');

/**********************************************************************************
 * FUNCTION - loadData: This function populates the dropdowns for row
 * and column ordering on the cluster screen.
 **********************************************************************************/
NgChmGui.CLUSTER.loadData =  function() {
	if (NgChmGui.UTIL.loadHeaderData()) {
		if (typeof NgChmGui.mapProperties.col_configuration !== 'undefined') {
			document.getElementById("ColOrder").value = NgChmGui.mapProperties.col_configuration.order_method;
			if (document.getElementById("ColOrder").value !== "Hierarchical") {
				document.getElementById("ColDistance").value = "euclidean";
				document.getElementById("ColAgglomeration").value = "ward";
			} else {
				document.getElementById("ColDistance").value = NgChmGui.mapProperties.col_configuration.distance_metric;
				document.getElementById("ColAgglomeration").value = NgChmGui.mapProperties.col_configuration.agglomeration_method;
			}
			NgChmGui.CLUSTER.setColOrderVisibility();
		}
		if (typeof NgChmGui.mapProperties.row_configuration !== 'undefined') {
			document.getElementById("RowOrder").value = NgChmGui.mapProperties.row_configuration.order_method;
			if (document.getElementById("RowOrder").value !== "Hierarchical") {
				document.getElementById("RowDistance").value = "euclidean";
				document.getElementById("RowAgglomeration").value = "ward";
			} else {
				document.getElementById("RowDistance").value = NgChmGui.mapProperties.row_configuration.distance_metric;
				document.getElementById("RowAgglomeration").value = NgChmGui.mapProperties.row_configuration.agglomeration_method;
			}
			NgChmGui.CLUSTER.setRowOrderVisibility();
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
	NgChmGui.CLUSTER.validateEntries(false);
	NgChmGui.UTIL.loadHeatMapView();
}

/**********************************************************************************
 * FUNCTION - setColOrderVisibility: This function sets the visibility of the column
 * agglomeration and distance metric dropdowns, based on the order method selected.
 **********************************************************************************/
NgChmGui.CLUSTER.setColOrderVisibility =  function() {
	var distance = document.getElementById("col_distance");
	var agglom = document.getElementById("col_method");
	if (document.getElementById("ColOrder").value !== "Hierarchical") {
		distance.style.display = 'none';
		agglom.style.display = 'none';
	} else {
		distance.style.display = '';
		agglom.style.display = '';
	}
}

/**********************************************************************************
 * FUNCTION - setRowOrderVisibility: This function sets the visibility of the row
 * agglomeration and distance metric dropdowns, based on the order method selected.
 **********************************************************************************/
NgChmGui.CLUSTER.setRowOrderVisibility =  function(orderVal) {
	var distance = document.getElementById("row_distance");
	var agglom = document.getElementById("row_method");
	if (document.getElementById("RowOrder").value !== "Hierarchical") {
		distance.style.display = 'none';
		agglom.style.display = 'none';
	} else {
		distance.style.display = '';
		agglom.style.display = '';
	}
}

/**********************************************************************************
 * FUNCTION - applyClusterPrefs: This function applys changes made in the cluster
 * panel to the mapProperties object in advance of saving the properties.
 **********************************************************************************/
NgChmGui.CLUSTER.applyClusterPrefs = function() {
	NgChmGui.mapProperties.row_configuration.order_method = document.getElementById('RowOrder').value
	NgChmGui.mapProperties.row_configuration.distance_metric = document.getElementById('RowDistance').value
	NgChmGui.mapProperties.row_configuration.agglomeration_method = document.getElementById('RowAgglomeration').value
	NgChmGui.mapProperties.col_configuration.order_method = document.getElementById('ColOrder').value
	NgChmGui.mapProperties.col_configuration.distance_metric = document.getElementById('ColDistance').value
	NgChmGui.mapProperties.col_configuration.agglomeration_method = document.getElementById('ColAgglomeration').value
	return true;
}

/* Validate and go to next screen if everything is good */
NgChmGui.CLUSTER.gotoFormatScreen = function() {
	if (NgChmGui.CLUSTER.validateEntries(true)){
		NgChmGui.UTIL.gotoFormatScreen()
	}
}