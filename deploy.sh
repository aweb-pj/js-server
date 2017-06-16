#!/usr/bin/zsh
git pull
sudo docker stop running-aweb-pj-server
sudo docker rmi aweb-pj-server
sudo docker build -t aweb-pj-server .
sudo docker run -d --rm -e VIRTUAL_HOST=aweb.jtwang.me -e LETSENCRYPT_HOST=aweb.jtwang.me -e LETSENCRYPT_EMAIL=jtwang.me@gmail.com --name running-aweb-pj-server aweb-pj-server