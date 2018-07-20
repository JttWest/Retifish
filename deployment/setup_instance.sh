#!/bin/bash
set -e

# setup nginx
apt update
apt install nginx
#TODO: Let's Encrypt Certs

# setup firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

adduser retifish --disabled-login --gecos ""

# public directory of assets to be served
mv -v Public/* /home/retifish/

# systemd service for Retifish service server
mv retifish.service /lib/systemd/system/
chmod 755 /lib/systemd/system/retifish.service
systemctl enable retifish.service
systemctl start retifish

# nginx reverse-proxy
mv retifish.conf /etc/nginx/sites-available/
systemctl start nginx
