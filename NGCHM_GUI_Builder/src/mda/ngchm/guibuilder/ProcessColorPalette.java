package mda.ngchm.guibuilder;

import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileReader;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/ProcessColorPalette")
@MultipartConfig
public class ProcessColorPalette extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
	/*******************************************************************
	 * METHOD: doGet
	 *
	 * This method is called from the web app retrieve a list of all
	 * of the palette files located on the server.  They are returned
	 * to the client as a JSON Array
	 ******************************************************************/
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("application/json;charset=UTF-8");

	    try {
	        //Create a directory using the http session ID
	   		File paletteDir = new File(getServletContext().getRealPath("/")+"custom_palette");
			List<File> fileList = new ArrayList<File>();
			getPaletteFiles(paletteDir, fileList);
			String propJSON = getPaletteContents(fileList);
	       	response.setContentType("application/json");
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
	    } catch (Exception e) {
	    	//do something?
	    } finally {
	    	//do something?
	    }
	}
	
	/*******************************************************************
	 * METHOD: getPaletteFiles
	 *
	 * This method gets all existing palette files and returns
	 * them as a File[] list object. 
	 ******************************************************************/
	public static void getPaletteFiles(File dir, List<File> fileList) {
		try {
			File[] files = dir.listFiles();
			for (File file : files) {
				fileList.add(file);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	/*******************************************************************
	 * METHOD: writePaletteJSON
	 *
	 * This method iterates thru all of the files in the heatmap directory
	 * and adds them to the new zip archive.  The contents of the 
	 * mapConfig.JSON file are replaced with config text passed to the 
	 * servlet.
	 ******************************************************************/
	public static String getPaletteContents(List<File> fileList) {
		String allPalettes = "[";
		try {
			for (File file : fileList) {
				BufferedReader in = new BufferedReader(new FileReader(file));
				try {
					String paletteStr = in.readLine();
					allPalettes += paletteStr + ",";
					in.close();
				} catch (Exception e) {
					// do something
				} finally {
					in.close();
					in = null;
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		allPalettes = allPalettes.substring(0,allPalettes.length()-1) + "]";
		return allPalettes;
	}

	/*******************************************************************
	 * METHOD: doPost
	 *
	 * This method is called from the web app save a user created color
	 * palette.  paletteName (string), paletteContent (JSON), and 
	 * paletteType (string) are form data inputs to the servlet. A palette
	 * file using the name is created and the JSON palette contents are written 
	 * out to the server in that file.
	 ******************************************************************/
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("application/json;charset=UTF-8");

	    // Create path components to save the file
	    final String paletteName = request.getParameter("newPaletteName");
	    final String paletteContent = request.getParameter("paletteContent");
	    final String paletteType = request.getParameter("paletteType");
	    final PrintWriter writer = response.getWriter();
	    
	    try {
	        //Create a directory using the http session ID
	   		String paletteFile =  getServletContext().getRealPath("/")+"custom_palette" + "\\" + paletteName + "_"+ paletteType+".json";
	   		InputStream stream = new ByteArrayInputStream(paletteContent.getBytes(StandardCharsets.UTF_8));
	   		Util.uploadTSV(paletteFile, stream);
        	String propJSON = "{\"sucess\": 1}";
	       	response.setContentType("application/json");
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
	    } catch (Exception e) {
	        writer.println("Error uploading color palette.");
	        writer.println("<br/> ERROR: " + e.getMessage());
	    } finally {
	        if (writer != null) {writer.close();}
	    }
	}
		
}


