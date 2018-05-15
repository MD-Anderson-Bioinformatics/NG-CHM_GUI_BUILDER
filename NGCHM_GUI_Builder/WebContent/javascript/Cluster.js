//Define Namespace for NgChmGui MatrixFile
NgChmGui.createNS('NgChmGui.CLUSTER');

NgChmGui.CLUSTER.pageText1 = "Cluster your NG-CHM by Order Method, Distance Metric, and Agglomeration Method.";
NgChmGui.CLUSTER.pageText2 = "Cluster your NG-CHM by Order Method, Distance Metric, and Agglomeration Method.";

/**********************************************************************************
 * FUNCTION - loadData: This function populates the dropdowns for row
 * and column ordering on the cluster screen.
 **********************************************************************************/
NgChmGui.CLUSTER.loadData =  function() {
	if (NgChmGui.UTIL.loadHeaderData()) {
		NgChmGui.UTIL.setScreenNotes(NgChmGui.CLUSTER.pageText1);
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
	}
}

/**********************************************************************************
 * FUNCTION - setColOrderVisibility: This function sets the visibility of the column
 * agglomeration and distance metric dropdowns, based on the order method selected.
 **********************************************************************************/
NgChmGui.CLUSTER.setColOrderVisibility =  function() {
	var distance = document.getElementById("ColDistance");
	var agglom = document.getElementById("ColAgglomeration");
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
	var distance = document.getElementById("RowDistance");
	var agglom = document.getElementById("RowAgglomeration");
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
}


