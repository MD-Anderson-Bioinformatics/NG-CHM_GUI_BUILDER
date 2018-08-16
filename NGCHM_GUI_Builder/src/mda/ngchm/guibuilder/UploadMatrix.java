package mda.ngchm.guibuilder;

import java.io.File;
import java.io.FileInputStream;
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

import org.apache.tomcat.util.http.fileupload.FileUtils;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/UploadMatrix")
@MultipartConfig
public class UploadMatrix extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static Set<String> EXCEL_FILES = new HashSet<String>(Arrays.asList("XLS","XLSX","XLSM"));
       
	/*******************************************************************
	 * METHOD: doGet
	 *
	 * This method is called from the web app to upload the sample matrix 
	 * file.
	 ******************************************************************/
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("application/json;charset=UTF-8");
	    OutputStream out = null;
    	File sampleMatrix = new File(getServletContext().getRealPath("/") + "SampleMatrix.txt");
	    FileInputStream filecontent = new FileInputStream(sampleMatrix);
	    final PrintWriter writer = response.getWriter();

	    try {
    		uploadMatrixFile(request, writer, filecontent, "TXT");
	    } catch (Exception e) {
	        writer.println("Error uploading sample matrix.");
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

	/*******************************************************************
	 * METHOD: doPost
	 *
	 * This method is called from the web app to upload a matrix file 
	 * selected by the user.
	 ******************************************************************/
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("application/json;charset=UTF-8");
	    final Part filePart = request.getPart("matrix");
	    String inFile = filePart.getSubmittedFileName();
	    String inType = inFile.substring(inFile.lastIndexOf(".")+1, inFile.length()).toUpperCase();
	    InputStream filecontent = filePart.getInputStream();
	    final PrintWriter writer = response.getWriter();

	    try {
	    	if (filePart.getSize() > 0) {
	    		uploadMatrixFile(request, writer, filecontent, inType);
	    	} else {
		        writer.println("NOFILE");
	    	}
	    } catch (Exception e) {
	        writer.println("Error uploading matrix.");
	        writer.println("<br/> ERROR: " + e.getMessage());
	    } finally {
	        if (filecontent != null) {
	            filecontent.close();
	        }
	        if (writer != null) {
	            writer.close();
	        }
	    }	
	}
	
	/*******************************************************************
	 * METHOD: uploadMatrixFile
	 *
	 * This method uploads a matrix file to the session directory as 
	 * OriginalMatrix.txt.  This file can be the sample text file OR a 
	 * user selected tab separated, comma separated, or excel file.
	 ******************************************************************/
	private void uploadMatrixFile(HttpServletRequest request, PrintWriter writer, InputStream filecontent, String fileType) throws Exception {
		HttpSession mySession = request.getSession();
		String jsonMatrixCorner = "no data";
	    final String fileName = "originalMatrix.txt";
        //Create a directory using the http session ID
    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
    	workingDir = workingDir + "/" + mySession.getId();
	    File theDir = new File(workingDir);
		if (!theDir.mkdir()) {
			FileUtils.cleanDirectory(theDir);
		}
	    String matrixFile = workingDir + "/" + fileName;
	    if (EXCEL_FILES.contains(fileType)) {
		    Util.uploadXLS(matrixFile, filecontent);
	    } else if ("CSV".equals(fileType)) {
		    Util.uploadCSV(matrixFile, filecontent);
	    } else {
		    Util.uploadTSV(matrixFile, filecontent);
	    }
        jsonMatrixCorner = Util.getTopOfMatrix(matrixFile, 21, 20);
	    writer.println(jsonMatrixCorner);
	}

}


