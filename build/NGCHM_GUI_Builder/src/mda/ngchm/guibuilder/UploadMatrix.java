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

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

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
		HttpSession mySession = request.getSession();
       //Create a directory using the http session ID
    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
    	workingDir = workingDir + "/" + mySession.getId();
	    File theDir = new File(workingDir);
		if (!theDir.mkdir()) {
			FileUtils.cleanDirectory(theDir);
		}

	    try {
	    	ActivityLog.logActivity(request, "Select Matrix", "Upload Sample Matrix File", "File: SampleMatrix.txt");
    		uploadMatrixFile(workingDir, writer, filecontent, "TXT");
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
	 *
	 * It is also called by TransferData.js to upload all files for a
	 * new NG-CHM being created via the API.
	 *
	 ******************************************************************/
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
	    response.setContentType("application/json;charset=UTF-8");
	    final PrintWriter writer = response.getWriter();
	    HttpSession mySession = request.getSession();

	    //Create a directory using the http session ID
	    String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	    workingDir = workingDir + "/" + mySession.getId();
	    File theDir = new File(workingDir);
	    if (!theDir.mkdir()) {
		FileUtils.cleanDirectory(theDir);
	    }

	    try {
		final Part matrixPart = request.getPart ("matrix");
		if (matrixPart == null || matrixPart.getSize() == 0) {
		    writer.println("NOFILE");
		} else {
		    extractDataFile (request, workingDir, "originalMatrix.txt", matrixPart, writer);
		    extractDataFile (request, workingDir, "rowOrder.txt", request.getPart ("row-order"), writer);
		    extractDataFile (request, workingDir, "rowDendro.txt", request.getPart ("row-dendro"), writer);
		    extractDataFile (request, workingDir, "colOrder.txt", request.getPart ("col-order"), writer);
		    extractDataFile (request, workingDir, "colDendro.txt", request.getPart ("col-dendro"), writer);

		    // Extract any column covariate files.  Stop at first potential covariate that doesn't exist.
		    Integer idx = 0;
		    Part filePart = request.getPart ("col-cov-" + idx);
		    while (filePart != null) {
			extractDataFile (request, workingDir, "col-cov-" + idx + ".txt", filePart, writer);
			idx++;
			filePart = request.getPart ("col-cov-" + idx);
		    }

		    // Extract any row covariate files.  Stop at first potential covariate that doesn't exist.
		    idx = 0;
		    filePart = request.getPart ("row-cov-" + idx);
		    while (filePart != null) {
			extractDataFile (request, workingDir, "row-cov-" + idx + ".txt", filePart, writer);
			idx++;
			filePart = request.getPart ("row-cov-" + idx);
		    }

		    // Output the top-left corner of the originalMatrix.txt file.
		    String jsonMatrixCorner = Util.getTopOfMatrix(workingDir + "/originalMatrix.txt", 21, 20);
		    writer.println(jsonMatrixCorner);
		}
	    } catch (Exception e) {
		writer.println("<br/> ERROR: " + e.getMessage());
	    }
	    writer.close();
	}

	// Extract filePart, if it exists, from the request into workingDir/fileName.
	protected void extractDataFile (HttpServletRequest request, String workingDir, String fileName, Part filePart, PrintWriter writer) throws ServletException, IOException, Exception {
	    if (filePart != null) {
		try {
		    //Throttle file upload at 750mb
		    String inFile = filePart.getSubmittedFileName();
		    if (filePart.getSize() > 780000000) {
			writer.println("ERROR: This data file (" + inFile + ") exceeds the maximum 750mb file size for the builder.");
		    } else {
			ActivityLog.logActivity(request, "Select Matrix", "Upload " + fileName, "File: " + inFile + " Size: " + filePart.getSize());
			if (filePart.getSize() > 0) {
			    InputStream fileContent = filePart.getInputStream();
			    String inType = inFile.substring(inFile.lastIndexOf(".")+1, inFile.length()).toUpperCase();
			    uploadDataFile(workingDir + "/" + fileName, fileContent, inType);
			    fileContent.close();
			}
		    }
		} catch (Exception e) {
		    writer.println("ERROR uploading datafile: " + fileName);
		    throw e;
		}
	    }
	}

	/*******************************************************************
	 * METHOD: uploadMatrixFile
	 *
	 * This method uploads a matrix file to the session directory as 
	 * OriginalMatrix.txt.  This file can be the sample text file OR a 
	 * user selected tab separated, comma separated, or excel file.
	 *******************************************************************/
	public void uploadMatrixFile(String workingDir, PrintWriter writer, InputStream fileContent, String fileType) throws Exception {
	    String jsonMatrixCorner = "no data";
	    final String matrixFile = workingDir + "/originalMatrix.txt";
	    uploadDataFile (matrixFile, fileContent, fileType);
	    jsonMatrixCorner = Util.getTopOfMatrix(matrixFile, 21, 20);
	    if (writer != null) {
		writer.println(jsonMatrixCorner);
	    }
	}

	// Upload to fileName the contents of fileContent, which is of type fileType.
	// Excel and CSV files are converted to TSV files.
	// Other files are assumed to be TSV files.
	public void uploadDataFile(String fileName, InputStream fileContent, String fileType) throws Exception {
	    if (EXCEL_FILES.contains(fileType)) {
		    Util.uploadXLS(fileName, fileContent);
	    } else if ("CSV".equals(fileType)) {
		    Util.uploadCSV(fileName, fileContent);
	    } else {
		    Util.uploadTSV(fileName, fileContent);
	    }
	}

}
