package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.File; 
import java.io.IOException;
import java.util.ArrayList;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.tomcat.util.http.fileupload.FileUtils;

import com.google.gson.Gson;

import mda.ngchm.guibuilder.HeatmapPropertiesManager.Classification;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/MapProperties")
public class MapProperties extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	/*******************************************************************
	 * METHOD: getProperties
	 *
	 * This method retrieves the current heatmapProperties settings and
	 * passed them to the client as a JSON string.
	 ******************************************************************/
	private void getProperties(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    try {
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        String propJSON = "{}";
	    	if (mySession == null) {
		        HeatmapPropertiesManager tempMgr = new HeatmapPropertiesManager(workingDir);
		        HeatmapPropertiesManager.Heatmap map = tempMgr.getMap();
		        propJSON = "{\"no_session\": 1, \"builder_version\": \""+ map.builder_version + "\"}";
		        tempMgr = null;
	    	} else {
		        workingDir = workingDir + "/" + mySession.getId();
	
		        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		        File propFile = new File(workingDir + "/heatmapProperties.json");
		        //Check for pre-existence of properties file.  If exists, load from properties manager
		        if (propFile.exists()) {
		        	propJSON = mgr.load();
		        } else {
			        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
			        propJSON = "{\"no_file\": 1, \"builder_version\": \""+ map.builder_version + "\"}";
		        }
	    	}
	       	response.setContentType("application/json");
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
	    } catch (Exception e) {
	    	System.out.println("ERROR Getting Properties: "+ e.getMessage());
	    } 		
		
	}

	/*******************************************************************
	 * METHOD: setProperties
	 *
	 * This method re-loads the heatmapProperties map with a new version
	 * sent by JSON from the client.
	 ******************************************************************/
	private void setProperties(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    try {
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
		    String propJSON = "{}";
	    	if (mySession == null) {
	        	propJSON = "{\"no_session\": 1}";
		       	response.setContentType("application/json");
		    	response.getWriter().write(propJSON.toString());
		    	return;
	    	}
	        workingDir = workingDir + "/" + mySession.getId();
	        if (new File(workingDir).exists()) {
		        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		        HeatmapPropertiesManager.Heatmap mapConfig = getConfigDataFromRequest(request);
	        	String doClusterTree = mapConfig.builder_config.buildProps;
				Util.logStatus("MapProperties - Begin setting properties for (" + mapConfig.chm_name + ").");
		        //Get properties and update them to the new config data
	        	mgr.setMap(mapConfig);
		        //Mark properties as "clean" for update.
	        	mgr.resetBuildConfig();
		        
			    HeatmapPropertiesManager.Heatmap map = mgr.getMap();
		        if (map.write_tiles.equals("Y")) {
				    //Delete pre-existing heatmap prior to fresh build
				    File mapDir = new File(workingDir+"/" + map.chm_name);
				    if (mapDir.exists()) {
				    	FileUtils.cleanDirectory(mapDir); 
				    	FileUtils.deleteDirectory(mapDir);
				    }
		        }

			    ProcessCovariate cov = new ProcessCovariate();
	        	for (int i = 0; i < map.classification_files.size(); i++) {
	        		HeatmapPropertiesManager.Classification currClass = map.classification_files.get(i);
	        		currClass.name = currClass.name.replaceAll("[^a-zA-Z0-9-_& ]","");
	        		if (currClass.change_type.equals("Y")) {
	        			HeatmapPropertiesManager.ColorMap cm = cov.constructDefaultColorMap(mgr, currClass, currClass.color_map.type);
	        			currClass.color_map = cm;
	        			currClass.change_type = "N";
	        		} 
				    mgr.save();
	        	}

			    //Cluster, if necessary
			    boolean clusterSuccess = false;
			    try {
				    //Add/update any treecut covariate bars
			    	if (doClusterTree.equals("T")) {
				        processTreeCutCovariates(mgr, mapConfig);
			    	}
				    if (!mapConfig.builder_config.buildCluster.equals("N")) {
				        //Re-build the heat map 
					    Cluster clusterer = new Cluster();
					    clusterer.clusterHeatMap(workingDir);
				    }
				    clusterSuccess = true;
			    } catch (Exception e) {
			    	map.builder_config.buildErrors = "ERROR occurred while clustering matrix. Please again.";
				    mgr.save();
			    }
			    
	        	if (clusterSuccess) {
				    //Re-build the heat map 
				    HeatmapBuild builder = new HeatmapBuild();
				    builder.buildHeatMap(workingDir);
			    }

				Util.logStatus("MapProperties - End setting properties for (" + mapConfig.chm_name + ").");
			    //Return edited props
	        	propJSON = mgr.load();
		       	response.setContentType("application/json");
		    	response.getWriter().write(propJSON.toString());
	        } else {
	        	propJSON = "{\"no_session\": 1}";
		       	response.setContentType("application/json");
		    	response.getWriter().write(propJSON.toString());
	        }
	        //Get config data from the request
	    	response.flushBuffer();
		} catch (Exception e) {
			response.setStatus(0);
	    	System.out.println("ERROR Setting Properties: "+ e.getMessage());
	    } finally {
	    }		
	}
	
	/*******************************************************************
	 * METHOD: getConfigDataFromRequest
	 *
	 * This method reads in the JSON string from the request and creates
	 * a Heatmap object.
	 ******************************************************************/
	public HeatmapPropertiesManager.Heatmap getConfigDataFromRequest(HttpServletRequest request) throws Exception {
		StringBuilder buffer = new StringBuilder();
	    BufferedReader reader = request.getReader();
	    String line;
	    while ((line = reader.readLine()) != null) {
	        buffer.append(line);
	    }
	    String data = buffer.toString();
	    // Parse payload into JSON Object
	    HeatmapPropertiesManager.Heatmap covarConfig = new Gson().fromJson(data, HeatmapPropertiesManager.Heatmap.class);
	    
	    return covarConfig; 
	}

	public void processTreeCutCovariates(HeatmapPropertiesManager mgr, HeatmapPropertiesManager.Heatmap mapConfig) throws Exception {
	    ProcessCovariate cov = new ProcessCovariate();
	    ArrayList<Classification> classes = mapConfig.classification_files;
	    //Remove any existing row tree cut covariate
	    for (int i=0;i<classes.size();i++) {
        	Classification cbar = classes.get(i);
            if (cbar.position.equals("row") && cbar.path.equals("treecut")) {
		    	classes.remove(i);	
            	break;
            }
        }
    	//Add a row tree cut covariate bar if cuts requested
	    if (!mapConfig.builder_config.rowCuts.equals("0")) {
        	HeatmapPropertiesManager.Classification classJsonObj = cov.constructTreeCutCovariate(mgr, mapConfig.builder_config.rowCutsLabel, "treecut", "row", "discrete", mapConfig.builder_config.rowCuts);
        	classes.add(classJsonObj);
	    }
	    //Remove any existing column tree cut covariate
        for (int i=0;i<classes.size();i++) {
        	Classification cbar = classes.get(i);
            if (cbar.position.equals("column") && cbar.path.equals("treecut")) {
		    	classes.remove(i);	
            	break;
            }
        }
	    if (!mapConfig.builder_config.colCuts.equals("0")) {
        	HeatmapPropertiesManager.Classification classJsonObj = cov.constructTreeCutCovariate(mgr, mapConfig.builder_config.colCutsLabel, "treecut", "column", "discrete", mapConfig.builder_config.colCuts);
        	classes.add(classJsonObj);	
	    }
	    mgr.save();
	    return; 
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			getProperties(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			setProperties(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}
	

}


