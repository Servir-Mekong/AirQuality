import xarray as xr
import pandas as pd
import numpy as np
from os import path
import warnings
import glob
from sklearn.externals import joblib
from helper import *
from datetime import datetime,timedelta
import json
warnings.filterwarnings('ignore')

#method that uses machine learning algorithm. Make sure models folder exists with the 10 .pkl files
#this method uses the data frmae that is generated after adding and scaling the variables in the combined file.
def ensemble(dataframe, models_folder_path):
  df_master = dataframe
  col = ['Lat',	'Lon', 'PS', 'QV10M', 'Q500', 'Q850', 'T10M',	'T500',	'T850',	'WIND',	'BCSMASS',
        'DUSMASS25',	'OCSMASS',	'SO2SMASS',	'SO4SMASS',	'SSSMASS25',	'TOTEXTTAU',	'Date_Time']
  prediction = []
  count =0
  #loop through models
  for m_path in glob.glob('{}/*.pkl'.format(models_folder_path)):
    print('[INFO]  Loading model : ', m_path[len(models_folder_path)+1:])
    print(m_path)
    count += 1
    m = joblib.load(m_path)
    if len(prediction) != 0:
      pred = m.predict(df_master[col])
      prediction = prediction + pred
      df_master[m_path[len(models_folder_path)+1:-4]] = pred
    else:
      prediction = m.predict(df_master[col])
      df_master[m_path[len(models_folder_path)+1:-4]] = prediction
  #Get eman ensemble prediction
  df_master['Ensemble'] = prediction/10
  return df_master

#get current date
currentDay = datetime.now().strftime('%d')
currentMonth = datetime.now().strftime('%m')
currentYear = datetime.now().strftime('%Y')
datestr=currentYear+currentMonth+currentDay
#load config params
f = open('downloadGEOSDataParams.json')
config = json.load(f)
#If combined file exists, we run this script
if path.exists('final_combined.nc'):
    # Read in to xarray
    forcing=xr.open_dataset('final_combined.nc')
    # Convert to a pandas data frame
    df=forcing.to_dataframe()
    # Create DateTimeIndex for accessing/manipulating the time data.
    dt=pd.DatetimeIndex(df.timeArray)
    # Compute fractional julian day
    jday = dt.dayofyear +  (dt.hour*60.0*60.0 + dt.minute*60.0 + dt.second)/86400.0
    # Scale and store variables in the data frame
    df['Date_Time']=jday
    df['QV10M']=1000.*df['QV10M']
    df['Q500']=1000.*df['Q500']
    df['Q850']=1000.*df['Q850']
    df['Lon']=df['lonArray']
    df['Lat']=df['latArray']
    df['BCSMASS']=1.0e9*df['BCSMASS']
    df['DUSMASS25']=1.0e9*df['DUSMASS25']
    df['OCSMASS']=1.0e9*df['OCSMASS']
    df['SO2SMASS']=1.0e9*df['SO2SMASS']
    df['SO4SMASS']=1.0e9*df['SO4SMASS']
    df['SSSMASS25']=1.0e9*df['SSSMASS25']
    # Get index where values are missing.
    index=np.where(np.isnan(df['T850'].values))
    # Call machine learning code for each prediction
    df_master=ensemble(df.fillna(-9999.0), 'models')
    #prediction[index]=np.nan
    df_master.iloc[index[0],:]=np.nan
    prediction=df_master['Ensemble']
    # Now we need to write the data to the netcdf file.
    # "prediciton" should be an array (or data frame with values that are an array) with NX*NY*24 elements
    model_prediction = prediction.values.reshape(141,164,24).transpose((2,0,1))
    model1_prediction = df_master['model_1'].values.reshape(141,164,24).transpose((2,0,1))
    model2_prediction = df_master['model_2'].values.reshape(141,164,24).transpose((2,0,1))
    model3_prediction = df_master['model_3'].values.reshape(141,164,24).transpose((2,0,1))
    model4_prediction = df_master['model_4'].values.reshape(141,164,24).transpose((2,0,1))
    model5_prediction = df_master['model_5'].values.reshape(141,164,24).transpose((2,0,1))
    model6_prediction = df_master['model_6'].values.reshape(141,164,24).transpose((2,0,1))
    model7_prediction = df_master['model_7'].values.reshape(141,164,24).transpose((2,0,1))
    model8_prediction = df_master['model_8'].values.reshape(141,164,24).transpose((2,0,1))
    model9_prediction = df_master['model_9'].values.reshape(141,164,24).transpose((2,0,1))
    model10_prediction = df_master['model_10'].values.reshape(141,164,24).transpose((2,0,1))
    # Put this data back into the xarray dataset since all the coordinates are already defined there.
    forcing['model_prediction']=xr.DataArray(model_prediction,dims=("time","lat","lon"))
    forcing['model_1']=xr.DataArray(model1_prediction,dims=("time","lat","lon"))
    forcing['model_2']=xr.DataArray(model2_prediction,dims=("time","lat","lon"))
    forcing['model_3']=xr.DataArray(model3_prediction,dims=("time","lat","lon"))
    forcing['model_4']=xr.DataArray(model4_prediction,dims=("time","lat","lon"))
    forcing['model_5']=xr.DataArray(model5_prediction,dims=("time","lat","lon"))
    forcing['model_6']=xr.DataArray(model6_prediction,dims=("time","lat","lon"))
    forcing['model_7']=xr.DataArray(model7_prediction,dims=("time","lat","lon"))
    forcing['model_8']=xr.DataArray(model8_prediction,dims=("time","lat","lon"))
    forcing['model_9']=xr.DataArray(model9_prediction,dims=("time","lat","lon"))
    forcing['model_10']=xr.DataArray(model10_prediction,dims=("time","lat","lon"))
    # Add metadata to variable, you may do it here.
    forcing['model_prediction'].attrs = { 'long_name':'air_quality_index_pm25','units':'my_units','description':'ensemble ML model' }
    # Now write this data to file.
    if not os.path.exists(config['dataDownloadPath']):
       os.makedirs(config['dataDownloadPath'])
    forcing.to_netcdf(path=config['dataDownloadPath']+datestr+'.nc')
    if os.path.exists('slv_subset_file.nc'):
        os.remove('slv_subset_file.nc')
    if os.path.exists('aer_subset_file.nc'):
        os.remove('aer_subset_file.nc')
    if os.path.exists('final_combined.nc'):
        os.remove('final_combined.nc')
else:
    print("Combined file does not exist, cannot process data for "+datestr+".")
