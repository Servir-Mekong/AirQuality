"""
ecodash URL Configuration
"""
from __future__ import absolute_import, print_function, unicode_literals

from cms.sitemaps import CMSSitemap
from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.static import serve
from django.views.generic import TemplateView
from mapclient import controllers as controllers
from mapclient import views
from mapclient import api as mapclient_api
admin.autodiscover()


urlpatterns = [
    url(r'^sitemap\.xml$', sitemap,
        {'sitemaps': {'cmspages': CMSSitemap}}),

]

urlpatterns += i18n_patterns(
    url(r'^admin/', admin.site.urls),  # NOQA
    #url(r'^$', TemplateView.as_view(template_name="map.html")),
    url(r'^$', views.index),
    url(r'^home/', views.index),
    url(r'^mapviewer/', views.pm25map),
    url(r'^map/', views.map),
    url(r'^api/mapclient/$', mapclient_api.api),
)
