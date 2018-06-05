#!/bin/bash
set -e

# setup nginx
sudo apt update
sudo apt install nginx
#TODO: Let's Encrypt Certs

# setup firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

sudo adduser retifish --disabled-login --gecos ""

sudo mv retifish.service /lib/systemd/system/.
sudo chmod 755 /lib/systemd/system/retifish.service

#TODO nginx configs
