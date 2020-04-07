#!/bin/bash
#Download all the forecast files by running the following python script
export PATH="/home/Socrates/spulla/tethys/miniconda/bin/:$PATH"
. /home/Socrates/spulla/tethys/miniconda/etc/profile.d/conda.sh
conda activate geosdatadownload
export PATH="/home/Socrates/spulla/tethys/miniconda/bin:$PATH"
datapath=/home/Socrates/spulla/AirQuality/insertGEOSData
cd $datapath
logfile=/home/Socrates/spulla/AirQuality/insertGEOSData/GEOSDataInsert.log
timestamp=$(date +%Y%m%d%H%M%S)
today=$(date +"%Y%m%d")
echo "\nStarting script insert.sh for $today" >> $logfile

if [ $# -eq 0 ]
then
      echo "date is not passed as an argumnent..proceeding to download today's data" >> $logfile
      python insertGEOSDataToDatabase.py
else
      python insertGEOSDataToDatabase.py "$1"
      today=$(date -d "$1" +"%Y%m%d")
      echo "date is passed as an argumnent..proceeding to download $today data" >> $logfile
fi
