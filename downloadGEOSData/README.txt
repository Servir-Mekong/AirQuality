1. The combine.sh script lets you download data from https://portal.nccs.nasa.gov/datashare/gmao/geos-fp/forecast/ and process it using machine learning algorithm
2. Currently we are downloading H00 hour data only
3. How to run the script:
   a) Download the folder with scripts from Github. Enter the folder and run "sh combine.sh". This should download today's data.
   b) If you want to get specific date's data, then run the script like this "sh combine.sh YYYY-MM-DD". This will download data of the specific date.
4. This script currently stores only the processed files with date on the filename like "YYYYMMDD.nc"
5. Please make sure you edit downloadGEOSDataParams.json file with the file paths that you need.
6. If you think there is any issue while running script, please check the log file in the path that you provided in downloadGEOSDataParams.json

Avoiding missing files problem:
-------------------------------

The weeklyForecastCheck.sh script checks the /geos data path for last week's files. If any files are missing, it runs the combine.sh script for those dates. This script can be scheduled to run same day every week(For example: Saturday night)