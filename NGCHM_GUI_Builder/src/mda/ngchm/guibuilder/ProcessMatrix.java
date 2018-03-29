package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;

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
@WebServlet("/ProcessMatrix")
public class ProcessMatrix extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			processMatrix(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
	private void processMatrix(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    final PrintWriter writer = response.getWriter();

	    try {
			System.out.println("START Processing Matrix: " + new Date()); 
			
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);

			//Get/set matrix configuration data from request
	        HeatmapPropertiesManager.MatrixGridConfig matrixConfig = getMatrixConfigData(request);
	    	
			//Construct and write out a working matrix file that has been filtered of covariate and whitespace rows/columns.
	        String matrixFile = buildFilteredMatrix(workingDir, matrixConfig);
	        
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
	        }
	        
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	        map.builder_config = (mgr.new BuilderConfig(matrixConfig));
	        map.chm_name = matrixConfig.mapName.trim();
		    map.chm_description = matrixConfig.mapDesc;
		    //Remove any existing matrix files as we are putting a new one on the map
		    map.matrix_files.removeAll(map.matrix_files);
			map.matrix_files.add(mgr.new MatrixFile(matrixConfig.matrixName, matrixFile, "average"));  

			//Add "default" row/col order configurations in original order
		    map.row_configuration = mgr.new Order("Original");
		    map.col_configuration = mgr.new Order("Original");
			
		    //Remove any existing covariate files as we are putting a new one on the map
		    map.classification_files.removeAll(map.classification_files);
		    ProcessCovariate cov = new ProcessCovariate();
	        //Construct and write out files for each row covariate bar contained in the matrix file
		    int covCtr = 1;
	        for (int i=0;i<matrixConfig.rowCovs.size();i++) {
	        	int covCol = matrixConfig.rowCovs.get(i);
	        	String covType = matrixConfig.rowCovTypes.get(i);
	        	String covFileName = workingDir + "/covariate_"+ covCtr + ".txt";
	        	String covName = buildFilteredRowCovariate(workingDir, matrixConfig, covFileName, covCol);
	        	HeatmapPropertiesManager.Classification classJsonObj = cov.constructDefaultCovariate(mgr, covName, covFileName, "row", covType);
	        	map.classification_files.add(classJsonObj);	    
	        	covCtr++;
	        }

			//Construct and write out files for each column covariate bar contained in the matrix file
	        for (int i=0;i<matrixConfig.colCovs.size();i++) {
	        	int covRow = matrixConfig.colCovs.get(i);
	        	String covType = matrixConfig.colCovTypes.get(i);
	        	String covFileName = workingDir + "/covariate_"+ covCtr + ".txt";
		        String covName = buildFilteredColCovariate(workingDir, matrixConfig, covFileName, covRow);
	        	HeatmapPropertiesManager.Classification classJsonObj = cov.constructDefaultCovariate(mgr, covName, covFileName, "column", covType);
	        	map.classification_files.add(classJsonObj);	        	 
	        	covCtr++;
	        }

			map.output_location = workingDir  + "/" + matrixConfig.mapName;
			String props = mgr.save();

		    //Call HeatmapDataGenerator to generate final heat map .ngchm file
		    String genArgs[] = new String[] {props, "-NGCHM"};
			String errMsg = HeatmapDataGenerator.processHeatMap(genArgs);
			
			System.out.println("END Processing Matrix: " + new Date()); 
	    } catch (Exception e) {
	        writer.println("Error creating initial heat map properties.");
	        writer.println("<br/> ERROR: " + e.getMessage());
	    } finally {
	        if (writer != null) {
	            writer.close();
	        }
	    }		
		
	}

	private HeatmapPropertiesManager.MatrixGridConfig getMatrixConfigData(HttpServletRequest request) throws Exception {
		StringBuilder buffer = new StringBuilder();
	    BufferedReader reader = request.getReader();
	    String line;
	    while ((line = reader.readLine()) != null) {
	        buffer.append(line);
	    }
	    String data = buffer.toString();
	    // Parse payload into JSON Object
	    HeatmapPropertiesManager.MatrixGridConfig matrixConfig = new Gson().fromJson(data, HeatmapPropertiesManager.MatrixGridConfig.class);
	    
	    return matrixConfig; 
	}
	
	/*******************************************************************
	 * METHOD: buildFilteredRowCovariate AND writeOutMatrixRow
	 *
	 * This method and the one that follows it contruct a new "working"
	 * data matrix file from the file uploaded to the builder.  This
	 * file will contain only the matix data, exclusive of any covariate
	 * bar and/or whitespace columns/rows in the original matrix.
	 ******************************************************************/
	private String buildFilteredMatrix(String workingDir, HeatmapPropertiesManager.MatrixGridConfig matrixConfig) throws Exception {
	    String originalFile = workingDir + "/originalMatrix.txt";
	    String workingFile = workingDir + "/workingMatrix.txt";
		BufferedReader reader = new BufferedReader(new FileReader(originalFile));
		BufferedWriter writer = new BufferedWriter(new FileWriter(workingFile));
		try {
			int rowNum = 0;
			String line = reader.readLine();
			while (line != null) {
				if (rowNum < matrixConfig.firstDataRow) {
					//ignore
				} else {
					String toks[] = line.split("\t");
					if (rowNum == matrixConfig.rowLabelRow) {
						boolean offset = false;
						if (!toks[matrixConfig.colLabelCol].trim().equals("")) {
							offset = true;
						}
						writeOutMatrixRow(matrixConfig, writer, toks, offset);
						writer.write("\n");
					} else if (rowNum >= matrixConfig.dataStartRow) {
						writeOutMatrixRow(matrixConfig, writer, toks, false); 
						writer.write("\n");
					}
				}
				rowNum++;
				line = reader.readLine();
			}
		} catch (Exception e) {
			// do something here
		} finally {
			reader.close();
			writer.close();
		}
		return workingFile;
	}
   
	private void writeOutMatrixRow(HeatmapPropertiesManager.MatrixGridConfig matrixConfig, BufferedWriter writer, String toks[], boolean offset) throws Exception {
		int endPoint = toks.length;
		int startPoint = matrixConfig.dataStartCol;
		if (offset) {
			endPoint = endPoint - 1;
			startPoint = startPoint - 1;
			writer.write(" " + "\t");
		} else {
			writer.write(toks[matrixConfig.colLabelCol] + "\t"); 
		}
		for (int i = startPoint; i < endPoint; i++) {
			writer.write(toks[i]);
			if (i < endPoint-1) {
				writer.write("\t");
			} 
		}
	}
	/*******************************************************************
	 * METHOD: buildFilteredColCovariate
	 *
	 * This method constructs a column covariate bar data file from contents
	 * extracted from the original data matrix uploaded to the builder.
	 ******************************************************************/
	private String buildFilteredColCovariate(String workingDir, HeatmapPropertiesManager.MatrixGridConfig matrixConfig, String covFileName, int covCol) throws Exception {
	    String originalFile = workingDir + "/originalMatrix.txt";
		String covName = "";
		BufferedReader reader = new BufferedReader(new FileReader(originalFile));
		BufferedWriter  writer = new BufferedWriter(new FileWriter(covFileName));
		try {
			int rowNum = 0;
			String line = reader.readLine();
			String labelToks[] = null;
			String covToks[] = null;
			int labelOffset = 0;
			while (line != null) {
				if (rowNum < matrixConfig.firstDataRow) {
					//ignore
				} else {
					if (rowNum == matrixConfig.rowLabelRow) {
						labelToks = line.split("\t");
						if (!labelToks[matrixConfig.colLabelCol].trim().equals("")) {
							labelOffset++;
						}
					} else if (rowNum == covCol) {
						covToks = line.split("\t");
						covName = covToks[matrixConfig.colLabelCol];
					}
					if ((labelToks != null) && (covToks != null)) {
						break;
					}
				}
				rowNum++;
				line = reader.readLine();
			}
			for (int i=matrixConfig.dataStartCol;i<covToks.length;i++) {
				String label = labelToks[i-labelOffset];
				String value = covToks[i];
				if (!value.equals("")) {
					writer.write(label+"\t"+value+"\n");
				}
			}
		} catch (Exception e) {
			// do something here
		} finally {
			reader.close();
			writer.close();
		}
		return covName;
	}
	
	/*******************************************************************
	 * METHOD: buildFilteredRowCovariate
	 *
	 * This method constructs a row covariate bar data file from contents
	 * extracted from the original data matrix uploaded to the builder.
	 ******************************************************************/
	private String buildFilteredRowCovariate(String workingDir, HeatmapPropertiesManager.MatrixGridConfig matrixConfig, String covFileName, int covRow) throws Exception {
	    String originalFile = workingDir + "/originalMatrix.txt";
		String covName = "";
		BufferedReader reader = new BufferedReader(new FileReader(originalFile));
		BufferedWriter writer = new BufferedWriter(new FileWriter(covFileName));
		try {
			int rowNum = 0;
			String line = reader.readLine();
			while (line != null) {
				if (rowNum < matrixConfig.firstDataRow) {
					//ignore
				} else if (rowNum == matrixConfig.rowLabelRow) {
					String toks[] = line.split("\t");
					int labelPos = covRow;  
					int labelOffset = matrixConfig.colLabelCol;  
					if (!toks[labelOffset].trim().equals("")) {
						labelPos--;
					}
					covName = toks[labelPos];
				} else if (rowNum >= matrixConfig.dataStartRow) {
					String toks[] = line.split("\t");
					String covLabel = toks[matrixConfig.colLabelCol];
					String covValue = toks[covRow];
					writer.write(covLabel+"\t"+covValue+"\n");
				}
				rowNum++;
				line = reader.readLine();
			}
		} catch (Exception e) {
			// do something here
		} finally {
			reader.close();
			writer.close();
		}
		return covName;
	}

}


