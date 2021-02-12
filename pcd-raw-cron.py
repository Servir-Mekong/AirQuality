#!/usr/bin/python
# -*- coding: utf-8 -*-


#http://air4thai.pcd.go.th/webV2/history/api/data.php?stationID=02t&param=PM25,PM10,O3,CO,NO2,SO2,AQI&type=hr&sdate=1980-01-01&edate=2019-10-30

import logging
logging.basicConfig(filename='/home/ubuntu/pcd_cron/nrt.access.log', level=logging.INFO)

import psycopg2
import json
import requests
import datetime
from time import ctime

string_today = (datetime.date.today() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
_7dayago = (datetime.date.today() + datetime.timedelta(days=-150)).strftime("%Y-%m-%d")

station_list = '02t,03t,05t,08t,10t,11t,12t,13t,14t,16t,17t,18t,19t,20t,21t,22t,24t,25t,26t,27t,28t,29t,30t,31t,32t,33t,34t,35t,36t,37t,38t,39t,40t,41t,42t,43t,44t,46t,47t,50t,52t,53t,54t,57t,58t,59t,60t,61t,62t,63t,67t,68t,69t,70t,71t,72t,73t,74t,75t,76t,77t,79t,80t,81t,82t,83t,84t,m1,m4,m8,m9,o10,o20,o22,o23,o24,o25,o26,o27,o28,o29'
#station_list = '40t,41t,42t,43t,44t,46t,47t,50t,52t,53t,54t,57t,58t,59t,60t,61t,62t,63t,67t,68t,69t,70t,71t,72t,73t,74t,75t,76t,77t,79t,80t,81t,82t,83t,84t,m1,m4,m8,m9,o10,o20,o22,o23,o24,o25,o26,o27,o28,o29'

baseurl = "http://air4thai.pcd.go.th/webV2/history/api/data.php?stationID={}&param=PM25,PM10,O3,CO,NO2,SO2&type=hr&sdate="+ _7dayago +"&edate=" + string_today
print(baseurl)

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

#units = {
#    'µg/m³': 1,
#    'ppb'  : 2,
#    'ppm'  : 3
#}

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

    conn, cur = connect_to_db(db)
    cur.execute("SELECT station_id FROM stations")
    station_names = cur.fetchall()
    close_connection(conn, cur)

    for station_name in station_names:
        try:
            print('**************************')
            print(station_name[0])
            response = requests.get(baseurl.format(station_name[0]))
            reply = response.json()
            stations = reply['stations']
            if (len(stations)):
                conn, cur = connect_to_db(db)
                stations = stations[0]
                data = stations['data']
                for _data in data:
                    station_id = station_name[0]
                    datetime = _data['DATETIMEDATA']

                    if 'CO' in _data:
                        co = _data['CO']
                        if co == '-':
                            co = None
                    else:
                        co = None
                    co_unit = measurement_units['co_unit']

                    if 'NO2' in _data:
                        no2 = _data['NO2']
                        if no2 == '-':
                            no2 = None
                    else:
                        no2 = None
                    no2_unit = measurement_units['no2_unit']

                    if 'SO2' in _data:
                        so2 = _data['SO2']
                        if so2 == '-':
                            so2 = None
                    else:
                        so2 = None
                    so2_unit = measurement_units['so2_unit']

                    if 'O3' in _data:
                        o3 = _data['O3']
                        if o3 == '-':
                            o3 = None
                    else:
                        o3 = None
                    o3_unit = measurement_units['o3_unit']

                    if 'PM10' in _data:
                        pm10 = _data['PM10']
                        if pm10 == '-':
                            pm10 = None
                    else:
                        pm10 = None
                    pm10_unit = measurement_units['pm10_unit']

                    if 'PM25' in _data:
                        pm25 = _data['PM25']
                        if pm25 == '-':
                            pm25 = None
                    else:
                        pm25 = None
                    pm25_unit = measurement_units['pm25_unit']

                    check_query = "SELECT rid FROM nrt_measurements WHERE station_id='%s' and datetime='%s' LIMIT 1;" % (station_name[0], datetime)
                    cur.execute(check_query)
                    exists = cur.fetchone()
                    if exists:
                        cur.execute("UPDATE nrt_measurements SET station_id=%s, datetime=%s, co=%s, co_unit=%s, no2=%s, no2_unit=%s, so2=%s, so2_unit=%s, o3=%s, o3_unit=%s, pm10=%s, pm10_unit=%s, pm25=%s, pm25_unit=%s WHERE rid=%s;", (station_id, datetime, co, co_unit, no2, no2_unit, so2, so2_unit, o3, o3_unit, pm10, pm10_unit, pm25, pm25_unit, exists[0]))
                        conn.commit()
                    else:
                        cur.execute("INSERT INTO nrt_measurements (station_id, datetime, co, co_unit, no2, no2_unit, so2, so2_unit, o3, o3_unit, pm10, pm10_unit, pm25, pm25_unit) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);", (station_id, datetime, co, co_unit, no2, no2_unit, so2, so2_unit, o3, o3_unit, pm10, pm10_unit, pm25, pm25_unit))
                        conn.commit()

                close_connection(conn, cur)
                print("*************************************")
        except Exception as e:
            logging.error('error occured: {} \n'.format(e))

if __name__ == '__main__':
    main()
