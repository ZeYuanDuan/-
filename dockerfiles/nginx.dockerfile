FROM nginx

COPY conf/nginx/nginx.conf /etc/nginx/nginx.conf

COPY frontend /usr/share/nginx/html