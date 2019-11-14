# -*- coding: utf-8 -*-
from celery.result import AsyncResult
from mapclient.controllers import get_time
from django.conf import settings
from django.http import JsonResponse
from datetime import datetime
import json
import time

def api(request):

    get = request.GET.get
    action = get('action', '')

    if action:
        public_methods = ['get-time']
        if action in public_methods:
            run_type = get('run_type', '')
            freq = get('freq', '')
            run_date = get('run_date', '')
            if action == 'get-time':
                data = get_time(freq, run_type, run_date)

            return JsonResponse(data, safe=False)
