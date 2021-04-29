package mda.ngchm.guibuilder;

import java.io.File;
import java.io.FileInputStream;
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

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/UploadSampleCovariate")
@MultipartConfig
public class UploadSampleCovariate extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession();
		response.setContentType("application/json;charset=UTF-8");

	    // Create path components to save the file
		final String selFile = request.getParameter("selFile");
	    String covName = "Age";
	    String colorType = "continuous";
	    String axisType = "column";
	    if (selFile.equals("SampleGleasonCovariate.txt")) {
	    	covName = "Gleason_Score";
	    	colorType = "discrete";
	    } else if (selFile.equals("SamplePsaCovariate.txt")) {
	    	covName = "PSA";
	    	colorType = "continuous";
	    } else if (selFile.equals("SampleRaceCovariate.txt")) {
	    	covName = "Race";
	    	colorType = "discrete";
	    }
	    OutputStream out = null;
	    InputStream filecontent = null;
	    final PrintWriter writer = response.getWriter();

	    try {
	    	ActivityLog.logActivity(request, "Process Covariates", "Upload Sample Covariate File", "Sample Covariate file upload: " + selFile);
	        //Create a directory using the http session ID
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	    	workingDir = workingDir + "/" + mySession.getId();

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		    String propJSON = "{}";
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
	        	mgr.resetBuildConfig();
	        	HeatmapPropertiesManager.Heatmap map = mgr.getMap();
		        //Input File
		        File sampleCovar = new File(getServletContext().getRealPath("/") + selFile);
			    filecontent = new FileInputStream(sampleCovar);
			    //Output File
	        	String covFileName = workingDir + "/"+ selFile;
			    out = new FileOutputStream(new File(covFileName));
			    //Read In-Write Out
		        int read = 0;
		        final byte[] bytes = new byte[1024];
		        while ((read = filecontent.read(bytes)) != -1) {
		            out.write(bytes, 0, read);
		        }
		        out.close();
	
			    ProcessCovariate cov = new ProcessCovariate();
			    if (map.builder_config.isTransposed.contentEquals("Y")) { axisType = "row";}
	        	HeatmapPropertiesManager.Classification classJsonObj = cov.constructDefaultCovariate(mgr, selFile, covName, covFileName, axisType, colorType, "0");
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


