package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
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

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/ProcessMatrix")
public class ProcessMatrix extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static Set<String> NA_VALUES = new HashSet<String>(Arrays.asList("null","NA","N/A","-","?","NAN","NaN","Na","na","n/a",""," "));
	
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
		    String matrixFile = workingDir + "/workingMatrix.txt";
		    ArrayList<String> matrixErrors = new ArrayList<String>();
	        String[] longLabels = buildFilteredMatrix(workingDir, matrixConfig, matrixFile, matrixErrors);
        	String propJSON = "{\"return_code\": 0}";
	        
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        boolean mapChanged = true;
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
	        }
	        
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	        if (map.builder_config != null) {
		        mapChanged = mapChanged(map.builder_config.matrix_grid_config, matrixConfig);
	        }
	        
		    map.chm_description = matrixConfig.mapDesc;
	        if (mapChanged) {
		        map.chm_name = matrixConfig.mapName.trim();
		        boolean covarsChanged = true;
		        if (map.builder_config != null) {
		        	covarsChanged = covarsChanged(map.builder_config.matrix_grid_config, matrixConfig);
		        }
			    map.builder_config = (mgr.new BuilderConfig(matrixConfig,longLabels[0], longLabels[1]));
			    //Remove any existing matrix files as we are putting a new one on the map
			    map.matrix_files.removeAll(map.matrix_files);
				map.matrix_files.add(mgr.new MatrixFile(matrixConfig.matrixName, matrixFile, matrixConfig.matrixSummaryMethod, null));  
	
				//Add "default" row/col order configurations in original order
				if (map.row_configuration == null) {
					map.row_configuration = mgr.new Order("Original");
				}
				if (map.col_configuration == null) {
					map.col_configuration = mgr.new Order("Original");
				}
				
			    //Remove any existing covariate files as we are putting a new one on the map
				if (covarsChanged) {
					map.classification_files.removeAll(map.classification_files);
				    ProcessCovariate cov = new ProcessCovariate();
			        //Construct and write out files for each row covariate bar contained in the matrix file
				    int covCtr = 1;
			        for (int i=0;i<matrixConfig.rowCovs.size();i++) {
			        	int covCol = matrixConfig.rowCovs.get(i);
			        	String covType = matrixConfig.rowCovTypes.get(i);
			        	String covName = matrixConfig.rowCovNames.get(i);
			        	String covFileName = workingDir + "/covariate_"+ covCtr + ".txt";
			        	if (!buildFilteredRowCovariate(workingDir, matrixConfig, covFileName, covCol, covType)) {
							matrixErrors.add("COVARIATE INVALID: " + covName + " - Matrix data column for continuous Color Type contains non-numeric data. Please change Color Type to Discrete.");
			        	};
			        	HeatmapPropertiesManager.Classification classJsonObj = cov.constructDefaultCovariate(mgr, matrixConfig.matrixFileName, covName, covFileName, "row", covType, "0");
			        	map.classification_files.add(classJsonObj);	    
			        	covCtr++;
			        }
		
					//Construct and write out files for each column covariate bar contained in the matrix file
			        for (int i=0;i<matrixConfig.colCovs.size();i++) {
			        	int covRow = matrixConfig.colCovs.get(i);
			        	String covType = matrixConfig.colCovTypes.get(i);
			        	String covName = matrixConfig.colCovNames.get(i);
			        	String covFileName = workingDir + "/covariate_"+ covCtr + ".txt";
				        if (!buildFilteredColCovariate(workingDir, matrixConfig, covFileName, covRow, covType)) {
							matrixErrors.add("COVARIATE INVALID: " + covName + " - Matrix data row for continuous Color Type contains non-numeric data. Please change Color Type to Discrete.");
				        }
			        	HeatmapPropertiesManager.Classification classJsonObj = cov.constructDefaultCovariate(mgr, matrixConfig.matrixFileName, covName, covFileName, "column", covType, "0");
			        	map.classification_files.add(classJsonObj);	        	 
			        	covCtr++;
			        }
				}
				map.output_location = workingDir  + "/" + matrixConfig.mapName;
	        }
	        if (matrixErrors.size() > 0) {
	        	propJSON = "{\"return_code\": \""+  matrixErrors.get(0) + "\"}";
	        } else {
				mgr.save();
	        }
	       	response.setContentType("application/json");
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
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

	private boolean mapChanged(HeatmapPropertiesManager.MatrixGridConfig configOld, HeatmapPropertiesManager.MatrixGridConfig configNew) throws Exception {
		if (!configOld.mapName.equals(configNew.mapName)) {
			return true;
		}
		if (configOld.colLabelCol != configNew.colLabelCol) {
			return true;
		}
		if (configOld.rowLabelRow != configNew.rowLabelRow) {
			return true;
		}
		if (configOld.dataStartRow != configNew.dataStartRow) {
			return true;
		}
		if (configOld.dataStartCol != configNew.dataStartCol) {
			return true;
		}
		if (!configOld.matrixName.equals(configNew.matrixName)) {
			return true;
		}
		if (!configOld.matrixSummaryMethod.equals(configNew.matrixSummaryMethod)) {
			return true;
		}
		if (covarsChanged(configOld, configNew)) {
			return true;
		}
		
		return false;
	}
	
	private boolean covarsChanged(HeatmapPropertiesManager.MatrixGridConfig configOld, HeatmapPropertiesManager.MatrixGridConfig configNew) throws Exception {
		
		if (configOld.rowCovs.size() != configNew.rowCovs.size()) {
			return true;
		} else {
			for (int i=0;i<configOld.rowCovs.size();i++) {
				if (configOld.rowCovs.get(i) != configNew.rowCovs.get(i)) {
					return true;
				}
			}
		}
		if (configOld.rowCovTypes.size() != configNew.rowCovTypes.size()) {
			return true;
		} else {
			for (int i=0;i<configOld.rowCovTypes.size();i++) {
				if (!configOld.rowCovTypes.get(i).equals(configNew.rowCovTypes.get(i))) {
					return true;
				}
			}
		}
		
		if (configOld.colCovs.size() != configNew.colCovs.size()) {
			return true;
		} else {
			for (int i=0;i<configOld.colCovs.size();i++) {
				if (configOld.colCovs.get(i) != configNew.colCovs.get(i)) {
					return true;
				}
			}
		}
		if (configOld.colCovTypes.size() != configNew.colCovTypes.size()) {
			return true;
		} else {
			for (int i=0;i<configOld.colCovTypes.size();i++) {
				if (!configOld.colCovTypes.get(i).equals(configNew.colCovTypes.get(i))) {
					return true;
				}
			}
		}

		return false;
	}

	/*******************************************************************
	 * METHOD: getMatrixConfigData
	 *
	 * This method retrieves the matrix configuration information from
	 * the heatmapProperties.json.  It is used to re-draw the 
	 * handsontable grid when the screen is re-loaded.
	 ******************************************************************/
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
	 * METHOD: buildFilteredMatrix AND writeOutMatrixRow
	 *
	 * This method and the one that follows it contruct a new "working"
	 * data matrix file from the file uploaded to the builder.  This
	 * file will contain only the matix data, exclusive of any covariate
	 * bar and/or whitespace columns/rows in the original matrix.
	 ******************************************************************/
	public String[] buildFilteredMatrix(String workingDir, HeatmapPropertiesManager.MatrixGridConfig matrixConfig, String workingFile,ArrayList<String> matrixErrors) throws Exception {
	    String originalFile = workingDir + "/originalMatrix.txt";
	    int endPoint = getEndOfMatrix(workingDir, matrixConfig);
		BufferedReader reader = new BufferedReader(new FileReader(originalFile));
		BufferedWriter writer = new BufferedWriter(new FileWriter(workingFile));
		String[] longLabels = new String[2];
		String longRowLabel = "";
		try {
			int rowNum = 0;
			String line = reader.readLine();
			int lengthValidator = 0;
			while (line != null) {
				if (rowNum < matrixConfig.firstDataRow) {
					//ignore
				} else {
					String toks[] = line.split("\t",-1);
					int startPoint = matrixConfig.dataStartCol;
					if (rowNum == matrixConfig.rowLabelRow) {
						int stopPoint = toks.length;
						longLabels[1] = getLongestColLabel(matrixConfig, toks);
						lengthValidator = toks.length; 
						if (((toks.length + 1) == endPoint) || (toks[(toks.length-1)].equals(""))) {
							if ((toks.length + 1) == endPoint) {
								lengthValidator++;
							}
							startPoint = startPoint - 1;
							stopPoint = stopPoint - 1;
							writer.write(" " + "\t");
						}
						writeOutMatrixRow(startPoint, stopPoint, matrixConfig.colLabelCol, writer, toks, matrixErrors, true); 
						writer.write("\n");
					} else if (rowNum >= matrixConfig.dataStartRow) {
						if (toks.length != lengthValidator) {
							matrixErrors.add("MATRIX INVALID: A Matrix data contains a data row that does not match the number of column labels. Please inspect matrix to ensure that all data rows are the same length.");
							break;
						}
						if (toks[matrixConfig.colLabelCol].length() > longRowLabel.length()) {
							longRowLabel = toks[matrixConfig.colLabelCol];
						}
						writeOutMatrixRow(startPoint, endPoint, matrixConfig.colLabelCol, writer, toks, matrixErrors, false); 
						writer.write("\n");
					}
				}
				if (matrixErrors.size() > 0) {
					break;
				}
				rowNum++;
				line = reader.readLine();
			}
			longLabels[0] = longRowLabel;
		} catch (Exception e) {
			// do something here
		} finally {
			reader.close();
			reader = null;
			writer.close();
			writer = null;
		}
		return longLabels;
	}
	
	/*******************************************************************
	 * METHOD: getLongestColLabel
	 *
	 * This method searches the column labels row and extracts the lenght
	 * of the longest label in the row.
	 ******************************************************************/
	private String getLongestColLabel(HeatmapPropertiesManager.MatrixGridConfig matrixConfig, String toks[]) throws Exception {
		String longLabel = "";
		int endPoint = toks.length;
		int startPoint = matrixConfig.dataStartCol;
		for (int i = startPoint; i < endPoint; i++) {
			if (toks[i].length() > longLabel.length()) {
				longLabel = toks[i];
			}
		}
		return longLabel;
	}
   
	/*******************************************************************
	 * METHOD: writeOutMatrixRow
	 *
	 * This method writes out an entire line from the incoming matrix
	 * file to the workingMatrix.txt file.
	 ******************************************************************/
	private void writeOutMatrixRow(int startPoint, int endPoint, int labelCol, BufferedWriter writer, String toks[], ArrayList<String> matrixErrors, boolean isLabelRow) throws Exception {
		if ((!isLabelRow) && (toks[labelCol].trim().equals(""))) {
			matrixErrors.add("MATRIX INVALID: Matrix contains at least one blank Row Label. Please inspect matrix to ensure that all row labels are populated with data.");
			return;
		}
		if (startPoint != labelCol) {
			writer.write(toks[labelCol] + "\t"); 
		}
		for (int i = startPoint; i < endPoint; i++) {
			if ((isLabelRow) && toks[i].trim().equals("")) {
				matrixErrors.add("MATRIX INVALID: Matrix contains at least one blank Column Label. Please inspect matrix to ensure that all column labels are populated with data.");
				break;
			}
			writer.write(toks[i]);
			if (i < endPoint-1) {
				writer.write("\t");
			} 
		}
	}
	
	/*******************************************************************
	 * METHOD: getEndOfMatrix
	 *
	 * This method breezes thru the matrix to the first 10 data rows and gets
	 * the maximum length of the longest row.  This value is used when evaluating the 
	 * column headers row for offsets of the header values.
	 ******************************************************************/
	private int getEndOfMatrix(String workingDir, HeatmapPropertiesManager.MatrixGridConfig matrixConfig) throws Exception {
	    String originalFile = workingDir + "/originalMatrix.txt";
	    int endPoint = 0;
		BufferedReader readr = new BufferedReader(new FileReader(originalFile));
		try {
			int rowNum = 0;
			String line = readr.readLine();
			while (line != null) {
				if (rowNum < matrixConfig.dataStartRow) {
					//ignore
				} else if (rowNum == matrixConfig.dataStartRow) {
					String toks[] = line.split("\t",-1);
					endPoint = toks.length;
					break;
				}
				rowNum++;
				line = readr.readLine();
			}
		} catch (Exception e) {
			// do something here
		} finally {
			readr.close();
			readr = null;
		}
		return endPoint;
	}


	/*******************************************************************
	 * METHOD: buildFilteredColCovariate
	 *
	 * This method constructs a column covariate bar data file from contents
	 * extracted from the original data matrix uploaded to the builder.
	 ******************************************************************/
	private boolean buildFilteredColCovariate(String workingDir, HeatmapPropertiesManager.MatrixGridConfig matrixConfig, String covFileName, int covCol, String type) throws Exception {
		boolean covarValid = true;
		String originalFile = workingDir + "/originalMatrix.txt";
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
						labelToks = line.split("\t",-1);
						if (!labelToks[matrixConfig.colLabelCol].trim().equals("")) {
							labelOffset++;
						}
					} else if (rowNum == covCol) {
						covToks = line.split("\t",-1);
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
				if (type.equals("continuous")) {
					if ((!Util.isNumeric(value)) && (!NA_VALUES.contains(value))){
						covarValid = false;
						break;
					}
				}
			}
		} catch (Exception e) {
			// do something here
		} finally {
			reader.close();
			writer.close();
		}
		return covarValid;
	}
	
	/*******************************************************************
	 * METHOD: buildFilteredRowCovariate
	 *
	 * This method constructs a row covariate bar data file from contents
	 * extracted from the original data matrix uploaded to the builder.
	 ******************************************************************/
	private boolean buildFilteredRowCovariate(String workingDir, HeatmapPropertiesManager.MatrixGridConfig matrixConfig, String covFileName, int covRow, String type) throws Exception {
		boolean covarValid = true;
	    String originalFile = workingDir + "/originalMatrix.txt";
		BufferedReader reader = new BufferedReader(new FileReader(originalFile));
		BufferedWriter writer = new BufferedWriter(new FileWriter(covFileName));
		try {
			int rowNum = 0;
			String line = reader.readLine();
			while (line != null) {
				if (rowNum < matrixConfig.firstDataRow) {
					//ignore
				} else if (rowNum == matrixConfig.rowLabelRow) {
					String toks[] = line.split("\t",-1);
					int labelPos = covRow;  
					int labelOffset = matrixConfig.colLabelCol;  
					if (!toks[labelOffset].trim().equals("")) {
						labelPos--;
					}
				} else if (rowNum >= matrixConfig.dataStartRow) {
					String toks[] = line.split("\t",-1);
					String covLabel = toks[matrixConfig.colLabelCol];
					String covValue = toks[covRow];
					writer.write(covLabel+"\t"+covValue+"\n");
					if (type.equals("continuous")) {
						if ((!Util.isNumeric(covValue)) && (!NA_VALUES.contains(covValue))){
							covarValid = false;
							break;
						}
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
		return covarValid;
	}

}


