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
    d=currentYear+currentMonth+currentDay+'_forecast'
    for elem in cat_tree.iter():
        for k, v in elem.attrib.items():
            if 'title' in k:
                run_xml_url = catalog_url + str(v) +'/catalog.xml'
                run_response = requests.get(run_xml_url, verify=False)
                run_tree = ET.fromstring(run_response.content)
                for ele in run_tree.iter():
                    for ke, va in ele.attrib.items():
                        if 'urlPath' in ke:

                            if va.endswith('.nc') and d in va:
                                tinf.setdefault(v, {}).setdefault('3daytoday', []).append(va)
                            elif va.endswith('.nc') and d not in va and '_forecast' in va:
                                tinf.setdefault(v, {}).setdefault('3dayrecent', []).append(va)
                            elif va.endswith('.nc'):
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
