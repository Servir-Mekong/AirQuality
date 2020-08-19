declare -a lastWeek=("$(date +"%Y%m%d")" "$(date -d '-1 day' '+%Y%m%d')" "$(date -d '-2 day' '+%Y%m%d')"
"$(date -d '-3 day' '+%Y%m%d')" "$(date -d '-4 day' '+%Y%m%d')" "$(date -d '-5 day' '+%Y%m%d')" "$(date -d '-6 day' '+%Y%m%d')")
#declare -a lastWeek=("$(date +"%Y%m%d")")
declare -a test

cd /home/tethys/aq_dir/geos/
yourfilenames=`ls *.nc`
j=0
for eachfile in $yourfilenames
do
    for i in "${lastWeek[@]}" ; do

        if [ "$eachfile" == "$i.nc" ]
            then echo "executing your bash script file"
            #./myscript.sh
        else
            echo $j
            test[$j]=$i
            j=$(( $j + 1 ))

        fi

    done
done
if [ $j -ge 0 ]
    then
      for day in "${test[@]}" ;
       do
        echo $(date -d $day +'%Y-%m-%d')
        cd /home/tethys/tethyssco/AirQuality-downloadGEOSData/downloadGEOSData/
        sh combine.sh $(date -d $day +'%Y-%m-%d')
      done
fi