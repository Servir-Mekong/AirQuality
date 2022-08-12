# -*- coding: utf-8 -*-
from celery.result import AsyncResult
from mapclient.controllers import get_time, get_current_station, get_ts, get_24h_station
from django.conf import settings
from django.http import JsonResponse
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
import json
import time

@csrf_exempt
def api(request):

    action = request.POST.get("action", request.GET.get("action", None))

    if action:
        public_methods = ['get-time', 'get-stations', 'get-chartData', 'get-24hstations']
        if action in public_methods:
            run_type = request.POST.get('run_type', request.GET.get("run_type", ""))
            freq = request.POST.get('freq', request.GET.get("freq", ""))
            run_date_time = request.POST.get('run_date', request.GET.get("run_date", ""))
            obs_date = request.POST.get('obs_date', request.GET.get("obs_date", ""))
            variable =  request.POST.get('variable', request.GET.get("variable", ""))
            run_type_chart =  request.POST.get('run_type_chart', request.GET.get("run_type_chart", ""))
            freq_chart =  request.POST.get('freq_chart', request.GET.get("freq_chart", ""))
            run_date =  request.POST.get('run_date_chart', request.GET.get("run_date_chart", ""))
            interaction =  request.POST.get('interaction', request.GET.get("interaction", ""))
            geom_data =  request.POST.get('geom_data', request.GET.get("geom_data", ""))
            if action == 'get-time':
                data = get_time(freq, run_type, run_date_time)
            elif action == 'get-stations':
                data = get_current_station(obs_date)
            elif action == 'get-24hstations':
                data = get_24h_station()
            elif action == 'get-chartData':
                data = get_ts(s_var=variable, interaction=interaction, run_type=run_type_chart, freq=freq_chart, run_date=run_date, geom_data=geom_data)

            return JsonResponse(data, safe=False)
