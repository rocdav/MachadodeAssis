FROM nginxinc/nginx-unprivileged:1.27-alpine

USER root

RUN rm -rf /usr/share/nginx/html/*

COPY . /usr/share/nginx/html/

RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/docker-compose.yml \
          /usr/share/nginx/html/.dockerignore \
          /usr/share/nginx/html/app.py \
          /usr/share/nginx/html/requirements.txt \
          /usr/share/nginx/html/README.md \
          /usr/share/nginx/html/readme.md \
 && sed -i 's/listen       8080;/listen       7860;/' /etc/nginx/conf.d/default.conf \
 && chown -R nginx:nginx /usr/share/nginx/html

USER nginx

EXPOSE 7860
