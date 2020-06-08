#!/bin/bash
#Download all the forecast files by running the following python script
. /home/tethys/miniconda/etc/profile.d/conda.sh
conda activate geosdatadownload
datapath=/home/tethys/scripts/AirQuality/downloadGEOSData
cd $datapath
logfile=/mnt/mk_aqx/GEOSDataDownload.log
timestamp=$(date +%Y%m%d%H%M%S)
today=$(date +"%Y%m%d")
echo "\nStarting script combine.sh for $today" >> $logfile

if [ $# -eq 0 ]
then
      echo "date is not passed as an argumnent..proceeding to download today's data" >> $logfile
      python downloadGEOSData.py
else
      python downloadGEOSData.py "$1"
      today=$(date -d "$1" +"%Y%m%d")
      echo "date is passed as an argumnent..proceeding to download $today data" >> $logfile
fi
echo "Working on $today" >> $logfile
#paths to today's 1hour and 3hour .nc files
slv_path=/mnt/mk_aqx/geos_tavg1_2d_slv_Nx/$today.nc
aer_path=/mnt/mk_aqx/geos_tavg3_2d_aer_Nx/$today.nc
home_path=/home/tethys
#path to temporarily store intermediate .nc files while processing
cd $datapath
if [ -f final_combined.nc ]
then 
   rm final_combined.nc
fi
if [ -f slv_subset_file.nc ]
then 
   rm slv_subset_file.nc
fi
if [ -f aer_subset_file.nc ]
then 
   rm aer_subset_file.nc
fi
echo "if slv .nc file exists, get the variables that are required" >> $logfile
#if slv .nc file exists, get the variables that are required
if [ -f $slv_path ]
then
    ncks -O -v QV10M,Q500,Q850,T10M,T500,T850,U10M,V10M,lat,lon,PS $slv_path slv_subset_file.nc
fi
echo "if aer .nc file exists, get the variables that are required" >> $logfile
#if aer .nc file exists, get the variables that are required
echo $aer_path
if [ -f $aer_path ]
then
    ncks -O -v BCSMASS,DUSMASS25,OCSMASS,SO2SMASS,SO4SMASS,SSSMASS25,TOTEXTTAU $aer_path aer_subset_file.nc
    echo "combine slv and aer .nc files" >> $logfile
    ncks -A aer_subset_file.nc slv_subset_file.nc
    echo "calculate wind variable" >> $logfile
    ncap2 -s 'WIND=sqrt(U10M*U10M+V10M*V10M)' slv_subset_file.nc final_combined.nc
    echo "get time array to the final .nc" >> $logfile
    ncap2 -O -s 'timeArray[$time,$lat,$lon]=time' final_combined.nc final_combined.nc
    echo "get latitude array to the final .nc" >> $logfile
    ncap2 -O -s 'latArray[$time,$lat,$lon]=lat' final_combined.nc final_combined.nc
    echo "get longitude array to the final .nc" >> $logfile
    ncap2 -O -s 'lonArray[$time,$lat,$lon]=lon' final_combined.nc final_combined.nc
fi
echo "Processing $today file..." >> $logfile 
#if the final combined .nc file exists, it means the processing and combining was successful, so run the machine learning script using process.py
if [ -f final_combined.nc ]
then
  echo "combined file exists, passing argument $today" >> $logfile
  cd $datapath
  python process.py $today
  if [ $? -eq 0 ]
  then
      echo "script completed running" >> $logfile
  else
     echo "could not run process.py" >> $logfile
  fi
fi
