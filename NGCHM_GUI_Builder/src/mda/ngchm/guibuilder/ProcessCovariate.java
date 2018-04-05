package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.google.gson.Gson;

import mda.ngchm.datagenerator.HeatmapDataGenerator;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/ProcessCovariate")
public class ProcessCovariate extends HttpServlet {
	private static final long serialVersionUID = 1L;
    public static final String[] defaultColors = {"#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"};
	public static Set<String> NA_VALUES = new HashSet<String>(Arrays.asList("null","NA","N/A","-","?","NAN","NaN","Na","na","n/a",""," "));
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			processCovariate(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}
	
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}

	private void processCovariate(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    final PrintWriter writer = response.getWriter();

	    try {
			System.out.println("START Processing Covariates: " + new Date()); 
			
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();

	        HeatmapPropertiesManager.Heatmap covarConfig = getCovarConfigData(request);

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
	        }
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();

		    //Remove any existing covariate files as we are putting edited preferences on the map
		    map.classification_files.removeAll(map.classification_files);
	        for (int i=0;i<covarConfig.classification_files.size();i++) {
	        	HeatmapPropertiesManager.Classification nextClass = covarConfig.classification_files.get(i);
	        	map.classification_files.add(nextClass);	    
	        }
		    mgr.save();

		    //Call HeatmapDataGenerator to generate final heat map .ngchm file
	//	    String genArgs[] = new String[] {propFile.getAbsolutePath(), "-NGCHM"};
	//		String errMsg = HeatmapDataGenerator.processHeatMap(genArgs);
	//		writer.println("MapBuildDir/" + mySession.getId() + "/" + map.chm_name + "|" + map.chm_name + ".ngchm");
			System.out.println("END Processing Covariates: " + new Date()); 
		} catch (Exception e) {
	        writer.println("Error creating initial heat map properties.");
	        writer.println("<br/> ERROR: " + e.getMessage());
	    } finally {
	        if (writer != null) {
	            writer.close();
	        }
	    }		
	}
	
	private HeatmapPropertiesManager.Heatmap getCovarConfigData(HttpServletRequest request) throws Exception {
		StringBuilder buffer = new StringBuilder();
	    BufferedReader reader = request.getReader();
	    String line;
	    while ((line = reader.readLine()) != null) {
	        buffer.append(line);
	    }
	    String data = buffer.toString();
	    // Parse payload into JSON Object
	    HeatmapPropertiesManager.Heatmap covarConfig = new Gson().fromJson(data, HeatmapPropertiesManager.Heatmap.class);
	    
	    return covarConfig; 
	}


	public static boolean isNumeric(String str)
	{
		boolean isNbr = str.matches("-?\\d+(\\.\\d+)?");
		if ((!isNbr) && (NA_VALUES.contains(str))) {
			isNbr = true;
		}
		return isNbr;  
	}

	/*******************************************************************
	 * METHOD: constructDefaultCovariate
	 *
	 * This method constructs a default covariate given an input covariate
	 * file.
	 ******************************************************************/
	public HeatmapPropertiesManager.Classification constructDefaultCovariate(HeatmapPropertiesManager mgr, String covName, String covFilePath, String covPos) throws Exception {
		return constructDefaultCovariate(mgr, covName, covFilePath, covPos, null);
	}
	
	public HeatmapPropertiesManager.Classification constructDefaultCovariate(HeatmapPropertiesManager mgr, String covName, String covFilePath, String covPos, String colorType) throws Exception {
	    String covariateFile = covFilePath;
		BufferedReader reader = new BufferedReader(new FileReader(covariateFile));
		HeatmapPropertiesManager.Classification covar = mgr.new Classification(covName, covFilePath, covPos, "Y", "20", "color_plot", "#000000", "#FFFFFF", "0", "99", null);
		try {
			String line = reader.readLine();
			ArrayList<String> covBreaks = new ArrayList<String>();
			Boolean allNumeric = true;
			float highVal = -99999;
			float lowVal = 99999;
			while (line != null) {
				String toks[] = line.split("\t");
				if (toks.length > 1) {
					String cat = toks[1];
					if (allNumeric) {
						if (!isNumeric(cat)) {
							allNumeric = false;
						} else {
							if (!NA_VALUES.contains(cat)) {
								float catVal = Float.valueOf(cat);
								if (catVal > highVal) {
									highVal = catVal;
								}
								if (catVal < lowVal) {
									lowVal = catVal;
								}
							}
						}
					}
					if (!covBreaks.contains(cat)) {
					    covBreaks.add(cat);
					}
				}
				line = reader.readLine(); 
			}
			String type = colorType;
			if (type == null) {
				type = "discrete";
				if (allNumeric && (covBreaks.size() > 5)) {
					type = "continuous";
				}
			}
			if (type.equals("continuous")) {
				covBreaks.clear();
				covar.low_bound = Float.toString(lowVal);
				covar.high_bound = Float.toString(highVal);
				covBreaks.add(Float.toString(lowVal));
				covBreaks.add(Float.toString(highVal));
			}
			ArrayList<String> covColors = getDefaultClassColors(covBreaks, type);
			HeatmapPropertiesManager.ColorMap cm = mgr.new ColorMap(type,covColors, covBreaks,"#000000");
			covar.color_map = cm;
		} catch (Exception e) {
			// do something here
			System.out.println(e.toString());
		} finally {
			reader.close();
		}
		return covar;
	}
	
	
    public static ArrayList<String> getDefaultClassColors(ArrayList<String> categories, String type) throws Exception {
        ArrayList<String> colors = new ArrayList<String>();
    	if (type.equals("continuous")) {
    		colors.add("#FFFFFF");
    		colors.add("#FF0000");
        } else {           
        	for (int i=0;i<categories.size();i++) {
        		if (i < defaultColors.length -1) {
        			colors.add(defaultColors[i]);
        		} else {
        			//whoops - ran out of colors - just use the last one.
        			colors.add(defaultColors[defaultColors.length-1]);
        		}
        	}
        }
        return colors;
    }

}


