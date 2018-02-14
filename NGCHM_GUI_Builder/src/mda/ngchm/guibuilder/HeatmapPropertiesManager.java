package mda.ngchm.guibuilder;

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
	}
	
	public class MatrixFile {
		public String name;
		public String path;
		public String summary_method;
		public MatrixFile (String name, String path, String summary_method) {
			this.name = name; this.path = path; this.summary_method = summary_method;
		}
	}
	
	public class Order {
		public String order_method;
		public String distance_metric;
		public String agglomeration_method;
		public String order_file;
		public String dendro_file;
		public ArrayList<String> data_type = new ArrayList<String>();
		public Order (String order_method, String distance_metric, String agglomeration_method, String order_file,	String dendro_file) {
			this.order_method = order_method; this .distance_metric = distance_metric; this.agglomeration_method = agglomeration_method;
			this.order_file = order_file; this.dendro_file = dendro_file;
		}
	}
	
	public class Attrib {
		
	}
	
	public class Classification {
		
	}

	
	//Class data - note properties manager instance holds one heat map data object.
	private String directory;
	private Heatmap theMap = new Heatmap();
	
	public Heatmap getMap() {
		return theMap;
	}
	
	public HeatmapPropertiesManager(String directory) {
		this.directory = directory;
	}
	
	public String save() throws Exception {
		Gson gson = new Gson();
		String jsonStr = gson.toJson(theMap);
		String propFile = directory + "/heatmapProperties.json";
		PrintWriter out = new PrintWriter(propFile);
		out.println(jsonStr);
		out.close();
		return propFile;
	}
	public void load(String directory) throws Exception {
		
	}
}
