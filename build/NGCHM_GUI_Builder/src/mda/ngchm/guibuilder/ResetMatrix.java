package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Servlet implementation class CorrectMatrix
 */
@WebServlet("/ResetMatrix")
public class ResetMatrix extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    final PrintWriter writer = response.getWriter();
	    BufferedReader rdr = null;
	    BufferedWriter out = null;

	    try {
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		    String propJSON = "{}";
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        if (propFile.exists()) {
		        //Get properties and update them to the new config data
	        	MapProperties mp = new MapProperties();
		        HeatmapPropertiesManager.Heatmap mapConfig = mp.getConfigDataFromRequest(request);
	        	mgr.setMap(mapConfig);
	        	String matrixFile = workingDir  + "/workingMatrix.txt";
			    String originalFile = workingDir + "/workingMatrix.txt.sav";
			    Util.backupWorking(matrixFile);
			    rdr = new BufferedReader(new FileReader(originalFile));
			    out = new BufferedWriter(new FileWriter(matrixFile));
			    String line = rdr.readLine(); //Just write the header
				while (line != null ){
					out.write(line + "\n");
					line = rdr.readLine();
				}	
				rdr.close();
				out.close();
			    HeatmapPropertiesManager.Heatmap map = mgr.getMap();
				if (map.builder_config.isTransposed.contentEquals("Y")) { 
					map.builder_config.isTransposed = "N";
			    	for (int i=0;i<map.classification_files.size();i++) {
			    		map.classification_files.get(i).position = map.classification_files.get(i).position.contentEquals("row") ? "column" : "row";
			    	}
					mgr.save();
				} 
				propJSON = mgr.load();
	        } else {
	        	propJSON = "{\"no_file\": 1}";
	        }
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
	    } catch (Exception e) {
	        writer.println("Error correcting matrix.");
	        writer.println("<br/> ERROR: " + e.getMessage());

	    } finally {
	        if (writer != null) {
	            writer.close();
	        }
	        if (rdr != null) {
	        	rdr.close();
	        }
	        if (out != null) {
	        	out.close();
	        }
	    }
	}
	

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
}
