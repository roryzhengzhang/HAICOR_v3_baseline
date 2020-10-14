#! /bin/bash
docker image build -t website .

docker rm -f website_container
docker run -itd --name website_container -v '/home/zhengzhang/HAICOR_v3_baseline/temp_data:/website/data' -p 80:5000 website
