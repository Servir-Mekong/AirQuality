# Author: Githika Tondapu

from bs4 import BeautifulSoup
import requests
import os.path
import os
import xarray as xr
from pathlib import Path
from datetime import datetime,timedelta
import logging
import json
import os
import sys
import shutil
f = open('downloadGEOSDataParams.json')
config = json.load(f)
if os.path.exists('slv_subset_file.nc'):
    os.remove('slv_subset_file.nc')
if os.path.exists('aer_subset_file.nc'):
    os.remove('aer_subset_file.nc')
if os.path.exists('final_combined.nc'):
    os.remove('final_combined.nc')
if config["logMode"] == "DEBUG":
   logging.basicConfig(level=logging.DEBUG,
                        filename=config["logFile"],
                        format='%(message)s')
if config["logMode"] == "INFO":
   logging.basicConfig(level=logging.INFO,
                        filename=config["logFile"],
                        format='%(message)s')
#get current year, month and day
currentDay = datetime.now().strftime('%d')
currentMonth = datetime.now().strftime('%m')
currentYear = datetime.now().strftime('%Y')
yesterday = datetime.now() - timedelta(days = 1)
if len(sys.argv)==2:
    date_str = sys.argv[1]
    try:
       date_obj = datetime.strptime(date_str, '%Y-%m-%d')
       currentDay = date_obj.strftime('%d')
       currentMonth = date_obj.strftime('%m')
       currentYear = date_obj.strftime('%Y')
       yesterday = date_obj - timedelta(days = 1)
    except:
       print('Please enter date in YYYY-MM-DD format')
       logging.error('Date was not in YYYY-MM-DD format')
       sys.exit()
yDay=yesterday.strftime("%Y%m%d")
datestr=currentYear+currentMonth+currentDay
#bounds to subset the region
lat_bnds, lon_bnds = [5, 40], [59, 110]

def logInfo(message):
    logging.info(str(datetime.now())[:19]+' '+message)

def logDebug(message):
    logging.debug(str(datetime.now())[:19]+' '+message)

def logError(message):
    logging.error(str(datetime.now())[:19]+' '+message)
print("Downloading Data...")
logInfo("Running the script in" + config['logMode']+ "mode")
logInfo(' --------------------------START----------------------------------')
logInfo('Downloading data for '+currentYear+'_'+currentMonth+'_'+currentDay)

#all the directories that are required
url = config["url"]+"/Y"+currentYear+"/M"+currentMonth+"/D"+currentDay+"/H00/"
direc3 =config["threeHourDataPath"]+currentYear+'//'+currentMonth+'//'+currentDay
direc1 = config["oneHourDataPath"]+currentYear+'//'+currentMonth+'//'+currentDay
combined1= config["combinedDataPath1hour"]
combined3= config["combinedDataPath3hour"]

#Download all the 3 hour data for 3 days forecast
def download_files(links):
    count=0
    dates1=[]
    dates3=[]
    #GEOS.fp.fcst.tavg1_2d_slv_Nx.20191004_00+20191004_0030.V01.nc4
    logInfo("Download 3 hour data tavg3_2d_aer_Nx and tavg1_2d_slv_Nx")
    for link in links:
       if 'tavg3_2d_aer_Nx' in link and yDay+'_2230' not in link:
           d1=link.split('.')[-3] #20191004_00+20191004_0030
           d2=d1.split('+')[1]    #20191004_0030
           d3=d2.split('_')       #20191004
           dates1.append(d3[0])
           unique= set(dates1)
           if(len(unique)<=3):

               try:
                   logDebug('Downlaoding '+ link+'...')
                   r = requests.get(url+link,timeout=10)
                   with open(direc3+'/'+str(link), 'wb') as f:
                       f.write(r.content)
               except:
                   logError('Error while downloading '+link)
       if ('tavg1_2d_slv_Nx' in link and currentYear+currentMonth+currentDay+'_0030' not in link):
           d1=link.split('.')[-3]  #20191004_00+20191004_0030
           d2=d1.split('+')[1]     #20191004_0030
           d3=d2.split('_')        #20191004
           dates3.append(d3[0])
           unique= set(dates3)
           if(len(unique)<=3):
              if count%3==0:
                  try:
                      logDebug('Downlaoding '+ link+'...')
                      r = requests.get(url+link,timeout=10)
                      with open(direc1+'/'+str(link), 'wb') as f:
                          f.write(r.content)
                  except:
                      logError('Error while downloading '+link)
              count=count+1
#Get all the files that are available on https://portal.nccs.nasa.gov/datashare/gmao/geos-fp/forecast/
def find_files():
    #link should contain GEOS.fp.fcst
    hrefs = []
    print(url)
    soup = BeautifulSoup(requests.get(url).text,'html.parser')
    atags=soup.find_all('a')
    for a in atags:
        try:
            if 'GEOS.fp.fcst' in str(a["href"]):
            	hrefs.append(a["href"])
        except Exception as e:
            logError(str(e))
    return hrefs

#Subset the dataset and remove unnecessary fields for 1 hour data
def process_1hour(ds):
    ds = xr.open_dataset(ds['lat'].encoding['source'])
    out = ds.sel(lat=slice(*lat_bnds), lon=slice(*lon_bnds))
    try:
        variables=config["oneHourDropVariables"]
        for field in variables:
            out = out.drop(field)
    except:
        logError('Error while processing 1 hour data')
    finally:
        out.close()
        ds.close()
    return out

#Subset the dataset and remove unnecessary fields for 3 hour data
def process_3hour(ds):
    ds = xr.open_dataset(ds['lat'].encoding['source'])
    out = ds.sel(lat=slice(*lat_bnds), lon=slice(*lon_bnds))
    try:
        variables=config["threeHourDropVariables"]
        for field in variables:
            out = out.drop(field)
    except:
        logError('Error while processing 3 hour data')
    finally:
        out.close()
        ds.close()
    return out

#combine data after processing
def combine_data(path_to_data,path_to_combined_file,preprocessing_function):
    input = Path(path_to_data)
    try:
        m_files = [x for x in input.iterdir() if x.is_file()]
        xd =xr.open_mfdataset(sorted(m_files),concat_dim='time',preprocess=preprocessing_function)
        xd.to_netcdf(path_to_combined_file)
    except Exception as e:
         logError('Error while combining data: '+str(e))

def remove_directory(directory):
   try:
       shutil.rmtree(directory)
   except:
        logError('Error while deleting directory: ' +directory)

if not os.path.exists(direc3):
    os.makedirs(direc3)
if not os.path.exists(direc1):
    os.makedirs(direc1)
if not os.path.exists(combined1):
    os.makedirs(combined1)
if not os.path.exists(combined3):
    os.makedirs(combined3)

logInfo('Created directories for '+direc3+'---'+direc1+'---'+combined1+'---'+combined3)

logInfo('Getting the links of files available...')

list_of_links = find_files()

logInfo('Downloading files from '+url)

download_files(list_of_links)

logInfo('Combining files from 3 hour directory')

combine_data(direc3,os.path.join(combined3,datestr+'.nc'),process_3hour)

logInfo('Combining files from 1 hour directory')

combine_data(direc1,os.path.join(combined1,datestr+'.nc'),process_1hour)

logInfo('Deleting files from 1 hour directory')

#remove_directory(config["oneHourDataPath"])

logInfo('Deleting files from 3 hour directory')

#remove_directory(config["threeHourDataPath"])

logInfo('---------------------------END---------------------------------')

