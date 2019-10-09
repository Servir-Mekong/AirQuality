from django.conf.urls import include, url
from . import views
from oauth2client.contrib.django_util.site import urls as oauth2_urls

urlpatterns = [
    url(r'^map/', views.index)
]
