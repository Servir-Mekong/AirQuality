declare -a lastWeek=("$(date '+%Y%m%d')" "$(date -d '-1 day' '+%Y%m%d')" "$(date -d '-2 day' '+%Y%m%d')"
"$(date -d '-3 day' '+%Y%m%d')" "$(date -d '-4 day' '+%Y%m%d')" "$(date -d '-5 day' '+%Y%m%d')" "$(date -d '-6 day' '+%Y%m%d')")
set -a missedDownloads

cd /mnt/mk_aqx/geos/
downloadedFiles=`ls *.nc`
missedCount=0
for file in $downloadedFiles
do
    for singledate in "${lastWeek[@]}" ; do

        if [ "$file" -ne "$singledate.nc" ]
            missedDownloads[$j]=$singledate
            missedCount=$(( $missedCount + 1 ))
        fi
    done
done
if [ $missedCount -ge 0 ]
    then
      for day in "${missedDownloads[@]}" ;
       do
        echo $(date -d $day +'%Y-%m-%d')
        cd /home/tethys/scripts/AirQuality/downloadGEOSData/
        sh combine.sh "$(date -d $day +'%Y-%m-%d')"
      done
fi
