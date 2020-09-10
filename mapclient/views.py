# -*- coding: utf-8 -*-
import json
from django.shortcuts import render
from mapclient.config import THREDDS_wms
from mapclient.controllers import gen_thredds_options, generate_variables_meta, get_styles

def map(request):
    style_opts = get_styles()
    th_options = gen_thredds_options()
    var_options = generate_variables_meta()

    context = {
        'var_options': json.dumps(var_options),
        'style_options': json.dumps(style_opts),
        'thredds_wms_url': THREDDS_wms,
        'thredds_options': json.dumps(th_options)
    }

    return render(request, 'map.html', context)

def pm25map(request):
    style_opts = get_styles()
    th_options = gen_thredds_options()
    var_options = generate_variables_meta()

    context = {
        'var_options': json.dumps(var_options),
        'style_options': json.dumps(style_opts),
        'thredds_wms_url': THREDDS_wms,
        'thredds_options': json.dumps(th_options)
    }

    return render(request, 'pm25-map.html', context)

def index(request):
    return render(request, 'home.html')
