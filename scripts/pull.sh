#!/bin/bash

source /home/airquality/airquality_venv36/bin/activate
cd /home/airquality/airquality
git reset --hard HEAD
git pull
# gulp build
python manage.py collectstatic
sudo service supervisor restart
sudo service nginx restart
