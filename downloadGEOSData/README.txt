1. This python script lets you download data from https://portal.nccs.nasa.gov/datashare/gmao/geos-fp/forecast/
2. Currently we are downloading H00 hour data only
3. How to run the script:
   a) Download the folder with scripts from Github. Enter the folder and run "python downloadGEOSData.py". This should download today's data.
   b) If you want to get specific date's data, then run the script like this "python downloadGEOSData.py YYYY-MM-DD". This will download data of the specific date.
4. This script currently stores only the combined files with date on the filename like "YYYYMMDD_forecast.nc"
5. If you want to store the 1hour and 3hour files, please comment lines 197 and 201 from downloadGEOSData.py and run the script.This should let you store all the individual files.
6. Please make sure you edit downloadGEOSDataParams.json file with the file paths that you need.
7. If you think there is any issue while running script, please check the log file in the path that you provided in downloadGEOSDataParams.py