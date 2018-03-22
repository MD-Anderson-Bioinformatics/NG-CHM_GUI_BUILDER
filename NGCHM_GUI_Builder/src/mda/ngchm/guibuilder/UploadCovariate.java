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

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/UploadCovariate")
@MultipartConfig
public class UploadCovariate extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
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
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
	        }
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	        int existingClassCtr = map.classification_files.size();	
	        existingClassCtr++;
        	String covFileName = workingDir + "/covariate_"+ existingClassCtr + ".txt";
	    	
		    out = new FileOutputStream(new File(covFileName));
	        filecontent = filePart.getInputStream();
	        int read = 0;
	        final byte[] bytes = new byte[1024];

	        while ((read = filecontent.read(bytes)) != -1) {
	            out.write(bytes, 0, read);
	        }
	        out.close();

		    ProcessCovariate cov = new ProcessCovariate();
        	HeatmapPropertiesManager.Classification classJsonObj = cov.constructDefaultCovariate(mgr, covName, covFileName, axisType, colorType);
        	map.classification_files.add(classJsonObj);	 
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

