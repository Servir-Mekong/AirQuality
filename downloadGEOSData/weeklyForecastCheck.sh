declare -a lastWeek=("$(date '+%Y%m%d')" "$(date -d '-1 day' '+%Y%m%d')" "$(date -d '-2 day' '+%Y%m%d')"
"$(date -d '-3 day' '+%Y%m%d')" "$(date -d '-4 day' '+%Y%m%d')" "$(date -d '-5 day' '+%Y%m%d')" "$(date -d '-6 day' '+%Y%m%d')")
set -a missedDownloads

cd /mnt/mk_aqx/geos/
downloadedFiles=`ls *.nc`
missedCount=0

for singledate in "${lastWeek[@]}" ; do

	if [[ ! "${downloadedFiles[@]}" =~ "$singledate.nc" ]]
	   then
		missedDownloads[$missedCount]=$singledate
		missedCount=$(( $missedCount + 1 ))
	fi
done

if [ $missedCount -gt 0 ]
    then
      for day in "${missedDownloads[@]}" ;
       do
        echo $(date -d $day +'%Y-%m-%d')
        cd /home/tethys/scripts/AirQuality/downloadGEOSData/
        sh combine.sh "$(date -d $day +'%Y-%m-%d')"
      done
    else
	    echo "No missed files this week" >> /home/tethys/scripts/AirQuality/`date +\%Y\%m\%d\%H\%M\%S`aqbash.log 2>&1
fi
