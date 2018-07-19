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
import javax.servlet.http.Part;

import org.apache.tomcat.util.http.fileupload.FileUtils;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/UploadMatrix")
@MultipartConfig
public class UploadMatrix extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("application/json;charset=UTF-8");
	    OutputStream out = null;
    	File sampleMatrix = new File(getServletContext().getRealPath("/") + "SampleMatrix.txt");
	    FileInputStream filecontent = new FileInputStream(sampleMatrix);
	    final PrintWriter writer = response.getWriter();

	    try {
    		uploadMatrixFile(request, writer, filecontent, out);
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

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("application/json;charset=UTF-8");
	    final Part filePart = request.getPart("matrix");
	    OutputStream out = null;
	    InputStream filecontent = filePart.getInputStream();
	    final PrintWriter writer = response.getWriter();

	    try {
	    	if (filePart.getSize() > 0) {
	    		uploadMatrixFile(request, writer, filecontent, out);
	    	} else {
		        writer.println("NOFILE");
	    	}
	    } catch (Exception e) {
	        writer.println("Error uploading matrix.");
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
	
	private void uploadMatrixFile(HttpServletRequest request, PrintWriter writer, InputStream filecontent, OutputStream out) throws Exception {
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
	    out = new FileOutputStream(new File(matrixFile));

        int read = 0;
        final byte[] bytes = new byte[1024];

        while ((read = filecontent.read(bytes)) != -1) {
            out.write(bytes, 0, read);
        }
        jsonMatrixCorner = Util.getTopOfMatrix(matrixFile, 21, 20);
	    writer.println(jsonMatrixCorner);
	    out.close();
	}


	
}


