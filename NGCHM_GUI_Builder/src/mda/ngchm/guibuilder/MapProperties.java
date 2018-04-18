package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.File; 
import java.io.IOException;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.google.gson.Gson;

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
			System.out.println("START Getting Properties: " + new Date()); 
			
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        String propJSON = "{}";
	    	if (mySession == null) {
		        propJSON = "{\"no_session\": 1}";
	    	} else {
		        workingDir = workingDir + "/" + mySession.getId();
	
		        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		        File propFile = new File(workingDir + "/heatmapProperties.json");
		        //Check for pre-existence of properties file.  If exists, load from properties manager
		        if (propFile.exists()) {
		        	propJSON = mgr.load();
		        } else {
		        	propJSON = "{\"nofile\": 1}";
		        }
	    	}
	       	response.setContentType("application/json");
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
			
			System.out.println("END Getting Properties: " + new Date()); 
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
			System.out.println("START Setting Properties: " + new Date()); 
			
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();
	        //Get config data from the request
	        HeatmapPropertiesManager.Heatmap mapConfig = getConfigDataFromRequest(request);
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
	        //Get properties and update them to the new config data
        	mgr.setMap(mapConfig);
	        //Mark properties as "clean" for update.
	        mapConfig.builder_config.buildProps = "N";
		    mgr.save();
		    //Cluster, if necessary
		    if (!mapConfig.builder_config.buildCluster.equals("N")) {
		        //Re-build the heat map 
			    Cluster clusterer = new Cluster();
			    clusterer.clusterHeatMap(workingDir);
		    }
	        //Re-build the heat map 
		    HeatmapBuild builder = new HeatmapBuild();
		    builder.buildHeatMap(workingDir);

		    //Return edited props
		    String propJSON = "{}";
        	propJSON = mgr.load();
	       	response.setContentType("application/json");
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
		    
			System.out.println("END Setting Properties: " + new Date()); 
		} catch (Exception e) {
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
	private HeatmapPropertiesManager.Heatmap getConfigDataFromRequest(HttpServletRequest request) throws Exception {
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


