package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.apache.tomcat.util.http.fileupload.FileUtils;

import com.google.gson.Gson;
import com.google.gson.internal.LinkedTreeMap;

import mda.ngchm.datagenerator.HeatmapDataGenerator;

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

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
	        mgr.load();
	        mgr.resetBuildConfig();
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	        if (map.matrix_files.get(0).color_map != null) {
	        	map.matrix_files.get(0).color_map = null;
		        mgr.save();
	        }
		    File mapDir = new File(workingDir+"/" + map.chm_name);
		    if (mapDir.exists()) {
		    	FileUtils.cleanDirectory(mapDir); 
		    	FileUtils.deleteDirectory(mapDir);
		    }
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
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
			String propsPath = workingDir + "/heatmapProperties.json";

	        File propFile = new File(propsPath);
	        String errMsg = null;
	        mgr.load();
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
			Util.logStatus("Begin Heat Map Build chm(" + map.chm_name + ").");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
			    //Call HeatmapDataGenerator to generate final heat map .ngchm file
			    String genArgs[] = null;
	        	if (map.full_pdf.equals("N")) {
	        		genArgs = new String[] {propsPath, "-NGCHM"};
	        	} else {
	        		genArgs = new String[] {propsPath, "-NGCHM", "-FULLPDF"};
	        	}
				errMsg = HeatmapDataGenerator.processHeatMap(genArgs);
	        }
	        
	        //Version and rename the .ngchm file (fixes intractable server/browser caching problem)
	        map.builder_config.ngchmVersion++;
		    File ngchmFile = new File(workingDir+"/"+ map.chm_name+"/"+ map.chm_name+".ngchm");
		    if (ngchmFile.exists()) {
			    File ngchmFileNew = new File(workingDir+"/"+ map.chm_name+"/"+ map.chm_name+map.builder_config.ngchmVersion+".ngchm");
		    	ngchmFile.renameTo(ngchmFileNew);
		    }
	        if (!errMsg.contains("BUILD ERROR")) {
			    //If the map has not been built before, save the auto-generated break points to the properties.
		        if (map.matrix_files.get(0).color_map == null) {
		        	HeatmapPropertiesManager.ColorMap theMap = setDefaultMatrixColors(workingDir, map);
		        	map.matrix_files.get(0).color_map = theMap;
		        	map.matrix_files.get(0).original_thresholds = theMap.thresholds;
		        }
	        }
	        
	        if (errMsg != "") {
		        if (errMsg.contains("BUILD ERROR")) {
				    map.builder_config.buildErrors = errMsg;
		        } else {
					String toks[] = errMsg.split("\n");
					for (int i=0;i<toks.length;i++) {
						map.builder_config.buildWarnings.add(toks[i]);
					}
		        }
	        }
	        map.read_matrices = "Y";
	        map.write_tiles = "Y";
	        map.full_pdf = "N";
		    map.builder_config.buildCluster = "N";
		    map.builder_config.clusterStatus = 0;
    		mgr.save();
			Util.logStatus("End Heat Map Build chm(" + map.chm_name + ").");
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


