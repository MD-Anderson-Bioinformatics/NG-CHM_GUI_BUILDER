package mda.ngchm.guibuilder;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.servlet.http.Part;

import mda.ngchm.guibuilder.HeatmapPropertiesManager.BuilderConfig;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/RemoveCovariate")
@MultipartConfig
public class RemoveCovariate extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession();
		response.setContentType("application/json;charset=UTF-8");

	    // Create path components to save the file
	    final String covName = request.getParameter("remCovName");
	    final String axisType = request.getParameter("remAxisType");
	  
	    OutputStream out = null;
	    InputStream filecontent = null;
	    final PrintWriter writer = response.getWriter();

	    try {
	        //Create a directory using the http session ID
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	    	workingDir = workingDir + "/" + mySession.getId();

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
	        }
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
        	String covFileName = workingDir + "/covariate_"+ axisType+"_"+covName + ".txt";
        	File covFile = new File(covFileName);
        	if (covFile.exists()) {
        		covFile.delete();
        	}
        	int indexToRem = 0;
        	for (int i=0;i < map.classification_files.size(); i++) {
        		HeatmapPropertiesManager.Classification currClass = map.classification_files.get(i);
        		if (currClass.name.equals(covName) && (currClass.position.equals(axisType))) {
        			indexToRem = i;
        		}
        	}
        	map.classification_files.remove(indexToRem);
        	mgr.save();
	    } catch (Exception e) {
	        writer.println("Error uploading covariate.");
	        writer.println("<br/> ERROR: " + e.getMessage());

	    } finally {
	        if (out != null) {
	            out.close();
	        }
	        if (filecontent != null) {
	            filecontent.close();
	        }
	        if (writer != null) {
	            writer.close();
	        }
	    }
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
}


