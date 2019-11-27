#!/bin/bash
#Download all the forecast files by running the following python script
python downloadGEOSData.py
today=$(date +"%Y%m%d")
#paths to today's 1hour and 3hour .nc files
slv_path=/home/tethys/geos_tavg1_2d_slv_Nx/$today.nc
aer_path=/home/tethys/geos_tavg3_2d_aer_Nx/$today.nc
home_path=/home/tethys
#path to temporarily store intermediate .nc files while processing
datapath=/home/tethys/downloadGEOSData
cd $datapath
#if slv .nc file exists, get the variables that are required
if [ -f $slv_path ]
then
    ncks -v QV10M,Q500,Q850,T10M,T500,T850,U10M,V10M,lat,lon,PS $slv_path slv_subset_file.nc
fi
#if aer .nc file exists, get the variables that are required
if [ -f $aer_path ]
then
    ncks -v BCSMASS,DUSMASS25,OCSMASS,SO2SMASS,SO4SMASS,SSSMASS25,TOTEXTTAU $aer_path aer_subset_file.nc
    #combine slv and aer .nc files
    ncks -A aer_subset_file.nc slv_subset_file.nc
    #calculate wind variable
    ncap2 -s 'WIND=sqrt(U10M*U10M+V10M*V10M)' slv_subset_file.nc final_combined.nc
    #get time array to the final .nc
    ncap2 -O -s 'timeArray[$time,$lat,$lon]=time' final_combined.nc final_combined.nc
    #get latitude array to the final .nc
    ncap2 -O -s 'latArray[$time,$lat,$lon]=lat' final_combined.nc final_combined.nc
    #get longitude array to the final .nc
    ncap2 -O -s 'lonArray[$time,$lat,$lon]=lon' final_combined.nc final_combined.nc
fi
echo "Processing $today file..."
#if the final combined .nc file exists, it means the processing and combining was successful, so run the machine learning script using process.py
if [ -f final_combined.nc ]
then
    python process.py
fi
