# -*- coding: utf-8 -*-
from celery.result import AsyncResult
from mapclient.controllers import get_time, get_current_station, get_ts, get_24h_station
from django.conf import settings
from django.http import JsonResponse
from datetime import datetime
import json
import time

def api(request):

    get = request.GET.get
    action = get('action', '')

    if action:
        public_methods = ['get-time', 'get-stations', 'get-chartData', 'get-24hstations']
        if action in public_methods:
            run_type = get('run_type', '')
            freq = get('freq', '')
            run_date_time = get('run_date', '')
            obs_date = get('obs_date', '')
            variable =  get('variable', '')
            run_type_chart =  get('run_type_chart', '')
            freq_chart =  get('freq_chart', '')
            run_date =  get('run_date_chart', '')
            interaction =  get('interaction', '')
            geom_data =  get('geom_data', '')
            if action == 'get-time':
                data = get_time(freq, run_type, run_date_time)
            elif action == 'get-stations':
                data = get_current_station(obs_date)
            elif action == 'get-24hstations':
                data = get_24h_station()
            elif action == 'get-chartData':
                data = get_ts(s_var=variable, interaction=interaction, run_type=run_type_chart, freq=freq_chart, run_date=run_date, geom_data=geom_data)

            return JsonResponse(data, safe=False)
