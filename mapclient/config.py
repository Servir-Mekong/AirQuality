# Configuration file. Basic configuration variables.
"""
DATA_DIR: local directory on the server, containing writable sub-folders for each Parameter to hold the combined/combined.nc files
These files are written when a chart is generated for a specific point or polygon.
For a DATA_DIR base named /srv/aqx, with the parameters fire, aod_terra and aod_aqua, the following files should exist:
  /srv/aqx/fire/combined/combined.nc
  /srv/aqx/aod_aqua/combined/combined.nc
  /srv/aqx/aod_terra/combined/combined.nc
"""
#DATA_DIR = '/home/Socrates/spulla/THREDDS_data/MK_AQX/'

DATA_DIR = 'static/aq_dir/'

LOG_DIR = 'static/logs/'

"""
THREDDS_CATALOG: Indicates the base URL for the directory containing the different Parameters
  This is a publicly accessible THREDDS server (not necessarily residing in the same server or even on the same network)
"""
THREDDS_CATALOG = 'https://tethys.servirglobal.net/thredds/catalog/tethys/MK_AQX/'

"""
THREDDS_wms: Indicates the basic form of WMS requests to the server
  This is a publicly accessible THREDDS server (not necessarily residing in the same server or even on the same network)
"""
THREDDS_wms = 'https://tethys.servirglobal.net/thredds/wms/'

connection = [{'host': '216.218.240.22'},
              {'user': 'postgres'},
              {'password': 'v^[6o9^'},
              {'dbname': 'nrtdatapcd'}]
