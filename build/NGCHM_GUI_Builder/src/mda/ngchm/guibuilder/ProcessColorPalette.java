package mda.ngchm.guibuilder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


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
	   		File paletteDir = new File(new File(getServletContext().getRealPath("/")).getParent() + File.separator +"NGCHM_color_palettes");
	   		if (!paletteDir.exists()) {
		   		File origPalettes = new File(getServletContext().getRealPath("/")+"custom_palette");
		   		createPaletteDir(origPalettes, paletteDir);
	   		}
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
	 * METHOD: createPaletteDir
	 *
	 * This method is called if the NGCHM_color_palettes (located outside
	 * of the WAR) does not exist.  It will create the directory and
	 * copy all color palettes that are within the WAR over to it. 
	 ******************************************************************/
	private static void createPaletteDir(File origPalettes , File newPalettes) throws IOException {
        if (origPalettes.isDirectory()) {
            if (!newPalettes.exists()) {
            	newPalettes.mkdir();
            }
            String[] children = origPalettes.list();
            for (int i=0; i<children.length; i++) {
            	createPaletteDir(new File(origPalettes, children[i]), new File(newPalettes, children[i]));
            }
        } else {
            InputStream in = new FileInputStream(origPalettes);
            OutputStream out = new FileOutputStream(newPalettes);
            // Copy the bits from instream to outstream
            byte[] buf = new byte[1024];
            int len;
            while ((len = in.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
            in.close();
            out.close();
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
	   		File paletteDir = new File(new File(getServletContext().getRealPath("/")).getParent() + File.separator +"NGCHM_color_palettes");
	   		String paletteFile =  paletteDir.toString() + File.separator + paletteName + "_"+ paletteType+".json";
	   		InputStream stream = new ByteArrayInputStream(paletteContent.getBytes(StandardCharsets.UTF_8));
	   		Util.uploadTSV(paletteFile, stream);
        	String propJSON = "{\"success\": 1}";
	       	response.setContentType("application/json");
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
	    	String screen = paletteType.contentEquals("matrix") ? "Format Heatmap" : "Process Covariates";
	    	ActivityLog.logActivity(request, screen, "CreateColorPalette", "Create new palette: " + paletteContent);
	    } catch (Exception e) {
	        writer.println("Error uploading color palette.");
	        writer.println("<br/> ERROR: " + e.getMessage());
	    } finally {
	        if (writer != null) {writer.close();}
	    }
	}
		
}


