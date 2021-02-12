#!/usr/bin/python
# -*- coding: utf-8 -*-


#http://air4thai.pcd.go.th/webV2/history/api/data.php?stationID=02t&param=PM25,PM10,O3,CO,NO2,SO2,AQI&type=hr&sdate=1980-01-01&edate=2019-10-30

import logging
logging.basicConfig(filename='/home/ubuntu/pcd_cron/access.log', level=logging.INFO)

import psycopg2
import json
import requests
from time import ctime

baseurl = "http://air4thai.pcd.go.th/services/getNewAQI_JSON.php"

def connect_to_db(db):
    try:
        connection_parameters = 'dbname=%s user=%s host=%s password=%s' % (db['dbname'], db['user'], db['host'], db['password'])
        conn = psycopg2.connect(connection_parameters)
    except:
        print('problem connecting to the database!')
    else:
        return conn, conn.cursor()

def close_connection(cur, conn):
    cur.close()
    conn.close()

db = {
    'dbname'  : 'PUT_YOUR_DATABASE_NAME',
    'user'    : 'YOUR_USERNAME',
    'host'    : 'PUT_HOST_IP',
    'password': 'YOUR_PASSWORD'
}

units = {
    'µg/m³': 1,
    'ppb'  : 2,
    'ppm'  : 3
}

measurement_units = {
    'co_unit'  : 3,
    'no2_unit' : 2,
    'so2_unit' : 2,
    'o3_unit'  : 2,
    'pm10_unit': 1,
    'pm25_unit': 1
}

def main():
    logging.info('started cron tab on {}\n'.format(ctime()))
    response = requests.get(baseurl)
    response = response.json()
    stations = response['stations']

    if not len(stations):
        logging.info('no data available for {}\n'.format(ctime()))

    for station in stations:
        try:
            station_id = station['stationID']
            LastUpdate = station['LastUpdate']
            datetime = '{} {}:00'.format(LastUpdate['date'], LastUpdate['time'])

            # measurements
            if 'PM25' in LastUpdate:
                pm25 = LastUpdate['PM25']['value']
                if pm25 == '-' or pm25 == 'N/A':
                    pm25 = None
            else:
                pm25 = None
            #pm25_unit = units[LastUpdate['PM25']['unit']] or measurement_units['pm25_unit']
            pm25_unit = measurement_units['pm25_unit']

            if 'PM10' in LastUpdate:
                pm10 = LastUpdate['PM10']['value']
                if pm10 == '-' or pm10 == 'N/A':
                    pm10 = None
            else:
                pm10 = None
            pm10_unit = measurement_units['pm10_unit']

            if 'O3' in LastUpdate:
                o3 = LastUpdate['O3']['value']
                if o3 == '-' or o3 == 'N/A':
                    o3 = None
            else:
                o3 = None
            o3_unit = measurement_units['o3_unit']

            if 'CO' in LastUpdate:
                co = LastUpdate['CO']['value']
                if co == '-' or co == 'N/A':
                    co = None
            else:
                co = None
            co_unit = measurement_units['co_unit']

            if 'NO2' in LastUpdate:
                no2 = LastUpdate['NO2']['value']
                if no2 == '-' or no2 == 'N/A':
                    no2 = None
            else:
                no2 = None
            no2_unit = measurement_units['no2_unit']

            if 'SO2' in LastUpdate:
                so2 = LastUpdate['SO2']['value']
                if so2 == '-' or so2 == 'N/A':
                    so2 = None
            else:
                so2 = None
            so2_unit = measurement_units['so2_unit']

            if 'AQI' in LastUpdate:
                aqi = LastUpdate['AQI']['aqi']
                if aqi == '-' or aqi == 'N/A':
                    aqi = None

                aqi_level = LastUpdate['AQI']['Level']
                if aqi_level == '-' or aqi_level == 'N/A':
                    aqi_level = None
            else:
                aqi = None
                aqi_level = None

            check_query = "SELECT rid FROM measurements WHERE station_id='%s' and datetime='%s' LIMIT 1;" % (station_id, datetime)
            conn, cur = connect_to_db(db)
            cur.execute(check_query)
            exists = cur.fetchone()
            if exists:
                cur.execute("UPDATE measurements SET station_id=%s, datetime=%s, co=%s, co_unit=%s, no2=%s, no2_unit=%s, so2=%s, so2_unit=%s, o3=%s, o3_unit=%s, pm10=%s, pm10_unit=%s, pm25=%s, pm25_unit=%s, aqi=%s, aqi_level=%s WHERE rid=%s;", (station_id, datetime, co, co_unit, no2, no2_unit, so2, so2_unit, o3, o3_unit, pm10, pm10_unit, pm25, pm25_unit, aqi, aqi_level, exists[0]))
                #print(cur.mogrify("UPDATE measurements SET station_id=%s, datetime=%s, co=%s, co_unit=%s, no2=%s, no2_unit=%s, so2=%s, so2_unit=%s, o3=%s, o3_unit=%s, pm10=%s, pm10_unit=%s, pm25=%s, pm25_unit=%s, aqi=%s, aqi_level=%s WHERE rid=%s;", (station_id, datetime, co, co_unit, no2, no2_unit, so2, so2_unit, o3, o3_unit, pm10, pm10_unit, pm25, pm25_unit, aqi, aqi_level, exists[0])))
                conn.commit()
            else:
                cur.execute("INSERT INTO measurements (station_id, datetime, co, co_unit, no2, no2_unit, so2, so2_unit, o3, o3_unit, pm10, pm10_unit, pm25, pm25_unit, aqi, aqi_level) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);", (station_id, datetime, co, co_unit, no2, no2_unit, so2, so2_unit, o3, o3_unit, pm10, pm10_unit, pm25, pm25_unit, aqi, aqi_level))
                #print(cur.mogrify("INSERT INTO measurements (station_id, datetime, co, co_unit, no2, no2_unit, so2, so2_unit, o3, o3_unit, pm10, pm10_unit, pm25, pm25_unit, aqi, aqi_level) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);", (station_id, datetime, co, co_unit, no2, no2_unit, so2, so2_unit, o3, o3_unit, pm10, pm10_unit, pm25, pm25_unit, aqi, aqi_level)))
                conn.commit()
            close_connection(conn, cur)
        except Exception as e:
            logging.error('error occured: {} \n'.format(e))

if __name__ == '__main__':
    main()
