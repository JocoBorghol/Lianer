# Använd en minimal, rootless Nginx-avbild baserad på Alpine för högsta säkerhet (VG-krav)
FROM nginxinc/nginx-unprivileged:alpine

# Kopiera alla frontend-filer till Nginx standardmapp
COPY . /usr/share/nginx/html

# Exponera port 8080 internt i containern (eftersom rootless inte får använda port 80)
EXPOSE 8080

# Starta Nginx
CMD ["nginx", "-g", "daemon off;"]
