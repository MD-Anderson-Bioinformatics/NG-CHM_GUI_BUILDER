package mda.ngchm.guibuilder;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.servlet.http.Part;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/UploadCovariate")
@MultipartConfig
public class UploadCovariate extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static Set<String> EXCEL_FILES = new HashSet<String>(Arrays.asList("XLS","XLSX","XLSM"));
       
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession();
		response.setContentType("application/json;charset=UTF-8");

	    // Create path components to save the file
	    final Part filePart = request.getPart("covar");
	    final String covName = request.getParameter("covName");
	    final String colorType = request.getParameter("colorType");
	    final String axisType = request.getParameter("axisType");
	  
	    OutputStream out = null;
	    InputStream filecontent = null;
	    final PrintWriter writer = response.getWriter();

	    try {
	        //Create a directory using the http session ID
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	    	workingDir = workingDir + "/" + mySession.getId();

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		    String propJSON = "{}";
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
		        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	        	String covFileName = workingDir + "/covariate_"+ axisType+"_"+covName + ".txt";
	        	File covFile = new File(covFileName);
	        	if (covFile.exists()) {
	        		covFile.delete();
	        	}
	    	    String inFile = filePart.getSubmittedFileName();
	    	    String inType = inFile.substring(inFile.lastIndexOf(".")+1, inFile.length()).toUpperCase();
		        filecontent = filePart.getInputStream();
			    if (EXCEL_FILES.contains(inType)) {
			        Util.uploadXLS(covFileName, filecontent);
			    } else if ("CSV".equals(inType)) {
			        Util.uploadCSV(covFileName, filecontent);
			    } else {
			        Util.uploadTSV(covFileName, filecontent);
			    }
			    ProcessCovariate cov = new ProcessCovariate();
	        	HeatmapPropertiesManager.Classification classJsonObj = cov.constructDefaultCovariate(mgr, covName, covFileName, axisType, colorType);
	        	map.classification_files.add(classJsonObj);	 
		        //Mark properties as "clean" for update.
	        	map.builder_config.buildProps = "N";
			    mgr.save();
		        
		        //Re-build the heat map 
			    HeatmapBuild builder = new HeatmapBuild();
			    builder.buildHeatMap(workingDir);
			    //Return edited props
	        	propJSON = mgr.load();
	        } else {
	        	propJSON = "{\"no_file\": 1}";
	        }
	       	response.setContentType("application/json");
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
	    } catch (Exception e) {
	        writer.println("Error uploading covariate.");
	        writer.println("<br/> ERROR: " + e.getMessage());

	    } finally {
	        if (out != null) {out.close();out = null;}
	        if (filecontent != null) {filecontent.close(); filecontent = null;}
	        if (writer != null) {writer.close();}
	    }
	}

protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
}


