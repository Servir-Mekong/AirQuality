"""Helper Functions for the Controllers Module"""
import os
import xml.etree.ElementTree as ET
import json
from collections import defaultdict
import calendar
from PIL import Image
import numpy as np
import requests
from django.http import HttpResponse
import shapely.geometry
import shapely
import netCDF4
import time
from mapclient.config import THREDDS_CATALOG, THREDDS_wms, DATA_DIR, LOG_DIR, THREDDS_OPANDAP
from shapely.geometry import Polygon
import logging
from datetime import datetime, timedelta
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from django.conf import settings
import xarray as xr
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from geopy.distance import great_circle
from geopy.distance import geodesic
from itertools import *

logger = logging.getLogger('controllers.py')
logger.setLevel(logging.DEBUG)
handler = logging.handlers.RotatingFileHandler(LOG_DIR+'/MKAQX.log', maxBytes=104857600, backupCount=5)
logger.addHandler(handler)
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('"%(asctime)s" , "%(name)s" , "%(levelname)s" , "%(message)s"')
ch.setFormatter(formatter)
handler.setFormatter(formatter)
logger.addHandler(ch)

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
            if 'title' in k and ("geos" in v or "fire" in v or "aod" in v):
                run_xml_url = catalog_url + str(v) +'/catalog.xml'
                run_response = requests.get(run_xml_url, verify=False)
                run_tree = ET.fromstring(run_response.content)
                for ele in run_tree.iter():
                    for ke, va in ele.attrib.items():
                        if 'urlPath' in ke:
                            if va.endswith('.nc') and d in va  and "geos" in va:
                                tinf.setdefault(v, {}).setdefault('3daytoday', []).append(va)
                                tinf.setdefault(v, {}).setdefault('3dayrecent', []).append(va)
                            elif va.endswith('.nc') and d not in va and "geos" in va:
                                tinf.setdefault(v, {}).setdefault('3dayrecent', []).append(va)
                            elif va.endswith('.nc') and "geos" not in va:
                                tinf.setdefault(v, {}).setdefault('monthly', []).append(va)
                        if 'title' in ke and ("combined" in va):
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
        {'PM25': 'pm25'},
        {'Browse Color Scale': 'browse'},
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
    #infile = os.path.join(DATA_DIR, run_type, run_date)

    infile = THREDDS_OPANDAP+"/"+run_type+"/"+run_date
    nc_fid = netCDF4.Dataset(infile, 'r')  # Reading the netCDF file
    lis_var = nc_fid.variables
    time = nc_fid.variables['time'][:]
    for timestep, v in enumerate(time):
        dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                  calendar=lis_var['time'].calendar)

        dt_str = datetime.strptime(dt_str.isoformat(),"%Y-%m-%dT%H:%M:%S")

        time_stamp = calendar.timegm(dt_str.utctimetuple()) * 1000
        ts.append(datetime.strftime(dt_str,'%Y-%m-%dT%H:%M:%SZ'))
    ts.sort()
    json_obj["times"] = ts
    return json_obj

@csrf_exempt
def get_pt_values(s_var, geom_data, freq, run_type, run_date):
    """Helper function to generate time series for a point"""
    logger.info("PARAMETERS : ['" + s_var + "','" + geom_data + "','" + freq + "','" + run_type + "','" + run_date+"']")
    # Empty list to store the timeseries values
    ts_plot = []
    ts_plot_pm25 = []
    ts_plot_bcpm25 = []
    ts_plot_geospm25 = []
    s_var1 = 'PM25'
    s_var2 = 'BC_MLPM25'
    s_var3 = 'GEOSPM25'

    json_obj = {}

    # Defining the lat and lon from the coords string
    coords = geom_data.split(',')
    stn_lat = float(coords[1])
    stn_lon = float(coords[0])
    st_point=(stn_lat,stn_lon)

    try:
        if "geos" in run_type:
            """access netcdf file via Thredds server OPANDAP"""
            #infile = os.path.join(THREDDS_OPANDAP, run_type, run_date)
            infile = THREDDS_OPANDAP+"/"+ run_type+"/"+ run_date
        else:
            """Make sure you have this path for all the run_types(/home/tethys/aq_dir/fire/combined/combined.nc)"""
            infile = os.path.join(DATA_DIR, run_type, freq, run_date)
        nc_fid = netCDF4.Dataset(infile, 'r',)  # Reading the netCDF file
        lis_var = nc_fid.variables

        if "geos" == run_type and "PM25" in s_var:
            field = nc_fid.variables[s_var][:]
            lats = nc_fid.variables['lat'][:]
            lons = nc_fid.variables['lon'][:]  # Defining the longitude array
            time = nc_fid.variables['time'][:]
            abslat = np.abs(lats - stn_lat)  # Finding the absolute latitude
            abslon = np.abs(lons - stn_lon)  # Finding the absolute longitude
            lat_idx = (abslat.argmin())
            lon_idx = (abslon.argmin())
            for timestep, v in enumerate(time):
                val = field[lat_idx, lon_idx][timestep]
                if np.isnan(val) == False:
                    dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                              calendar=lis_var['time'].calendar)
                    dtt = dt_str.strftime('%Y-%m-%dT%H:%M:%SZ')
                    dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                    time_stamp = calendar.timegm(dt.utctimetuple()) * 1000
                    ts_plot.append([time_stamp, round(float(val))])
            field1 = nc_fid.variables[s_var1][:]
            lats = nc_fid.variables['lat'][:]
            lons = nc_fid.variables['lon'][:]  # Defining the longitude array
            time = nc_fid.variables['time'][:]
            abslat = np.abs(lats - stn_lat)  # Finding the absolute latitude
            abslon = np.abs(lons - stn_lon)  # Finding the absolute longitude
            lat_idx = (abslat.argmin())
            lon_idx = (abslon.argmin())
            for timestep, v in enumerate(time):

                val = field1[lat_idx, lon_idx][timestep]
                if np.isnan(val) == False:
                    dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                              calendar=lis_var['time'].calendar)
                    test = dt_str + timedelta(hours=7)
                    time_stamp = calendar.timegm(test.timetuple()) * 1000
                    ts_plot_pm25.append([time_stamp, round(float(val))])
            field2 = nc_fid.variables[s_var2][:]
            lats = nc_fid.variables['lat'][:]
            lons = nc_fid.variables['lon'][:]  # Defining the longitude array
            time = nc_fid.variables['time'][:]
            # Defining the variable array(throws error if variable is not in combined.nc)
            # new way to cal dist
            coordinates = list(product(lats, lons))
            dist = []
            for val in coordinates:
                distance = great_circle(val, st_point).kilometers
                dist.append(distance)
            index = np.argmin(np.array(dist))
            lat = coordinates[index][0]
            lon = coordinates[index][1]
            for l in range(len(lats)):
                if lat == lats[l]:
                    lat_idx = l
            for l in range(len(lons)):
                if lon == lons[l]:
                    lon_idx = l

            # print("nearest index of lat and lon")

            # abslat = np.abs(lats - stn_lat)  # Finding the absolute latitude
            # abslon = np.abs(lons - stn_lon)  # Finding the absolute longitude
            # lat_idx = (abslat.argmin())
            # lon_idx = (abslon.argmin())
            # new way end
            for timestep, v in enumerate(time):
                val = field2[lat_idx, lon_idx][timestep]
                if np.isnan(val) == False:
                    dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                              calendar=lis_var['time'].calendar)
                    test = dt_str + timedelta(hours=7)
                    dtt = test.strftime('%Y-%m-%dT%H:%M:%SZ')
                    dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                    time_stamp = calendar.timegm(dt.timetuple()) * 1000
                    ts_plot_bcpm25.append([time_stamp, round(float(val))])
            field3 = nc_fid.variables[s_var3][:]
            lats = nc_fid.variables['lat'][:]
            lons = nc_fid.variables['lon'][:]  # Defining the longitude array
            time = nc_fid.variables['time'][:]
            coordinates = list(product(lats, lons))
            dist = []
            for val in coordinates:
                distance = great_circle(val, st_point).kilometers
                dist.append(distance)
            index = np.argmin(np.array(dist))
            lat = coordinates[index][0]
            lon = coordinates[index][1]
            for l in range(len(lats)):
                if lat == lats[l]:
                    lat_idx = l
            for l in range(len(lons)):
                if lon == lons[l]:
                    lon_idx = l
            for timestep, v in enumerate(time):

                val = field3[lat_idx, lon_idx][timestep]
                if np.isnan(val) == False:
                    dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                              calendar=lis_var['time'].calendar)
                    test = dt_str + timedelta(hours=7)
                    dtt = test.strftime('%Y-%m-%dT%H:%M:%SZ')
                    dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                    time_stamp = calendar.timegm(dt.timetuple()) * 1000
                    ts_plot_geospm25.append([time_stamp, round(float(val))])
        else:
            field = nc_fid.variables[s_var][:]
            lats = nc_fid.variables['Latitude'][:]
            lons = nc_fid.variables['Longitude'][:]  # Defining the longitude array
            time = nc_fid.variables['time'][:]
            coordinates = list(product(lats, lons))
            dist = []
            for val in coordinates:
                distance = great_circle(val, st_point).kilometers
                dist.append(distance)
            index = np.argmin(np.array(dist))
            lat = coordinates[index][0]
            lon = coordinates[index][1]
            for l in range(len(lats)):
                if lat == lats[l]:
                    lat_idx = l
            for l in range(len(lons)):
                if lon == lons[l]:
                    lon_idx = l
            for timestep, v in enumerate(time):

                val = field[timestep, lat_idx, lon_idx]
                if np.isnan(val) == False:
                    dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                              calendar=lis_var['time'].calendar)
                    dtt = dt_str.strftime('%Y-%m-%dT%H:%M:%SZ')
                    dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                    time_stamp = calendar.timegm(dt.utctimetuple()) * 1000
                    ts_plot.append([time_stamp, round(float(val))])

        ts_plot.sort()
        ts_plot_pm25.sort()
        ts_plot_bcpm25.sort()
        ts_plot_geospm25.sort()
        point = [round(stn_lat, 2), round(stn_lon, 2)]
        json_obj["plot"] = ts_plot

        # json_obj["ml_pm25"] = ts_plot_pm25
        if freq == "station":
            json_obj["bc_mlpm25"] = ts_plot_bcpm25
        # json_obj["geos_pm25"] = ts_plot_geospm25
        json_obj["geom"] = point
        # logger.info("PLOT POINT OBJECT : " + json.dumps(json_obj["plot"]))
        logger.info(json.dumps(json_obj["geom"]))
    except Exception as e:
        return json_obj
    return json_obj

@csrf_exempt
def get_poylgon_values(s_var, geom_data, freq, run_type, run_date):
    """Helper function to generate time series for a polygon"""
    logger.info("PARAMETERS : ['" + s_var +"','"+ geom_data +"','"+ freq +"','"+ run_type +"','"+ run_date+"']")
    # Empty list to store the timeseries values
    ts_plot = []

    json_obj = {}
    # Defining the lat and lon from the coords string
    poly_geojson = Polygon(json.loads(geom_data))
    shape_obj = shapely.geometry.asShape(poly_geojson)
    bounds = poly_geojson.bounds
    miny = float(bounds[0])
    minx = float(bounds[1])
    maxy = float(bounds[2])
    maxx = float(bounds[3])

    """Make sure you have this path for all the run_types(/home/tethys/aq_dir/fire/combined/combined.nc)"""
    if "geos" in run_type:
        infile = THREDDS_OPANDAP + "/" + run_type + "/" + run_date
    else:
        infile = os.path.join(DATA_DIR, run_type, freq, run_date)
    nc_fid = netCDF4.Dataset(infile, 'r')
    lis_var = nc_fid.variables

    if "geos" == run_type:
        field = nc_fid.variables[s_var][:]
        lats = nc_fid.variables['lat'][:]
        lons = nc_fid.variables['lon'][:]  # Defining the longitude array
        time = nc_fid.variables['time'][:]
        # Defining the variable array(throws error if variable is not in combined.nc)

        latli = np.argmin(np.abs(lats - minx))
        latui = np.argmin(np.abs(lats - maxx))

        lonli = np.argmin(np.abs(lons - miny))
        lonui = np.argmin(np.abs(lons - maxy))
        for timestep, v in enumerate(time):
            val = field[latli:latui,lonli:lonui,timestep]
            val = np.mean(val)
            if np.isnan(val) == False:
                dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                          calendar=lis_var['time'].calendar)
                test = dt_str + timedelta(hours=7)
                dtt = test.strftime('%Y-%m-%dT%H:%M:%SZ')
                dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                time_stamp = calendar.timegm(dt.timetuple()) * 1000
                ts_plot.append([time_stamp, round(float(val))])
    else:
        """Reading variables from combined.nc"""
        lats = nc_fid.variables['Latitude'][:]  # Defining the latitude array
        lons = nc_fid.variables['Longitude'][:]  # Defining the longitude array
        field = nc_fid.variables[s_var][:]  # Defning the variable array(throws error if variable is not in combined.nc)
        time = nc_fid.variables['time'][:]

        latli = np.argmin(np.abs(lats - minx))
        latui = np.argmin(np.abs(lats - maxx))

        lonli = np.argmin(np.abs(lons - miny))
        lonui = np.argmin(np.abs(lons - maxy))
        for timestep, v in enumerate(time):
            vals = field[timestep, latli:latui, lonli:lonui]
            if run_type == 'fire':
                val = np.sum(vals)
            else:
                val = np.mean(vals)
            if np.isnan(val) == False:
                dt_str = netCDF4.num2date(lis_var['time'][timestep], units=lis_var['time'].units,
                                          calendar=lis_var['time'].calendar)
                dtt = dt_str.strftime('%Y-%m-%dT%H:%M:%SZ')
                dt = datetime.strptime(dtt, '%Y-%m-%dT%H:%M:%SZ')
                time_stamp = calendar.timegm(dt.utctimetuple()) * 1000
                ts_plot.append([time_stamp, float(val)])

    ts_plot.sort()

    geom = [round(minx, 2), round(miny, 2), round(maxx, 2), round(maxy, 2)]

    json_obj["plot"] = ts_plot
    json_obj["geom"] = geom
    if len(ts_plot) == 0:
        logger.warn("The selected polygon has no data")
    else:
        logger.info("PLOT POLYGON OBJECT : " + json.dumps(json_obj["plot"]))
    logger.info(json.dumps(json_obj["geom"]))
    return json_obj

#database utils
def get_station_data():
    with connection.cursor() as cursor:
        sql = """SELECT s.rid,s.station_id,s.name_en, s.lat, s."long" as longitude,m.pm25,max(datetime) latest_date
                from stations s,nrt_measurements m where s.station_id = m.station_id and pm25 is not null
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
    # current_time = datetime.now().strftime('%H:%M:%S')
    # enddatetime_str = (obs_date + " "+ datetime.now().strftime('%H:%M:%S'))
    # strtodate =  datetime.strptime(enddatetime_str, '%Y-%m-%d %H:%M:%S').date()
    # _3hourago = strtodate - timedelta(hours = 3)
    # last_hour_date_time = _3hourago.strftime('%Y-%m-%d %H:%M:%S')
    with connection.cursor() as cursor:
        # sql = """SELECT DISTINCT ON (s.station_id) s.station_id, s.rid, m.datetime, s.lat, s.long, m.pm25, s.name_en, m.aqi, m.aqi_level
        #         from stations s, nrt_measurements m
        #         where s.station_id = m.station_id and pm25 is not null
        #         and m.datetime between '"""+last_hour_date_time+"""' and '"""+enddatetime_str+"""' ORDER BY s.station_id, m.datetime DESC"""

        # sql = """SELECT DISTINCT ON (s.station_id) s.station_id, s.rid, m.datetime, s.lat, s.long, m.pm25, s.name_en, m.aqi, m.aqi_level
        #             from stations s, nrt_measurements m
        #             where s.station_id = m.station_id and pm25 is not null and m.datetime = '"""+obs_date+"""'
        #             ORDER BY s.station_id, m.datetime DESC"""

        sql = """SELECT tbl1.station_id, tbl1.rid, tbl1.datetime, tbl1.lat, tbl1.long, tbl1.pm25, tbl1.name_en, tbl2.aqi, tbl2.aqi_level FROM
        (SELECT DISTINCT ON (s.station_id) s.station_id, s.rid, m.datetime, s.lat, s.long, m.pm25, s.name_en
        FROM stations s, nrt_measurements m
        WHERE s.station_id = m.station_id AND m.pm25 IS NOT null AND m.datetime <= '"""+obs_date+"""'
        ORDER BY s.station_id, m.datetime DESC) AS tbl1
        LEFT JOIN measurements tbl2 ON tbl1.station_id = tbl2.station_id AND tbl2.datetime = tbl1.datetime""";

        cursor.execute(sql)
        data = cursor.fetchall()
        stations=[]
        for row in data:
            rid = row[1]
            name=row[6]
            station_id = row[0]
            lat = row[3]
            lon = row[4]
            pm25=row[5]
            latest_date=row[2]
            aqi=row[7]
            aqi_level=row[8]
            selected_date= datetime.strptime(obs_date, '%Y-%m-%d %H:%M:%S')
            difference = latest_date - selected_date
            if difference.days == -1 or difference.days==0:
                stations.append({
                    'rid': rid,
                    'station_id': str(station_id),
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

def get_pm25_data(s_var, run_type, run_date, station, lat, lon):
    try:
        geom_data = lon+',' + lat
        geos_pm25_data = get_pt_values(s_var, geom_data, "station", "geos", run_date)
        # "2019-08-01 03:00:00"
        date_obj = datetime.strptime(run_date.split('.')[0],"%Y%m%d")
        end_date = date_obj+timedelta(days=3)
        sd = date_obj.strftime("%Y-%m-%d %H:%M:%S")
        ed = end_date.strftime("%Y-%m-%d %H:%M:%S")
        pm25_data = {}
        ts_plot = []
        with connection.cursor() as cursor:
            sql = """SELECT  datetime, pm25 from stations s, nrt_measurements m where s.station_id = m.station_id and s.station_id = '"""+station+"""'  and pm25 is not null and date_part('hour', datetime) in (2,5,8,11,14,17,20,23)  and datetime between '"""+sd +"""' and '"""+ed+"""'"""
            cursor.execute(sql)
            data = cursor.fetchall()
            for row in data:
                dt = row[0]
                pm25 = row[1]
                time_stamp = calendar.timegm(dt.timetuple()) * 1000
                ts_plot.append([time_stamp, round(float(str(pm25)))])

        ts_plot.sort()
        pm25_data["field_data"] = ts_plot
        # pm25_data["ml_pm25"] = geos_pm25_data["ml_pm25"]
        pm25_data["bc_mlpm25"] = geos_pm25_data["bc_mlpm25"]
        # pm25_data["geos_pm25"] = geos_pm25_data["geos_pm25"]
        pm25_data["geom"] = geos_pm25_data["geom"]
        connection.close()
        return pm25_data
    except Exception as e:
        return e


def get_ts(s_var, interaction, run_type, freq, run_date, geom_data):
    """Get Time Series for Point and Polygon"""

    return_obj = {}

    """If a point is clicked on the map, get the values for graph"""
    if interaction == 'Point':
        try:
            graph = get_pt_values(s_var, geom_data, freq, run_type, run_date)
            return_obj["data"] = graph
            return_obj["success"] = "success"
        except Exception as e:
            return_obj["error"] = "Error processing request: "+ str(e)
    """If a polygon is selected on the map, get the values for graph"""
    if interaction == 'Polygon':
        try:
            graph = get_poylgon_values(s_var, geom_data, freq, run_type, run_date)
            return_obj["data"] = graph
            return_obj["success"] = "success"
        except Exception as e:
            return_obj["error"] = "Error processing request: "+ str(e)
    if interaction == 'Station':
        x=geom_data.split(',')
        station = x[0]
        lat = x[1]
        lon = x[2]
        run_date = run_date
        try:
            graph = get_pm25_data(s_var,run_type,run_date,station,lat,lon )
            return_obj["data"] = graph
            return_obj["success"] = "success"
        except Exception as e:
            return_obj["error"] = "Error processing request: "+ str(e)

    dump = json.dumps(return_obj)
    return return_obj


def gen_style_legend(style):
    style_f = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static/data/palettes/'+str(style)+'.pal')
    scale = []
    if os.path.exists(style_f):
        with open(style_f, mode='r') as f:
            lines = f.readlines()
        for line in lines:
            lval = line.split()
            if len(lval)>0:
                rgb = (lval[0], lval[1], lval[2])
                scale.append(rgb)
    return scale

def get_24h_station():
    url = "http://air4thai.pcd.go.th/forappV2/getAQI_JSON.php"
    response = requests.get(url)
    response = response.json()
    stations = response['stations']
    return json.dumps(stations, indent=4)
