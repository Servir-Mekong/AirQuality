# -*- coding: utf-8 -*-

from django.conf import settings

def variable_settings(request):
    return {
        'GOOGLE_ANALYTICS_ID': settings.GOOGLE_ANALYTICS_ID,
    }

def debug(context):
  return {'DEBUG': settings.DEBUG}
