"""Helper Functions for the Controllers Module"""
import os
import xml.etree.ElementTree as ET
import json
from collections import defaultdict
import calendar
from PIL import Image
import numpy as np
import requests
import shapely.geometry
import shapely
import netCDF4
import time
from mapclient.config import THREDDS_CATALOG, THREDDS_wms, DATA_DIR, LOG_DIR
from shapely.geometry import Polygon
import logging
from datetime import datetime
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from django.conf import settings
import xarray as xr
from django.db import connection

def generate_variables_meta():
    """Generate Variables Metadata from the Var Info text"""
    db_file = os.path.join(settings.BASE_DIR, 'air-quality-explorer/static/data/var_info.txt')
    variable_list = []
    with open(db_file, mode='r') as f:
        f.readline()  # Skip first line

        lines = f.readlines()

    for line in lines:
        if line != '':
            line = line.strip()
            linevals = line.split('|')
            variable_id = linevals[0]
            category = linevals[1]
            display_name = linevals[2]
            units = linevals[3]
            vmin = linevals[4]
            vmax = linevals[5]

            try:
                variable_list.append({
                    'id': variable_id,
                    'category': category,
                    'display_name': display_name,
                    'units': units,
                    'min': vmin,
                    'max': vmax,
                })
            except Exception:
                continue
    return variable_list


def gen_thredds_options():
    """Generate THREDDS options for the dropdowns"""
    catalog_url = THREDDS_CATALOG

    catalog_wms = THREDDS_wms
    tinf = defaultdict()
    json_obj = {}


    if catalog_url[-1] != "/":
        catalog_url = catalog_url + '/'

    if catalog_wms[-1] != "/":
        catalog_wms = catalog_wms + '/'

    catalog_xml_url = catalog_url + 'catalog.xml'
    cat_response = requests.get(catalog_xml_url, verify=False)

    cat_tree = ET.fromstring(cat_response.content)
    currentDay = datetime.now().strftime('%d')
    currentMonth = datetime.now().strftime('%m')
    currentYear = datetime.now().strftime('%Y')
    d=currentYear+currentMonth+currentDay
    for elem in cat_tree.iter():
        for k, v in elem.attrib.items():
            if 'title' in k:
                run_xml_url = catalog_url + str(v) +'/catalog.xml'
                run_response = requests.get(run_xml_url, verify=False)
                run_tree = ET.fromstring(run_response.content)
                for ele in run_tree.iter():
                    for ke, va in ele.attrib.items():
                        if 'urlPath' in ke:

                            if va.endswith('.nc') and d not in va and "geos" in va:
                                tinf.setdefault(v, {}).setdefault('3dayrecent', []).append(va)
                            elif va.endswith('.nc') and d in va:
                                tinf.setdefault(v, {}).setdefault('3daytoday', []).append(va)
                            elif va.endswith('.nc') and "geos" not in va:
                                tinf.setdefault(v, {}).setdefault('monthly', []).append(va)
                        if 'title' in ke:
                            mo_xml_url = catalog_url + str(v) + '/'+str(va)+'/catalog.xml'
                            mo_response = requests.get(mo_xml_url, verify=False)
                            mo_tree = ET.fromstring(mo_response.content)
                            for el in mo_tree.iter():
                                for key, val in el.attrib.items():
                                    if 'urlPath' in key:
                                        tinf.setdefault(v, {}).setdefault(va, []).append(val)
    json_obj['catalog'] = tinf

    return json_obj

def get_styles():
    """Returns a list of style tuples"""
    date_obj = {}

    color_opts = [
        {'Rainbow': 'rainbow'},
        {'TMP 1': 'tmp_2maboveground'},
        {'TMP 2': 'dpt_2maboveground'},
        {'SST-36': 'sst_36'},
        {'Greyscale': 'greyscale'},

        {'OCCAM': 'occam'},
        {'OCCAM Pastel': 'occam_pastel-30'},
        {'Red-Blue': 'redblue'},
        {'NetCDF Viewer': 'ncview'},
        {'ALG': 'alg'},
        {'ALG 2': 'alg2'},
        {'Ferret': 'ferret'},
        {'Reflectivity': 'enspmm-refc'},
        # ('Probability', 'prob'),
        # ('White-Blue', whiteblue'),
        # ('Grace', 'grace'),
    ]

    date_obj = color_opts

    return color_opts

def get_time(freq, run_type, run_date):
    # Empty list to store the timeseries values
    ts = []
    json_obj = {}

    """Make sure you have this path for all the run_types(/home/tethys/aq_dir/fire/combined/combined.nc)"""
    infile = os.path.join(DATA_DIR, run_type, run_date)
    nc_fid = netCDF4.Dataset(infile, 'r')  # Reading the netCDF file
    lis_var = nc_fid.variables
    time = nc_fid.variables['time'][:]
    for timestep, v in enumerate(time):
        dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                  calendar=lis_var['time'].calendar)
        time_stamp = calendar.timegm(dt_str.utctimetuple()) * 1000
        ts.append(datetime.strftime(dt_str,'%Y-%m-%dT%H:%M:%SZ'))
    ts.sort()
    json_obj["times"] = ts
    return json_obj

def get_pt_values(s_var, geom_data, freq, run_type, run_date):
    """Helper function to generate time series for a point"""
    logger.info("PARAMETERS : ['" + s_var +"','"+ geom_data +"','"+ freq +"','"+ run_type +"','"+ run_date+"']")
    # Empty list to store the timeseries values
    ts_plot = []

    json_obj = {}

    # Defining the lat and lon from the coords string
    coords = geom_data.split(',')
    stn_lat = float(coords[1])
    stn_lon = float(coords[0])
    """Make sure you have this path for all the run_types(/home/tethys/aq_dir/fire/combined/combined.nc)"""
    if "geos" in run_type:
        infile = os.path.join(DATA_DIR, run_type, run_date)
    else:
        infile = os.path.join(DATA_DIR, run_type, freq, run_date)
    nc_fid = netCDF4.Dataset(infile, 'r',)  # Reading the netCDF file
    lis_var = nc_fid.variables
    """Reading variables from combined.nc"""
    if "geos" == run_type:
        lats = nc_fid.variables['lat'][:]  # Defining the latitude array
        lons = nc_fid.variables['lon'][:]
        field = nc_fid.variables[s_var][:]# Defining the longitude array    else:
        time = nc_fid.variables['time'][:]
        abslat = np.abs(lats - stn_lat)  # Finding the absolute latitude
        abslon = np.abs(lons - stn_lon)  # Finding the absolute longitude
        lat_idx = (abslat.argmin())
        lon_idx = (abslon.argmin())
        for timestep, v in enumerate(time):
            val = field[lat_idx, lon_idx][timestep]
            # if np.isnan(val) == False:
            dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                      calendar=lis_var['time'].calendar)
            time_stamp = calendar.timegm(dt_str.utctimetuple()) * 1000
            ts_plot.append([time_stamp, float(val)])
    else:
        field = nc_fid.variables[s_var][:]
        if "geos" in run_type:
            lats = nc_fid.variables['lat'][:]  # Defining the latitude array
            lons = nc_fid.variables['lon'][:]
        else:
            lats = nc_fid.variables['Latitude'][:]
            lons = nc_fid.variables['Longitude'][:]  # Defining the longitude array
        time = nc_fid.variables['time'][:]
      # Defining the variable array(throws error if variable is not in combined.nc)
        abslat = np.abs(lats - stn_lat)  # Finding the absolute latitude
        abslon = np.abs(lons - stn_lon)  # Finding the absolute longitude
        lat_idx = (abslat.argmin())
        lon_idx = (abslon.argmin())
        for timestep, v in enumerate(time):

            val = field[timestep,lat_idx,lon_idx]
            if np.isnan(val) == False:
                dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                          calendar=lis_var['time'].calendar)
                time_stamp = calendar.timegm(dt_str.utctimetuple()) * 1000
                ts_plot.append([time_stamp, float(val)])

    ts_plot.sort()
    point = [round(stn_lat, 2), round(stn_lon, 2)]
    json_obj["plot"] = ts_plot
    json_obj["geom"] = point
    if len(ts_plot) == 0:
    	logger.warn("The selected point has no data")
    else:
        logger.info("PLOT POINT OBJECT : " + json.dumps(json_obj["plot"]))
    logger.info(json.dumps(json_obj["geom"]))
    return json_obj

#database utils
def get_station_data():
    with connection.cursor() as cursor:
        sql = """SELECT s.rid,s.station_id,s.name_en, s.lat, s."long" as longitude,m.pm25,max(datetime) latest_date
                from stations s,measurements m where s.station_id = m.station_id and pm25 is not null
                group by s.rid, s.station_id, s.name_en, m.pm25,s.lat,longitude limit 20"""
        cursor.execute(sql)
        data = cursor.fetchall()
        stations=[]
        for row in data:
            rid = row[0]
            name=row[2]
            station_id = row[1]
            lat = row[3]
            lon = row[4]
            pm25=row[5]
            latest_date=row[6]
            stations.append({
                'rid': rid,
                'station_id': station_id,
                'latest_date': str(latest_date),
                'lon': lon,
                'lat': lat,
                'pm25': pm25,
                'name':name
            })
        connection.close()
        return stations


def get_current_station(obs_date):
    with connection.cursor() as cursor:
        sql = """SELECT s.rid, s.station_id, m.datetime, s.lat, s.long, m.pm25, s.name_en, m.aqi, m.aqi_level
                from stations s, measurements m
                where s.station_id = m.station_id and pm25 is not null
                and m.datetime = '"""+obs_date+""" 00:00:00'"""
        cursor.execute(sql)
        data = cursor.fetchall()
        stations=[]
        for row in data:
            rid = row[0]
            name=row[6]
            station_id = row[1]
            lat = row[3]
            lon = row[4]
            pm25=row[5]
            latest_date=row[2]
            aqi=row[7]
            aqi_level=row[8]
            stations.append({
                'rid': rid,
                'station_id': station_id,
                'latest_date': str(latest_date),
                'lon': lon,
                'lat': lat,
                'pm25': pm25,
                'name':name,
                'aqi': aqi,
                'aqi_level': aqi_level
            })
        connection.close()
        return stations

def get_pm25_data(s_var, freq, run_type,run_date,station,lat,lon):

    with connection.cursor() as cursor:
        geom_data = lon+',' + lat
        freq=""
        data1 = get_pt_values(s_var, geom_data, freq, run_type, run_date)

        cur = connection.cursor()
        #"2019-08-01 03:00:00"
        date_obj=datetime.strptime(run_date.split('.')[0],"%Y%m%d")
        end_date=date_obj+timedelta(days=2)
        var=date_obj.strftime("%Y-%m-%d %H:%M:%S")
        var1=end_date.strftime("%Y-%m-%d %H:%M:%S")
        cur.execute(("SELECT  datetime, pm25, pm25_unit from measurements where station_id = %s and pm25 is not null and datetime between %s and %s"),(str(station), var, var1,))
        data = cur.fetchall()
        pm25_data={}
        ts_plot = []
        for row in data:
            dt=row[0]
            pm25 = row[1]
            pm25_unit = row[2]
            time_stamp = calendar.timegm(dt.utctimetuple()) * 1000
            ts_plot.append([time_stamp, float(str(pm25))])

        ts_plot.sort()
        pm25_data["plot"] = ts_plot
        pm25_data["plot1"] = data1["plot"]
        print("**************************")
        print(data1)
        pm25_data["geom"] = data1["geom"]
        connection.close()
        return pm25_data
