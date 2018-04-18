package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.PrintWriter;
import java.util.ArrayList;

import com.google.gson.Gson;

public class HeatmapPropertiesManager {
    //Data Holder Classes
	public class Heatmap {
		public String chm_name;
		public String chm_description;
		public ArrayList<MatrixFile> matrix_files = new ArrayList<MatrixFile>();
		public ArrayList<Attrib> chm_attributes = new ArrayList<Attrib>();
		public ArrayList<Classification> classification_files = new ArrayList<Classification>();
		public Order col_configuration;
		public Order row_configuration;
		public String output_location;
		public BuilderConfig builder_config;
	}
	
	public class MatrixFile {
		public String name;
		public String path;
		public String summary_method;
		public String grid_color;
		public String grid_show;
		public String selection_color;
		public ColorMap color_map;
		public MatrixFile (String name, String path, String summary_method, ColorMap cmap) {
			this.name = name; this.path = path; this.summary_method = summary_method; this.color_map = cmap;
			this.grid_show = "Y"; this.grid_color = "#FFFFFF"; this.selection_color = "#00FF38";
		}
	}
	
	public class BuilderConfig {
		public String buildProps = "N";
		public String buildCluster = "N";
		public MatrixGridConfig matrix_grid_config;
		public BuilderConfig (MatrixGridConfig gridConfig) {
			this.matrix_grid_config = gridConfig;
		}
	}
	
	public class MatrixGridConfig {
		public String mapName;
		public String mapDesc;
		public String matrixName;
		public int firstDataRow;
		public int firstDataCol;
		public int dataStartRow;
		public int dataStartCol;
		public int rowLabelRow;
		public int colLabelCol;
		public ArrayList<Integer> rowCovs = new ArrayList<Integer>();
		public ArrayList<String> rowCovTypes = new ArrayList<String>();
		public ArrayList<Integer> colCovs = new ArrayList<Integer>();
		public ArrayList<String> colCovTypes = new ArrayList<String>();
		public MatrixGridConfig (int fdRow, int fdCol, int dsRow, int dsCol, int rowLabel, int colLabel, ArrayList<Integer> rowCovs, ArrayList<String> rowCovTypes, ArrayList<Integer> colCovs,  ArrayList<String> colCovTypes) {
			this.firstDataRow = fdRow; this.firstDataCol = fdCol; this.dataStartRow = dsRow; this.dataStartCol = dsCol; 
			this.rowLabelRow = rowLabel; this.colLabelCol = colLabel; this.rowCovs = rowCovs; this.rowCovTypes = rowCovTypes; 
			this.colCovs = colCovs; this.colCovTypes = colCovTypes;
		}
	}
	
	public class Order {
		public String order_method;
		public String distance_metric;
		public String agglomeration_method;
		public String order_file;
		public String dendro_file;
		public String dendro_show;
		public String dendro_height;
		public String label_display_length;
		public String label_display_abbreviation;
		public ArrayList<String> top_items = new ArrayList<String>();
		public ArrayList<String> data_type = new ArrayList<String>();
		public int[] cut_locations = null;
		public String cut_width;
		public String tree_cuts;
		public Order (String order_method) {
			this.order_method = order_method;
			this.dendro_show = "NA";
			this.dendro_height = "10";
			this.label_display_length = "20";
			this.label_display_abbreviation = "END";
			this.cut_width = "10";
			this.tree_cuts = "0";
		}
		public Order (String order_method, String distance_metric, String agglomeration_method, String order_file,	String dendro_file, String dendro_show, String dendro_height) {
			this.order_method = order_method; this .distance_metric = distance_metric; this.agglomeration_method = agglomeration_method;
			this.order_file = order_file; this.dendro_file = dendro_file; this.dendro_show = dendro_show; this.dendro_height = dendro_height; 
		}
	}
	
	public class Attrib {
		
	}
	 
	public class ColorMap {
		public String type;
		public ArrayList<String> colors = new ArrayList<String>();
		public ArrayList<String> thresholds = new ArrayList<String>();
		public String missing;
		public ColorMap (String type, ArrayList<String> colors, ArrayList<String> thresholds, String missing) {
			this.type = type;
			this.missing = missing;
			this.thresholds = thresholds;
			this.colors = colors;
		}
	}
	
	public class Classification {
		public String name;
		public String path;
		public String height;
		public String position;
		public String bar_type;
		public String fg_color;
		public String bg_color;
		public String low_bound;
		public String high_bound;
		public String show;
		public ColorMap color_map;
		public Classification (String name, String path, String position, String showVal, String heightVal, String barType, String fgColor, String bgColor, String lowBound, String highBound, ColorMap cmap) {
			this.name = name; 
			this.path = path; 
			this.position = position; 
			this.show = showVal;
			this.height = heightVal;
			this.bar_type = barType; 
			this.fg_color = fgColor; 
			this.bg_color = bgColor; 
			this.low_bound = lowBound; 
			this.high_bound = highBound;
			this.color_map = cmap;
		}
	}

	
	//Class data - note properties manager instance holds one heat map data object.
	private String directory;
	private Heatmap theMap = new Heatmap();
	
	public Heatmap getMap() {
		return theMap;
	}
	
	public void setMap(Heatmap newMap) {
		this.theMap = newMap;
	}
	
	public HeatmapPropertiesManager(String directory) {
		this.directory = directory;
	}
	
	/*******************************************************************
	 * METHOD: load
	 *
	 * This method saves values set on the heatMap object back to the
	 * heatmapProperties JSON file. 
	 ******************************************************************/
	public String save() throws Exception {
		String propFile = directory + "/heatmapProperties.json";
		PrintWriter out = new PrintWriter(propFile);
		try {
			Gson gson = new Gson();
			String jsonStr = gson.toJson(theMap);
			out.println(jsonStr);
			out.close();
		} catch (Exception e) {
			// do something
		} finally {
			out.close();
			out = null;
		}
		return propFile;
	}
	
	/*******************************************************************
	 * METHOD: load
	 *
	 * This method loads the contents of the heatmapProperties json file,
	 * stored in the session directory, into a heatmap object and returns
	 * that object to the caller.
	 ******************************************************************/
	public String load() throws Exception {
		String propFile = directory + "/heatmapProperties.json";
		BufferedReader in = new BufferedReader(new FileReader(propFile));
		String jsonStr = null;
		try {
			Gson gson = new Gson();
			jsonStr = in.readLine();
			theMap = gson.fromJson(jsonStr, Heatmap.class );
			in.close();
		} catch (Exception e) {
			// do something
		} finally {
			in.close();
			in = null;
		}
		return jsonStr;
	}
}
