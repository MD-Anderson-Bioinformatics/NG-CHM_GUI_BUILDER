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

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/ProcessTransforms")
public class ProcessTransforms extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			processTransforms(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
	private void processTransforms(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    final PrintWriter writer = response.getWriter();

	    try {
			System.out.println("START Processing Transforms: " + new Date()); 
			
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);

			//Get/set matrix configuration data from request
	        HeatmapPropertiesManager.TransformConfig transformConfig = getTransformConfigData(request);
	    	
			//Construct and write out a working matrix file that has been filtered of covariate and whitespace rows/columns.
//	        String matrixFile = buildFilteredMatrix(workingDir, transformConfig);
	        
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
	        }
	        
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	        HeatmapPropertiesManager.BuilderConfig builder_config = map.builder_config;
	        builder_config.transform_config = transformConfig;
//	        map.chm_name = transformConfig.mapName.trim();
//		    map.chm_description = transformConfig.mapDesc;
//		    //Remove any existing matrix files as we are putting a new one on the map
//		    map.matrix_files.removeAll(map.matrix_files);
//			map.matrix_files.add(mgr.new MatrixFile(transformConfig.matrixName, matrixFile, "average", null));  

			

//			map.output_location = workingDir  + "/" + builderConfig.mapName;
			mgr.save();

			System.out.println("END Processing Transform: " + new Date()); 
	    } catch (Exception e) {
	        writer.println("Error creating initial heat map properties.");
	        writer.println("<br/> ERROR: " + e.getMessage());
	    } finally {
	        if (writer != null) {
	            writer.close();
	        }
	    }		
		
	}


	/*******************************************************************
	 * METHOD: getMatrixConfigData
	 *
	 * This method retrieves the matrix configuration information from
	 * the heatmapProperties.json.  It is used to re-draw the 
	 * handsontable grid when the screen is re-loaded.
	 ******************************************************************/
	private HeatmapPropertiesManager.TransformConfig getTransformConfigData(HttpServletRequest request) throws Exception {
		StringBuilder buffer = new StringBuilder();
	    BufferedReader reader = request.getReader();
	    String line;
	    while ((line = reader.readLine()) != null) {
	        buffer.append(line);
	    }
	    String data = buffer.toString();
	    // Parse payload into JSON Object
	    HeatmapPropertiesManager.TransformConfig transformConfig = new Gson().fromJson(data, HeatmapPropertiesManager.TransformConfig.class);
	    
	    return transformConfig; 
	}
	
	/*******************************************************************
	 * METHOD: buildFilteredMatrix AND writeOutMatrixRow
	 *
	 * This method and the one that follows it contruct a new "working"
	 * data matrix file from the file uploaded to the builder.  This
	 * file will contain only the matix data, exclusive of any covariate
	 * bar and/or whitespace columns/rows in the original matrix.
	 ******************************************************************/
	private String buildFilteredMatrix(String workingDir, HeatmapPropertiesManager.MatrixGridConfig matrixConfig) throws Exception {
	    String originalFile = workingDir + "/originalMatrix.txt";
	    String workingFile = workingDir + "/workingMatrix.txt";
	    int endPoint = getEndOfMatrix(workingDir, matrixConfig);
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
						if ((toks.length + 1) == endPoint) {
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
			reader = null;
			writer.close();
			writer = null;
		}
		return workingFile;
	}
   
	private void writeOutMatrixRow(HeatmapPropertiesManager.MatrixGridConfig matrixConfig, BufferedWriter writer, String toks[], boolean offset) throws Exception {
		int endPoint = toks.length;
		int startPoint = matrixConfig.dataStartCol;
		if (offset) {
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
	 * METHOD: getEndOfMatrix
	 *
	 * This method breezes thru the matrix to the first data row and gets
	 * the length of that row.  This value is used when evaluating the 
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
					String toks[] = line.split("\t");
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


