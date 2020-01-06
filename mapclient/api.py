# -*- coding: utf-8 -*-
from celery.result import AsyncResult
from mapclient.controllers import get_time, get_current_station
from django.conf import settings
from django.http import JsonResponse
from datetime import datetime
import json
import time

def api(request):

    get = request.GET.get
    action = get('action', '')

    if action:
        public_methods = ['get-time', 'get-stations']
        if action in public_methods:
            run_type = get('run_type', '')
            freq = get('freq', '')
            run_date = get('run_date', '')
            obs_date = get('obs_date', '')
            if action == 'get-time':
                data = get_time(freq, run_type, run_date)
            if action == 'get-stations':
                data = get_current_station(obs_date)

            return JsonResponse(data, safe=False)
