import os
import xml.etree.ElementTree as ET
import json
from collections import defaultdict
import calendar
import requests
from django.conf import settings
from collections import defaultdict
from django.shortcuts import render
from django.core.urlresolvers import reverse
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from mapclient.config import THREDDS_CATALOG, THREDDS_wms, DATA_DIR, LOG_DIR
import datetime

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

    for elem in cat_tree.iter():
        for k, v in elem.attrib.items():
            if 'title' in k:
                run_xml_url = catalog_url + str(v) +'/catalog.xml'
                run_response = requests.get(run_xml_url, verify=False)
                run_tree = ET.fromstring(run_response.content)
                for ele in run_tree.iter():
                    for ke, va in ele.attrib.items():
                        if 'urlPath' in ke:
                            if va.endswith('.nc'):
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
        ('Rainbow', 'rainbow'),
        ('TMP 1', 'tmp_2maboveground'),
        ('TMP 2', 'dpt_2maboveground'),
        ('SST-36', 'sst_36'),
        ('Greyscale', 'greyscale'),

        ('OCCAM', 'occam'),
        ('OCCAM Pastel', 'occam_pastel-30'),
        ('Red-Blue', 'redblue'),
        ('NetCDF Viewer', 'ncview'),
        ('ALG', 'alg'),
        ('ALG 2', 'alg2'),
        ('Ferret', 'ferret'),
        ('Reflectivity', 'enspmm-refc'),
        # ('Probability', 'prob'),
        # ('White-Blue', whiteblue'),
        # ('Grace', 'grace'),
    ]

    date_obj["colors"] = color_opts

    return date_obj
