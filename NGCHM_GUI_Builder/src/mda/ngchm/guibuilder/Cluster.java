package mda.ngchm.guibuilder;

import javax.script.ScriptEngine;
import org.renjin.script.RenjinScriptEngineFactory;

/**
 * Servlet implementation class Upload Data Matrix
 */
public class Cluster  {
	private static final ThreadLocal<ScriptEngine> ENGINE = new ThreadLocal<>();
	
	public void clusterHeatMap(String workingDir) throws Exception {
		// Obtain R script engine for this thread
		ScriptEngine engine = getScriptEngine();

        //Retrieve heat map properties
	    HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
	    mgr.load();
	    HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	    
	    //Get first matrix file for clustering 
	    String matrixFile = map.matrix_files.get(0).path;
	    String clusterProp = map.builder_config.buildCluster;
	    boolean clusterRows = (clusterProp.equals("R") || clusterProp.equals("B")) ? true : false;
	    boolean clusterCols = (clusterProp.equals("C") || clusterProp.equals("B")) ? true : false;
	    
	    if (clusterRows) {
		    //Create paths for clustering output files
		    String rowOrder = workingDir  + "/rowOrder.txt";  
		    String rowDendro = workingDir  + "/rowDendro.txt";  
		    String rowOrderMethod = map.row_configuration.order_method;
		    if (rowOrderMethod.equals("Hierarchical")) {   
		    	try {
				    performOrdering(engine, matrixFile, rowOrderMethod, "row", map.row_configuration.distance_metric, map.row_configuration.agglomeration_method, rowOrder, rowDendro);  //Get from props
			    	map.row_configuration.order_file = rowOrder;  
			    	map.row_configuration.dendro_file = rowDendro; 
			    	if (map.row_configuration.dendro_show.equals("NA"))	{	 	    	
		    			map.row_configuration.dendro_show = "ALL";  
		    			map.row_configuration.dendro_height = "100";  
			    	}
		    	} catch (Exception e) {
		    		map.row_configuration.order_method = "Original";
			    	map.builder_config.buildWarnings.add("An error occurred while clustering rows using Distance: " + map.row_configuration.distance_metric + " and Agglomeration: " + map.row_configuration.agglomeration_method + ". Row order has been reset to Original.  Please try a different row Distance Measure and/or Agglomeration Method.");
		    	}
		    } else {
		    	map.row_configuration.order_file = null;  
		    	map.row_configuration.dendro_file = null;  
		    	map.row_configuration.dendro_show = "NA";  
		    	map.row_configuration.dendro_height = "10";
		    }
	    }
	    if (clusterCols) {
		    String colOrder = workingDir  + "/colOrder.txt";  
		    String colDendro = workingDir  + "/colDendro.txt";  
			String colOrderMethod = map.col_configuration.order_method;
		    if (colOrderMethod.equals("Hierarchical")) {   
		    	try {
		    		performOrdering(engine, matrixFile, colOrderMethod, "column", map.col_configuration.distance_metric, map.col_configuration.agglomeration_method, colOrder, colDendro);  //Get from props
			    	map.col_configuration.order_file = colOrder;  
			    	map.col_configuration.dendro_file = colDendro; 
			    	if (map.col_configuration.dendro_show.equals("NA"))	{	 	    	
		    			map.col_configuration.dendro_show = "ALL";  
		    			map.col_configuration.dendro_height = "100";  
			    	}
		    	} catch (Exception e) {
		    		colOrderMethod = "Original"; 
		    		map.col_configuration.order_method = colOrderMethod;
			    	map.builder_config.buildWarnings.add("An error occurred while clustering columns using Distance: " + map.col_configuration.distance_metric + " and Agglomeration: " + map.col_configuration.agglomeration_method + ". Column order has been reset to Original.  Please try a different column Distance Measure and/or Agglomeration Method.");
				    mgr.save();
		    	}
		    } 
		    if (!colOrderMethod.equals("Hierarchical")) {   
		    	map.col_configuration.order_file = null;  
		    	map.col_configuration.dendro_file = null;  
		    	map.col_configuration.dendro_show = "NA";  
		    	map.col_configuration.dendro_height = "10";
		    }
	    }
	    map.builder_config.buildCluster = "N";
	    //Save changes to heatmapProperties file
	    mgr.save();
	}

	private ScriptEngine getScriptEngine() {
    	ScriptEngine engine = ENGINE.get();
    	if(engine == null) {
    		// Create a new ScriptEngine for this thread if one does not exist.
    		RenjinScriptEngineFactory factory = new RenjinScriptEngineFactory();
    		engine = factory.getScriptEngine();
    		ENGINE.set(engine);
    	}
    	return engine;
    }
	
	
	private void performOrdering(ScriptEngine engine, String matrixFile, String orderMethod, String direction, String distanceMeasure, String agglomerationMethod, String orderFile, String clusterFile) throws Exception {
		engine.eval("dataMatrix = read.table(\"" + matrixFile + "\", header=TRUE, sep = \"\t\", check.names=FALSE, row.names = 1, as.is=TRUE, na.strings=c(\"NA\",\"N/A\",\"-\",\"?\"));");
		engine.eval("ordering <- NULL; "); 
		if (orderMethod.equals("Hierarchical")) {
			if (direction.equals("row")){
				if (distanceMeasure.equals("correlation")) { 
					engine.eval("distVals <- as.dist(1-cor(t(dataMatrix), use=\"pairwise.complete.obs\"))");
				} else {
					engine.eval("distVals <- dist(dataMatrix, method=\"" + distanceMeasure + "\");");
				}	
			} else {
				if (distanceMeasure.equals("correlation")) { 
					engine.eval("distVals <- as.dist(1-cor(dataMatrix, use=\"pairwise.complete.obs\"))");
				} else {
					engine.eval("distVals <- dist(t(dataMatrix), method=\"" + distanceMeasure + "\");");
				}
			}
			engine.eval("ordering <- hclust(distVals, method=\"" + agglomerationMethod + "\");");
			writeHCDataTSVs(engine, "ordering", clusterFile, orderFile);
		}  else if (orderMethod.equals("Random")){
			if (direction.equals("row")){
				engine.eval("headerList <- rownames(dataMatrix);");
			} else {
				engine.eval("headerList <- colnames(dataMatrix);");
			}
			engine.eval("ordering <- sample(headerList, length(headerList));");
			writeOrderTSVs(engine, "ordering", "headerList", orderFile);		
		} else if (orderMethod.equals("Original")){
			engine.eval("headerList <- colnames(dataMatrix);");
			writeOrderTSVs(engine, "headerList", "headerList", orderFile);		
		}
	}

	private void writeHCDataTSVs(ScriptEngine engine, String hclustOrder, String clusterFile, String orderFile) throws Exception {
		engine.eval("data<-cbind(" + hclustOrder + "$merge, " + hclustOrder + "$height, deparse.level=0);");
		engine.eval("colnames(data)<-c(\"A\", \"B\", \"Height\");");
		engine.eval("write.table(data, file = \"" + clusterFile + "\", append = FALSE, quote = FALSE, sep = \"\t\", row.names=FALSE);");
		engine.eval("data=matrix(,length(" + hclustOrder + "$labels),2);" );
		engine.eval("for (i in 1:length(" + hclustOrder + "$labels)) { data[i,1] = " + hclustOrder + "$labels[i]; data[i,2] = which(" + hclustOrder + "$order==i); }");
		engine.eval("colnames(data)<-c(\"Id\", \"Order\");" );
		engine.eval("write.table(data, file = \"" + orderFile + "\", append = FALSE, quote = FALSE, sep = \"\t\", row.names=FALSE); ");
	}
	
	private void writeOrderTSVs(ScriptEngine engine, String newOrderVar, String origOrderVar, String orderFile) throws Exception {
		engine.eval("data=matrix(,length(" + origOrderVar + "),2);" );
		engine.eval("for (i in 1:length(" + origOrderVar + ")) { data[i,1] = " + origOrderVar + "[i]; data[i,2] = which(" + newOrderVar + " == " + origOrderVar + "[i]); }");
		engine.eval("colnames(data)<-c(\"Id\", \"Order\");" );
		engine.eval("write.table(data, file = \"" + orderFile + "\", append = FALSE, quote = FALSE, sep = \"\t\", row.names=FALSE); ");
	}	

}


