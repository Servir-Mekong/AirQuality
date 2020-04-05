"""Helper Functions for the Controllers Module"""
import os
import sys
import shapely
import calendar
import netCDF4
import logging
import numpy as np
from datetime import datetime,timedelta
import psycopg2
import json
import requests
from PIL import Image,ImageFile,ImageFont,ImageDraw,ImageChops,ImageOps
from django.views.decorators.csrf import csrf_exempt
import config as cfg
from geopy.distance import great_circle
from geopy.distance import geodesic
from itertools import *
currentDay = datetime.now().strftime('%d')
currentMonth = datetime.now().strftime('%m')
currentYear = datetime.now().strftime('%Y')
yesterday = datetime.now() - timedelta(days = 1)
if len(sys.argv)==2:
    date_str = sys.argv[1]
    try:
       date_obj = datetime.strptime(date_str, '%Y-%m-%d')
       currentDay = date_obj.strftime('%d')
       currentMonth = date_obj.strftime('%m')
       currentYear = date_obj.strftime('%Y')
       yesterday = date_obj - timedelta(days = 1)

    except:
       print('Please enter date in YYYY-MM-DD format')
       logging.error('Date was not in YYYY-MM-DD format')
       sys.exit()
run_date = currentYear + currentMonth + currentDay + '.nc'
print(run_date)

def insert_pm25_forecast_data(conn,station_index,station):
    try:
        print(station_index)
        forecast_data = get_forecast_values(station['lon'], station['lat'], run_date)
        cur = conn.cursor()
        fcast_vals=[]
        forecast_obj={
            "station_id":station['station_id'],
            "datetime":"",
            "bc_mlpm25":"",
            "bcsmass":"",
            "dusmass25":"",
            "geospm25":"",
            "ocsmass":"",
            "pm25":"",
            "ps":"",
            "q500":"",
            "q850":"",
            "qv10m":"",
            "so2smass":"",
            "so4smass":"",
            "sssmass25":"",
            "t10m":"",
            "t500":"",
            "t850":"",
            "totexttau":"",
            "u10m":"",
            "v10m":"",
            "wind":""
        }
        times_all=[map(lambda f: f[1], forecast) for forecast in forecast_data['plot']]
        # for time in times_all:
        #     if time not in times:
        #         times.append(time)
        times = [time for time in times_all if time not in times_all]
        for dt in times:
            for fcast in [f[1] for f in forecast_data['plot'] if f[1][1]==dt]:
                fcast_var=fcast[0]
                fcast_val=fcast[2]
                forecast_obj['datetime'] = dt
                if fcast_var=='bc_mlpm25':
                    forecast_obj['bc_mlpm25']=fcast_val
                bc_mlpm25_unit=1
                if fcast_var == 'bcsmass':
                    forecast_obj['bcsmass'] = fcast_val
                bcsmass_unit=1
                if fcast_var == 'dusmass25':
                    forecast_obj['dusmass25'] = fcast_val
                dusmass25_unit=1
                if fcast_var == 'geospm25':
                    forecast_obj['geospm25'] = fcast_val
                geospm25_unit=1
                if fcast_var == 'ocsmass':
                    forecast_obj['ocsmass'] = fcast_val
                ocsmass_unit=1
                if fcast_var == 'pm25':
                    forecast_obj['pm25'] =fcast_val
                pm25_unit=1
                if fcast_var == 'ps':
                    forecast_obj['ps'] = fcast_val
                ps_unit=4
                if fcast_var == 'q500':
                    forecast_obj['q500'] = fcast_val
                q500_unit=5
                if fcast_var == 'q850':
                    forecast_obj['q850'] = fcast_val
                q850_unit=5
                if fcast_var == 'qv10m':
                    forecast_obj['qv10m'] = fcast_val
                qv10m_unit=5
                if fcast_var == 'so2smass':
                    forecast_obj['so2smass'] = fcast_val
                so2mass_unit=1
                if fcast_var== 'so4smass':
                    forecast_obj['so4smass'] = fcast_val
                so4mass_unit=1
                if fcast_var== 'sssmass25':
                    forecast_obj['sssmass25'] = fcast_val
                sssmass25_unit=1
                if fcast_var == 't10m':
                    forecast_obj['t10m']= fcast_val
                t10m_unit=6
                if fcast_var == 't500':
                    forecast_obj['t500'] = fcast_val
                t500_unit=6
                if fcast_var == 't850':
                    forecast_obj['t850'] = fcast_val
                t850_unit=6
                if fcast_var == 'totexttau':
                    forecast_obj['totexttau'] = fcast_val
                totexttau_unit=7
                if fcast_var == 'u10m':
                    forecast_obj['u10m'] = fcast_val
                u10m_unit=8
                if fcast_var == 'v10m':
                    forecast_obj['v10m'] = fcast_val
                v10m_unit=8
                if fcast_var == 'wind':
                    forecast_obj['wind'] = fcast_val
                wind_unit=8
            fcast_vals.append(forecast_obj)
            forecast_obj={
                "station_id":station['station_id'],
                "datetime":"",
                "bc_mlpm25":"",
                "bcsmass":"",
                "dusmass25":"",
                "geospm25":"",
                "ocsmass":"",
                "pm25":"",
                "ps":"",
                "q500":"",
                "q850":"",
                "qv10m":"",
                "so2smass":"",
                "so4smass":"",
                "sssmass25":"",
                "t10m":"",
                "t500":"",
                "t850":"",
                "totexttau":"",
                "u10m":"",
                "v10m":"",
                "wind":""
            }
        for forecast_obj in fcast_vals:
            sql="""INSERT INTO geos_forecast(
                station_id, datetime, bc_mlpm25, bc_mlpm25_unit, bcsmass, 
                bcsmass_unit, dusmass25, dusmass25_unit, geospm25, geospm25_unit, 
                ocsmass, ocsmass_unit, pm25, pm25_unit, ps, ps_unit, q500, q500_unit, 
                q850, q850_unit, qv10m, qv10m_unit, so2smass, so2smass_unit, so4smass, 
                so4smass_unit, sssmass25, sssmass25_unit, t10m, t10m_unit, t500, 
                t500_unit, t850, t850_unit, totexttau, totexttau_unit, u10m, 
                u10m_unit, v10m, v10m_unit, wind, wind_unit,lat,lon,station_index,init_date)
                VALUES ( {0},{1}, {2}, {3}, {4}, 
                        {5}, {6}, {7}, {8}, {9}, 
                        {10}, {11}, {12}, {13}, {14}, {15}, {16}, {17}, 
                        {18}, {19}, {20}, {21}, {22}, {23}, {24}, 
                        {25}, {26}, {27}, {28}, {29}, {30}, 
                        {31}, {32}, {33}, {34}, {35}, {36}, 
                        {37}, {38}, {39}, {40}, {41},{42},{43},{44},{45}) RETURNING rid""".format("'"+forecast_obj['station_id']+"'", "'"+str(forecast_obj['datetime'])+"'", forecast_obj['bc_mlpm25'],
            bc_mlpm25_unit, forecast_obj['bcsmass'],bcsmass_unit, forecast_obj['dusmass25'], dusmass25_unit, forecast_obj['geospm25'], geospm25_unit,forecast_obj['ocsmass'],
            ocsmass_unit, forecast_obj['pm25'], pm25_unit, forecast_obj['ps'], ps_unit, forecast_obj['q500'], q500_unit,forecast_obj['q850'], q850_unit, forecast_obj['qv10m'],
            qv10m_unit, forecast_obj['so2smass'], so2mass_unit,forecast_obj['so4smass'],so4mass_unit, forecast_obj['sssmass25'], sssmass25_unit, forecast_obj['t10m'], t10m_unit,
            forecast_obj['t500'],t500_unit, forecast_obj['t850'], t850_unit, forecast_obj['totexttau'], totexttau_unit, forecast_obj['u10m'],u10m_unit, forecast_obj['v10m'],
            v10m_unit, forecast_obj['wind'], wind_unit,forecast_data['lat'],forecast_data['lon'],station_index,"'"+currentYear+"-"+currentMonth+"-"+currentDay+" 07:00:00'")

            cur.execute(sql)
            rid = cur.fetchone()[0]
            print(str(rid))
        conn.commit()
        cur.close()
        return "done"
    except Exception as e:
        return ""

@csrf_exempt
def get_forecast_values(lon,lat, run_date):
    json_obj = {}
    plot_arr=[]
    stn_lat = float(lat)
    stn_lon = float(lon)
    st_point=(stn_lat,stn_lon)
    try:
        infile = os.path.join(cfg.connection["geosDataPath"], run_date)
        nc_fid = netCDF4.Dataset(infile, 'r',)  # Reading the netCDF file
        lis_var = nc_fid.variables
        var_array= [
                "bc_mlpm25",
                "bcsmass",
                "dusmass25",
                "geospm25",
                "ocsmass",
                "pm25",
                "ps",
                "q500",
                "q850",
                "qv10m",
                "so2smass",
                "so4smass",
                "sssmass25",
                "t10m",
                "t500",
                "t850",
                "totexttau",
                "u10m",
                "v10m",
                "wind"]

        lats = nc_fid.variables['lat'][:]
        lons = nc_fid.variables['lon'][:]  # Defining the longitude array
        time = nc_fid.variables['time'][:]
        # Defining the variable array(throws error if variable is not in combined.nc)
        abslat = np.abs(lats - stn_lat)  # Finding the absolute latitude
        abslon = np.abs(lons - stn_lon)  # Finding the absolute longitude
        coordinates = list(product(lats, lons))
        dist = []
        # for val in coordinates:
        #      dist.append(great_circle(val, st_point).kilometers)
        dist = [great_circle(d, st_point).kilometers for d in coordinates]
        index = np.argmin(np.array(dist))
        lat = coordinates[index][0]
        lon = coordinates[index][1]
        latid = [l for l in range(len(lats)) if lat == lats[l]]
        lat_idx = latid[0]
        lonid = [l for l in range(len(lons)) if lon == lons[l]]
        lon_idx = lonid[0]
        for var in var_array:
            ts_plot = []
            field = nc_fid.variables[var.upper()][:]
            ts_plot = [get_plot_val(timestep,field[lat_idx, lon_idx][timestep],lis_var,var) for timestep,v in enumerate(time) if np.isnan(field[lat_idx, lon_idx][timestep]) == False]
            ts_plot.sort()
            #point = [round(stn_lat, 2), round(stn_lon, 2)]
            plot_arr.append(ts_plot)
        json_obj={ 'plot':	plot_arr,'lat':lat,'lon':lon}
        return json_obj
    except Exception as e:
        return json_obj
def get_plot_val(timestep,val,lis_var,var):
    dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                              calendar=lis_var['time'].calendar)
    return [var, dt_str + timedelta(hours=7), float(val)]
def get_station_data(conn):
    try:
        cur = conn.cursor()
        sql = """SELECT  station_id,name_en,lat,"long" FROM stations"""
        cur.execute(sql)
        data = cur.fetchall()
        stations=[]
        for row in data:
            name = row[1]
            station_id = row[0]
            lat = row[2]
            lon = row[3]
            stations.append({
                'station_id': station_id,
                'name': name,
                'lon': lon,
                'lat': lat,
            })
        return stations
    except Exception as e:
        return ["error"]
conn = psycopg2.connect(
            "dbname={0} user={1} host={2} password={3}".format(cfg.connection['dbname'], cfg.connection['user'],
                                                               cfg.connection['host'], cfg.connection['password']))
stations=get_station_data(conn)
res=[insert_pm25_forecast_data(conn,index+1,station) for index,station in enumerate(stations)]
conn.close()
