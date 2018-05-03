package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.google.gson.Gson;
import com.google.gson.internal.LinkedTreeMap;

import mda.ngchm.datagenerator.HeatmapDataGenerator;
import mda.ngchm.guibuilder.HeatmapPropertiesManager.ColorMap;

/**
 * Servlet implementation class to build a heatmap using the HeatmapDataGenerator
 */
@WebServlet("/HeatmapBuild")
public class HeatmapBuild extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
	    final PrintWriter writer = response.getWriter();

	    try {
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();
	    	buildHeatMap(workingDir);
	    } catch (Exception e) {
	        writer.println("Error executing HeatmapDataGenerator to build Heat Map.");
	        writer.println("<br/> ERROR: " + e.getMessage());
	    } finally {
	        if (writer != null) {
	            writer.close();
	        }
	    }			
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
	/*******************************************************************
	 * METHOD: buildHeatMap
	 *
	 * This method calls the heatmapDataGenerator in the NGCHM project 
	 * (viewer code) and builds a heatmap into the session directory.
	 ******************************************************************/
	public void buildHeatMap(String workingDir) throws Exception {
	    try {
			System.out.println("START Build Heatmap: " + new Date()); 

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
			String propsPath = workingDir + "/heatmapProperties.json";

	        File propFile = new File(propsPath);
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
			    //Call HeatmapDataGenerator to generate final heat map .ngchm file
			    String genArgs[] = new String[] {propsPath, "-NGCHM"};
				String errMsg = HeatmapDataGenerator.processHeatMap(genArgs);
	        }
	        mgr.load();
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	        
	        //If the map has not been built before, save the auto-generated break points to the properties.
	        if (map.matrix_files.get(0).color_map == null) {
	        	HeatmapPropertiesManager.ColorMap theMap = setDefaultMatrixColors(workingDir, map);
	        	map.matrix_files.get(0).color_map = theMap;
	        	mgr.save();
	        }	
	        
			System.out.println("END Build Heatmap: " + new Date()); 
	    } catch (Exception e) {
	    	throw e;
	    }			
	}
	
	
	/*******************************************************************
	 * METHOD: setDefaultMatrixColors
	 *
	 * This method retrieves the color map created for the matrix
	 * by the HeatmapDataGenerator process (including calculated
	 * thresholds) and places that data on the heatmapProperties.json.
	 ******************************************************************/
	private HeatmapPropertiesManager.ColorMap setDefaultMatrixColors(String directory, HeatmapPropertiesManager.Heatmap map) throws Exception {
		HeatmapPropertiesManager.ColorMap theMap = null;
		String propFile = directory + "/"+map.chm_name+"/mapConfig.json";
		BufferedReader in = new BufferedReader(new FileReader(propFile));
		try {
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(directory);
			Gson gson = new Gson();
			String jsonStr = in.readLine();
			LinkedTreeMap<?, ?> result = gson.fromJson(jsonStr , LinkedTreeMap.class);
			LinkedTreeMap<?, ?> dc = (LinkedTreeMap<?, ?>) result.get("data_configuration");
			LinkedTreeMap<?, ?> mi = (LinkedTreeMap<?, ?>) dc.get("map_information");
			LinkedTreeMap<?, ?> dl = (LinkedTreeMap<?, ?>) mi.get("data_layer");
			LinkedTreeMap<?, ?> dl1 = (LinkedTreeMap<?, ?>) dl.get("dl1");
			LinkedTreeMap<?, ?> cmap = (LinkedTreeMap<?, ?>) dl1.get("color_map");
			String type = (String) cmap.get("type");
			@SuppressWarnings("unchecked")
			ArrayList<String> colors = (ArrayList<String>) cmap.get("colors");
			@SuppressWarnings("unchecked")
			ArrayList<String> thresholds = (ArrayList<String>) cmap.get("thresholds");
			String missing = (String) cmap.get("missing");
			theMap = mgr.new ColorMap(type,colors, thresholds,missing);
		} finally {
			in.close();
			in = null;
		}
		return theMap;
	}

	
}


