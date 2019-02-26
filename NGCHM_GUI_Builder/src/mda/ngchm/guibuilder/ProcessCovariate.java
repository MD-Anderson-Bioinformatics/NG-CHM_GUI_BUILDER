package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Methods for processing covariate information
 */
public class ProcessCovariate {
    public static final String[] defaultColors = {"#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"};
	private static Set<String> NA_VALUES = new HashSet<String>(Arrays.asList("null","NA","N/A","-","?","NAN","NaN","Na","na","n/a",""," "));

	/*******************************************************************
	 * METHOD: constructTreeCutCovariate
	 *
	 * This method constructs a tree cut covariate bar when the user
	 * adds on during the clustering step.
	 ******************************************************************/
	public HeatmapPropertiesManager.Classification constructTreeCutCovariate(HeatmapPropertiesManager mgr, String covName, String covFilePath, String covPos, String colorType, String treeCuts) throws Exception {
		HeatmapPropertiesManager.Classification covar = mgr.new Classification(covName, "Generated Cluster-Based File", covFilePath, covPos, "Y", "15", "color_plot", "#000000", "#FFFFFF", "0", "99", null, treeCuts);
		try {
			String type = colorType;
			int cutNbr = Integer.parseInt(treeCuts);		
			ArrayList<String> covBreaks = new ArrayList<String>();
			for (int i=0; i<cutNbr; i++) {
				String cat = "Cluster"+(i+1);
			    covBreaks.add(cat);
			}
			ArrayList<String> covColors = getDefaultClassColors(covBreaks, type);
			HeatmapPropertiesManager.ColorMap cm = mgr.new ColorMap(type,covColors, covBreaks,"#B3B3B3");
			covar.color_map = cm;
		} catch (Exception e) {
			// do something here
			System.out.println(e.toString());
		}
		return covar;
	}
	
	public HeatmapPropertiesManager.Classification constructDefaultCovariate2(HeatmapPropertiesManager mgr, String fileName, String covName, String covFilePath, String covPos, String colorType, String treeCuts) throws Exception {
	    String covariateFile = covFilePath;
		BufferedReader reader = new BufferedReader(new FileReader(covariateFile));
		HeatmapPropertiesManager.Classification covar = mgr.new Classification(covName, fileName, covFilePath, covPos, "Y", "15", "color_plot", "#000000", "#FFFFFF", "0", "99", null, treeCuts);
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
						if (!Util.isNumeric(cat)) {
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
				covar.orig_low_bound = Float.toString(lowVal);
				covar.high_bound = Float.toString(highVal);
				covar.orig_high_bound = Float.toString(highVal);
				covBreaks.add(Float.toString(lowVal));
				covBreaks.add(Float.toString(highVal));
			}
			ArrayList<String> covColors = getDefaultClassColors(covBreaks, type);
			HeatmapPropertiesManager.ColorMap cm = mgr.new ColorMap(type,covColors, covBreaks,"#B3B3B3");
			covar.color_map = cm;
		} catch (Exception e) {
			// do something here
			System.out.println(e.toString());
		} finally {
			reader.close();
		}
		return covar;
	}
	
	/*******************************************************************
	 * METHOD: constructDefaultCovariate
	 *
	 * This method constructs a default covariate given an input covariate
	 * file. It calls a second method to construct the color map for the
	 * bar.
	 ******************************************************************/
	public HeatmapPropertiesManager.Classification constructDefaultCovariate(HeatmapPropertiesManager mgr, String fileName, String covName, String covFilePath, String covPos, String colorType, String treeCuts) throws Exception {
		HeatmapPropertiesManager.Classification covar = mgr.new Classification(covName, fileName, covFilePath, covPos, "Y", "15", "color_plot", "#000000", "#FFFFFF", "0", "99", null, treeCuts);
		HeatmapPropertiesManager.ColorMap cm = constructDefaultColorMap(mgr, covar, colorType);
		covar.color_map = cm;
		return covar;
	}
	
	/*******************************************************************
	 * METHOD: constructDefaultColorMap
	 *
	 * This method constructs a default color map for a given covariate
	 * bar input..
	 ******************************************************************/
	public HeatmapPropertiesManager.ColorMap constructDefaultColorMap(HeatmapPropertiesManager mgr, HeatmapPropertiesManager.Classification covar, String colorType) throws Exception {
	    String covariateFile = covar.path;
		HeatmapPropertiesManager.ColorMap cm = null;
		BufferedReader reader = new BufferedReader(new FileReader(covariateFile));
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
						if (!Util.isNumeric(cat)) {
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
				covar.orig_low_bound = Float.toString(lowVal);
				covar.high_bound = Float.toString(highVal);
				covar.orig_high_bound = Float.toString(highVal);
				covBreaks.add(Float.toString(lowVal));
				covBreaks.add(Float.toString(highVal));
			}
			Collections.sort(covBreaks);
			ArrayList<String> covColors = getDefaultClassColors(covBreaks, type);
			cm = mgr.new ColorMap(type,covColors, covBreaks,"#B3B3B3");
		} catch (Exception e) {
			// do something here
			System.out.println(e.toString());
		} finally {
			reader.close();
		}
		return cm;
	}
	
	/*******************************************************************
	 * METHOD: getDefaultClassColors
	 *
	 * This method returns a list of default covariate bar colors based
	 * upon the color type of the bar.
	 ******************************************************************/
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


