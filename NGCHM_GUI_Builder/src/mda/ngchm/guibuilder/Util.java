package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.nio.file.Files;
import java.nio.file.Paths;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public class Util {
	/*
	 * Open the uploaded matrix and return the top left corner of it as a json string.
	 */
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
				topMatrix[rowNum][colNum] = toks[colNum];
				colNum++;
			}
			line = rdr.readLine();
			rowNum++;
		}
		rdr.close();
		
		String jsonMatrixTop = gson.toJson(topMatrix); 
		return jsonMatrixTop;
	}
	
	public static void backupWorking(String workingMatrix) throws Exception {
		String saveWorking = workingMatrix + ".sav";
		if (new File(saveWorking).exists())
			return;
		Files.copy(Paths.get(workingMatrix), Paths.get(saveWorking));
	}

	public static void restoreWorking(String workingMatrix) throws Exception {
		String saveWorking = workingMatrix + ".sav";
		new File(workingMatrix).delete();
		Files.copy(Paths.get(saveWorking), Paths.get(workingMatrix));
	}
	
	public static String copyWorkingToTemp(String workingMatrix) throws Exception {
		String tmpWorking = workingMatrix + ".tmp";
		if (new File(tmpWorking).exists())
			new File(tmpWorking).delete();
		new File(workingMatrix).renameTo(new File(tmpWorking));
		return tmpWorking;
	}

	public static boolean isNumeric(String str)	{
	  try  {  
	    @SuppressWarnings("unused")
		double d = Double.parseDouble(str);
	  }   catch(Exception e)  { 
	    return false;  
	  }  
	  return true;  
	}
	
}
