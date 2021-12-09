package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Date;


public class AppVersioner {

	public static String getVersion(File compatibilityJS) throws FileNotFoundException, IOException {
	    String currentVersion = null;
   		BufferedReader br = new BufferedReader(new FileReader(compatibilityJS));
	    String sCurrentLine;
		while((sCurrentLine = br.readLine()) != null) {
			if (sCurrentLine.contains("NgChm.CM.version")) {
				String vals[] = sCurrentLine.split("\"");
				currentVersion = vals[1];
				break;
			}
		}	
	    br.close();
	    return currentVersion;

	}
	
	private static void versionFile(String dir, String version, File file) {
		System.out.println("Processing file: " + file.getName());
		try {
			BufferedReader br = new BufferedReader(new FileReader(file));
			BufferedWriter bw = new BufferedWriter(new FileWriter(dir + file.getName() + ".temp" ));
				
			String line = br.readLine(); 
				while (line != null) {
				if ((line.contains("src=\"javascript")) || (line.contains("<link rel=\"stylesheet"))) {
					int qmLoc = line.indexOf("?");
					int closeLoc = line.indexOf(">");
					String firstHalf = line.substring(0,qmLoc);
						String lastHalf = line.substring(closeLoc-1,line.length());
					String newLine = firstHalf + "?v=" + version + lastHalf;
					bw.write(newLine+"\n");
				} else {
					bw.write(line+"\n");
				}
				line = br.readLine();
			} 	
			bw.close();
			br.close();
        } catch (Exception e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } 
	}
	
    public static void main(String[] args) {
		System.out.println("BEGIN AppVersioner  " + new Date());
        try {
       		if (args.length < 1) {
    			System.out.println("Usage: AppVersioner <web directory>");
    			System.exit(1);
    		}
	        HeatmapPropertiesManager tempMgr = new HeatmapPropertiesManager();
	        HeatmapPropertiesManager.Heatmap map = tempMgr.getMap();
			String version = map.builder_version;
			System.out.println("VERSION IS: " + version);
			File folder = new File(args[0]);
			File[] listOfFiles = folder.listFiles();

			for (File file : listOfFiles) {
			    if (file.isFile()) {
			    	String fileName = file.getName();
			    	int i = fileName.lastIndexOf('.');
			    	if (i > 0) {
			    	    if (fileName.substring(i+1).contentEquals("html")) {
			    	    	if (!fileName.contentEquals("ngChmApp.html") && !fileName.contentEquals("ngChmBuilderHelp.html")) {
			    	    		versionFile(args[0], version, file);
			    	    	}
			    	    }
			    	}
			    }
			}
/*   			File compatMgr = new File(args[0] + "/" + "Cluster_Matrix.html");
    		BufferedReader br = new BufferedReader(new FileReader(compatMgr));
    		BufferedWriter bw = new BufferedWriter(new FileWriter(args[0] + "Cluster_Matrix_Temp.html" ));
     		
    		String line = br.readLine(); 
     		while (line != null) {
    			if ((line.contains("src=\"javascript")) || (line.contains("<link rel=\"stylesheet"))) {
    				int qmLoc = line.indexOf("?");
    				int closeLoc = line.indexOf(">");
    				String firstHalf = line.substring(0,qmLoc);
       				String lastHalf = line.substring(closeLoc-1,line.length());
   				String newLine = firstHalf + "?v=" + version + lastHalf;
    				bw.write(newLine+"\n");
    			} else {
    				bw.write(line+"\n");
    			}
    			line = br.readLine();
    		} 	
    		bw.close();
    		br.close(); */
    		System.out.println("END AppVersioner " + new Date());
		
        } catch (Exception e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } 

	}

}
