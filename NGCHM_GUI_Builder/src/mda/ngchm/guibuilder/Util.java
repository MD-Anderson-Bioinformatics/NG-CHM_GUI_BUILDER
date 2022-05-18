package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.apache.poi.ss.usermodel.*;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public class Util {
	
	
	public static boolean logSysMessages = true;
	
	/*******************************************************************
	 * METHOD: toSignificantFiguresString
	 *
	 * Helper function that takes a double and returns a string version but
	 * formated to have just 3 significant digits if the number is small.
	 ******************************************************************/
	public static String toSignificantFiguresString(double value, int significantFigures ){
		NumberFormat nf = new DecimalFormat("#,##0");
		String valueStr = "";
		if (value < 100) {
			BigDecimal bd = new BigDecimal(value);
			valueStr = String.format("%."+significantFigures+"G", bd);
			
			//Trim trailing 0s - probably a better way to do this
			while (valueStr.contains(".") && valueStr.endsWith("0")) {
				valueStr = valueStr.substring(0, valueStr.length() - 1);
			}
			if (valueStr.endsWith(".")) {
				valueStr = valueStr.substring(0, valueStr.length() - 1);
			}
		} else {
			// For large numbers just return them with no decimal places.
			valueStr = nf.format(value);
		}
	    return valueStr;
	}


	/*******************************************************************
	 * METHOD: getTopOfMatrix
	 *
	 * This method opens the uploaded matrix and return the top left 
	 * corner of it as a json string.
	 ******************************************************************/
	public static String getTopOfMatrix(String matrixFile, int numRows, int numCols) throws Exception {
		Gson gson = new GsonBuilder().create();
		String [][] topMatrix = new String[numRows][numCols];
		
		BufferedReader rdr = new BufferedReader(new FileReader(matrixFile));
		int rowNum = 0;
		String line = rdr.readLine();
		while (line != null && rowNum < numRows){
			String toks[] = line.split("\t");
			int colNum = 0;
			while (colNum < toks.length && colNum < numCols) {
				boolean parseMe = isNumeric(toks[colNum]) && !isInteger(toks[colNum]);
				//Format value to three decimal places if it is numeric 
				topMatrix[rowNum][colNum] = parseMe ? toSignificantFiguresString(Double.parseDouble(toks[colNum]), 3) : toks[colNum];
				colNum++;
			}
			line = rdr.readLine();
			rowNum++;
		}
		rdr.close();
		
		String jsonMatrixTop = gson.toJson(topMatrix); 
		return jsonMatrixTop;
	}
	
	/*******************************************************************
	 * METHOD: restoreWorking
	 *
	 * This method creates a backup copy of a working matrix file.
	 ******************************************************************/
	public static void backupWorking(String workingMatrix) throws Exception {
		String saveWorking = workingMatrix + ".sav";
		if (new File(saveWorking).exists())
			return;
		Files.copy(Paths.get(workingMatrix), Paths.get(saveWorking));
	}

	/*******************************************************************
	 * METHOD: restoreWorking
	 *
	 * This method restores a working matrix file.
	 ******************************************************************/
	public static void restoreWorking(String workingMatrix) throws Exception {
		String saveWorking = workingMatrix + ".sav";
		File workingFile = new File(workingMatrix);
		if (workingFile.exists()) {
			try {
				workingFile.delete();
			} catch (Exception e) {
				//do nothing
			}
		}
		Files.copy(Paths.get(saveWorking), Paths.get(workingMatrix));
	}
	
	/*******************************************************************
	 * METHOD: restoreWorkingFromTemp
	 *
	 * This method restores a working matrix file.
	 ******************************************************************/
	public static void restoreWorkingFromTemp(String workingMatrix) throws Exception {
		String tempWorking = workingMatrix + ".tmp";
		new File(workingMatrix).delete();
		Files.copy(Paths.get(tempWorking), Paths.get(workingMatrix));
	}
	
	/*******************************************************************
	 * METHOD: copyWorkingToTemp
	 *
	 * This method copies a working matrix file to a temporary file.
	 ******************************************************************/
	public static String copyWorkingToTemp(String workingMatrix) throws Exception {
		String tmpWorking = workingMatrix + ".tmp";
		if (new File(tmpWorking).exists())
			new File(tmpWorking).delete();
		new File(workingMatrix).renameTo(new File(tmpWorking));
		return tmpWorking;
	}

	/*******************************************************************
	 * METHOD: isNumeric
	 *
	 * This method inspects an input string to determine if that string
	 * contains a numeric entry.
	 ******************************************************************/
	public static boolean isNumeric(String str)	{
	  try  {  
	    @SuppressWarnings("unused")
		double d = Double.parseDouble(str);
	    if (Double.isNaN(d) || d == Double.NEGATIVE_INFINITY || d == Double.POSITIVE_INFINITY)
	       	return false;
	  }   catch(Exception e)  { 
	    return false;  
	  }  
	  return true;  
	}
	
	public static boolean isInteger(String s) {
	    try {
	        Integer.parseInt(s);
	        return true;
	    } catch (NumberFormatException ex) {
	        return false;
	    }
	}
	
	/*******************************************************************
	 * METHOD: isMissing
	 *
	 * This method inspects an input string to determine if that string
	 * is a missing values entry.
	 ******************************************************************/
	public static boolean isMissing(String str) {
		String val = str.trim().toUpperCase();
		if (val.equals("") || val.equals("N/A") || val.equals("NA") || val.equals(" ") ||  val.equals("?") || val.equals("-"))
			return true;
		return false;
	}
	
	/*******************************************************************
	 * METHOD: uploadTSV
	 *
	 * This method uploads a tab separated matrix file to the session
	 * directory.
	 ******************************************************************/
	public static void uploadTSV(String outFile, InputStream filecontent) throws Exception { 
		OutputStream out = new FileOutputStream(new File(outFile));
	    try {
	        int read = 0;
	        final byte[] bytes = new byte[1024];
	        while ((read = filecontent.read(bytes)) != -1) {
	            out.write(bytes, 0, read);
	        }
		    out.close();
	    } finally {
	        if (out != null) {
	            out.close();
	        }
	    }
	}
	
	/*******************************************************************
	 * METHOD: uploadCSV
	 *
	 * This method uploads a comma separated matrix file to the session
	 * directory as a tab separated file.
	 ******************************************************************/
	public static void uploadCSV(String outFile, InputStream filecontent) throws IOException {
	    FileWriter fw = new FileWriter(new File(outFile));
	    Reader fr = new InputStreamReader(filecontent);
	    BufferedReader br = new BufferedReader(fr);
	    try {
		    while(br.ready()) {
		        fw.write(br.readLine().replaceAll(",", "\t"));
		        fw.write("\n");
		    }
	    } finally {
			if (fw != null) {fw.close();fw = null;}
			if (br != null) {br.close();br = null;}
			if (fr != null) {fr.close();fr = null;}
	    }
	}

	/*******************************************************************
	 * METHOD: uploadXLS
	 *
	 * This method uploads an Excel matrix workbook to the session directory.
	 * It iterates thru the pages of an Excel workbook calling a method
	 * that processes the first sheet as the matrix.
	 ******************************************************************/
	public static void uploadXLS(String outFile, InputStream filecontent) throws Exception {
		//Crate workbook from file contents
		Workbook workbook = WorkbookFactory.create(filecontent); 
        //Create output stream for workingMatrix.txt
		try {
	        // Iterate thru all the sheets in the workbook
	        Iterator<Sheet> sheetIterator = workbook.sheetIterator();
	        int sheetCtr = 0;
	        while (sheetIterator.hasNext()) {
	            Sheet sheet = sheetIterator.next();
	            if (sheetCtr == 0) {
	            	uploadDataSheet(outFile, sheet);
	            } else {
	            	//DO NOTHING NOW.  Later: Call covariate or flick upload here (e.g. uploadCovariateSheet)
	            }
	            sheetCtr++;
	        }
		} catch (Exception e) {
			System.out.println("\n\nERROR WRITING OUTPUT FILE\n");
			throw e;
		}

	}
	
	/*******************************************************************
	 * METHOD: uploadDataSheet
	 *
	 * This method uploads an Excel sheet's contents to the session 
	 * directory as a tab separated file.
	 ******************************************************************/
	private static void uploadDataSheet(String matrixFile, Sheet sheet) throws Exception {
        //Create output stream for workingMatrix.txt
		OutputStream out = new FileOutputStream(new File(matrixFile));
	    OutputStreamWriter osw = new OutputStreamWriter(out, "UTF8");
	    BufferedWriter bw = new BufferedWriter(osw);
		try {
	        // Create a DataFormatter to format and get each cell's value as String
	        DataFormatter dataFormatter = new DataFormatter();
	        // Iterate thru the data rows in the sheet
	        Iterator<Row> rowIterator = sheet.rowIterator();
	        while (rowIterator.hasNext()) {
	            Row row = rowIterator.next();
	            // Now let's iterate over the columns of the current row
	            Iterator<Cell> cellIterator = row.cellIterator();
	            while (cellIterator.hasNext()) {
	                Cell cell = cellIterator.next();
	                String cellValue = dataFormatter.formatCellValue(cell);
		            bw.write(cellValue);
		            if (!cellIterator.hasNext()) {
		            	bw.newLine();
		            } else {
		            	bw.write("\t");
		            }
	            }
	        }
		} catch (Exception e) {
			System.out.println("\n\nERROR WRITING OUTPUT FILE\n");
			throw e;
		} finally {
			if (bw != null) {bw.flush();bw.close();bw = null;}
			if (osw != null) {osw.close();osw = null;}
			if (out != null) {out.close();out = null;}
		}
	}
	

	
	static class TileStat{
		String type;
		int tile_rows;
		int tile_cols;
		int rows_per_tile;
		int cols_per_tile;
		int total_rows;
		int total_cols;
		TileStat(String type,int tile_rows,int tile_cols,int rows_per_tile,int cols_per_tile,int total_rows,int total_cols){
			this.type=type;
			this.tile_rows=tile_rows;
			this.tile_cols=tile_cols;
			this.rows_per_tile=rows_per_tile;
			this.cols_per_tile=cols_per_tile;
			this.total_rows=total_rows;
			this.total_cols=total_cols;
		}
	}
	
	static class TileLabels{
		List<String> rowLabels;
		List<String> colLabels;
		TileLabels(List<String> rowLabels,List<String> colLabels){
			this.rowLabels=rowLabels;
			this.colLabels=colLabels;
		}
		
	}
	
	public static File newFile(File destinationDir, ZipEntry zipEntry) throws IOException {
	    File destFile = new File(destinationDir, zipEntry.getName());

	    String destDirPath = destinationDir.getCanonicalPath();
	    String destFilePath = destFile.getCanonicalPath();

	    if (!destFilePath.startsWith(destDirPath + File.separator)) {
	        throw new IOException("Entry is outside of the target dir: " + zipEntry.getName());
	    }

	    return destFile;
	}
	
	/*******************************************************************
	 * METHOD: unzipNGCHM
	 *
	 * This method unzip NGCHM file. 
	 ******************************************************************/
	
	
	public static void unzipNGCHM(String destDirPath, InputStream filecontent) throws Exception{
		File destDir = new File(destDirPath);
		byte[] buffer = new byte[1024];
		ZipInputStream zis = new ZipInputStream(filecontent);
        ZipEntry zipEntry = zis.getNextEntry();
        while (zipEntry != null) {
        	File newFile = newFile(destDir, zipEntry);
            if (zipEntry.isDirectory()) {
                if (!newFile.isDirectory() && !newFile.mkdirs()) {
                    throw new IOException("Failed to create directory " + newFile);
                }
            } else {
                // fix for Windows-created archives
                File parent = newFile.getParentFile();
                if (!parent.isDirectory() && !parent.mkdirs()) {
                    throw new IOException("Failed to create directory " + parent);
                }
                
                // write file content
                FileOutputStream fos = new FileOutputStream(newFile);
                int len;
                while ((len = zis.read(buffer)) > 0) {
                    fos.write(buffer, 0, len);
                }
                fos.close();
            }
            zipEntry = zis.getNextEntry();
     
        }
        zis.closeEntry();
        zis.close();
	}
	
	/*******************************************************************
	 * METHOD: uploadNGCHM
	 *
	 * This method uploads a NGCHM, unzip the NGCHM, reconstruct data matrix from tile files and save content of first data layer  to the session 
	 * directory as a tab separated file.
	 ******************************************************************/
	
	public static void uploadNGCHM(String destDirPath, String matrixFile, InputStream filecontent) throws Exception {
		System.out.println(destDirPath);
		unzipNGCHM(destDirPath,filecontent);
		
        File[] directories = new File(destDirPath).listFiles(File::isDirectory);
        
        String mapConfigPath = directories[0].toString()+"/mapConfig.json";
        String mapDataPath = directories[0].toString()+"/mapData.json";
        TileStat tilestat = parseMapConfig(mapConfigPath);
        TileLabels tileLabels = parseMapData(mapDataPath);
        
        //Only read data from the firstlayer now
        String inputFolderPath = directories[0].toString()+"/dl1/"+tilestat.type+"/";
        constructDataMatrix(tilestat, tileLabels, inputFolderPath, matrixFile);
	}
	
	
	/*******************************************************************
	 * METHOD: reverse
	 *
	 * Reverse byte array.
	 ******************************************************************/
	
	 public static void reverseByteArray(byte[] array) {
	        if (array == null) {
	            return;
	        }
	        int i = 0;
	        int j = array.length - 1;
	        byte tmp;
	        while (j > i) {
	            tmp = array[j];
	            array[j] = array[i];
	            array[i] = tmp;
	            j--;
	            i++;
	        }
	    }
	 
		/*******************************************************************
		 * METHOD: constructDataMatrix
		 *
		 * Reconstruct data matrix.
		 ******************************************************************/
	
	public static void constructDataMatrix(TileStat tilestat, TileLabels tileLabels, String inputFolderPath, String matrixFile) {
			int tile_rows = tilestat.tile_rows;
			int tile_cols = tilestat.tile_cols;
			float[][] data_matrix = new float[tilestat.total_rows][tilestat.total_cols];
			for (int r=1 ; r<=tile_rows ; r++ ) {
				for (int c=1; c<=tile_cols ; c++ ) {
					readTile(inputFolderPath, tilestat, r, c, data_matrix);
				}
			}
			writeIntoMatrix(tilestat,tileLabels,data_matrix,matrixFile);
		}

	
	/*******************************************************************
	 * METHOD: readdTile
	 *
	 * Reconstruct data matrix from tile file.
	 * The data matrix is pieced together with several d tile file. 
	 * Notice that the byte array need to reversed to get the correct value, the data matrix need to be reversed too. 
	 ******************************************************************/
	
	public static void readTile(String inputFolderPath, TileStat tilestat,int r, int c, float[][] data_matrix) {
		
		String inputFile = inputFolderPath+tilestat.type+"."+r+"."+c+".tile";
		System.out.println(inputFile);
		InputStream inputStream;
		try {
			inputStream = new FileInputStream(inputFile);
			Path path = Paths.get(inputFile);
			byte[] bytes;
			try {
				bytes = Files.readAllBytes(path);
				reverseByteArray(bytes);
				ByteBuffer buffer = ByteBuffer.wrap(bytes);
				for (int i = tilestat.rows_per_tile-1;i>=0; i--) {
					for (int j= tilestat.cols_per_tile-1;j>=0; j--) {
						data_matrix[i+(r-1)*tilestat.rows_per_tile][j+(c-1)*tilestat.cols_per_tile]=buffer.getFloat();
					}
				}
				inputStream.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		}
		
	}
	

	
	/*******************************************************************
	 * METHOD: writeIntoMatrix
	 *
	 * Write data_matrix two-dimension array into output file
	 ******************************************************************/
	
	public static void writeIntoMatrix(TileStat tilestat, TileLabels tileLabels, float[][] data_matrix, String matrixFile) {
		try (
			BufferedWriter writer = new BufferedWriter(new FileWriter(matrixFile));
		) {
			for (String colLabel: tileLabels.colLabels) {
				writer.write(colLabel+"\t");
			}
			writer.write("\n");
			for (int i = 0; i < tilestat.total_rows; i++) {
					String newline= tileLabels.rowLabels.get(i)+"\t";
					for (int j=0; j < tilestat.total_cols;j++) {
						newline += data_matrix[i][j] + "\t";
					}
					newline=newline.trim()+"\n";
					writer.write(newline);
			}
		  } catch (IOException ex) {
			    ex.printStackTrace();
		  }
		
	}
	
	/*******************************************************************
	 * METHOD: parseMapData
	 *
	 * Get labels from mapData file
	 * The order of row and column label is the same as in tile files.
	 ******************************************************************/
	public static TileLabels parseMapData(String mapDataPath) {
		JSONParser parser = new JSONParser();

        try {     
            Object obj = parser.parse(new FileReader(mapDataPath));
            JSONObject jsonObject =  (JSONObject) obj;
            // loop array
            JSONObject row_data =  (JSONObject) jsonObject.get("row_data");
            JSONObject row_label = (JSONObject) row_data.get("label");
            JSONArray row_labels  = (JSONArray) row_label.get("labels");
            List<String> rowLabels = new ArrayList<String>();
            for (Object rowlabel : row_labels)
            {
              rowLabels.add( rowlabel.toString());
            }
            
            JSONObject col_data =  (JSONObject) jsonObject.get("col_data");
            JSONObject col_label = (JSONObject) col_data.get("label");
            JSONArray col_labels  = (JSONArray) col_label.get("labels");
            List<String> colLabels = new ArrayList<String>();
            for (Object collabel : col_labels)
            {
            	colLabels.add( collabel.toString());
            }
            return new TileLabels(rowLabels,colLabels);
            
           
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ParseException e) {
            e.printStackTrace();
        }	
        return null;
		
	}

	/*******************************************************************
	 * METHOD: parseMapConfig
	 *
	 * Get information from mapConfig on how to reconstruct data matrix
	 * If there is "d" (detail) use detail to reconstruct.
	 * If there is no "d" check for "s" (summary).
	 * If there is no "s" check for "tn" (thumb nail).
	 * Return a tileStat object which contains the tile info. 
	 ******************************************************************/
	public static TileStat parseMapConfig(String mapConfigPath) {
		JSONParser parser = new JSONParser();

        try {     
            Object obj = parser.parse(new FileReader(mapConfigPath));
            JSONObject jsonObject =  (JSONObject) obj;
            // loop array
            JSONObject data_config =  (JSONObject) jsonObject.get("data_configuration");
            JSONObject map_info = (JSONObject) data_config.get("map_information");
            JSONObject levels = (JSONObject) map_info.get("levels");
            int tile_rows=0,tile_cols=0,rows_per_tile=0,cols_per_tile=0,total_rows=0,total_cols=0;
            JSONObject level= (JSONObject) levels.get("tn");;
            String type="d";
            if (levels.containsKey("d")) {
            	level = (JSONObject) levels.get("d");
            	type= "d";
            }else if (levels.containsKey("s")) {
            	level = (JSONObject) levels.get("s");
            	type= "s";
            }else if (levels.containsKey("tn")) {
            	level = (JSONObject) levels.get("tn");
            	type= "tn";
            }
            System.out.println(levels);
            tile_rows = Integer.parseInt(level.get("tile_rows").toString());
        	tile_cols = Integer.parseInt(level.get("tile_cols").toString());
        	rows_per_tile = Integer.parseInt(level.get("rows_per_tile").toString());
        	cols_per_tile = Integer.parseInt(level.get("cols_per_tile").toString());
        	total_rows = Integer.parseInt(level.get("total_rows").toString());
        	total_cols = Integer.parseInt(level.get("total_cols").toString());
        	return new TileStat(type, tile_rows,tile_cols,rows_per_tile,cols_per_tile,total_rows,total_cols);
           
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ParseException e) {
            e.printStackTrace();
        }
		return null;
	}
	
	
	/*******************************************************************
	 * METHOD: logStatus
	 *
	 * This sysouts status with date time if logging turned on.
	 ******************************************************************/
	public static void logStatus(String message) throws Exception {
		/* Returns the maximum amount of memory available to 
		   the Java Virtual Machine set by the '-mx' or '-Xmx' flags. */
		long availableMemory = Runtime.getRuntime().maxMemory();

		/* Returns the total memory allocated from the system 
		   (which can at most reach the maximum memory value 
		   returned by the previous function). */
		long allocatedMemory = Runtime.getRuntime().totalMemory();

		/* Returns the free memory *within* the total memory 
		   returned by the previous function. */
		long freeMemory = Runtime.getRuntime().freeMemory();
		String memoryInfo = "   *** JVM Memory Stats - Available: " + availableMemory + " Allocated: " + allocatedMemory + " Free: " + freeMemory;
		
		SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String eventDate = simpleDateFormat.format(new Date());
		
		if (logSysMessages) {
			System.out.println(eventDate + ": " + message + memoryInfo);
		}
		return;
	}
	

	
	
}
