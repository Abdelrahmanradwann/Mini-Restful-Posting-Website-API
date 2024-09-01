FROM mysql:8.0 

#/docker-entrypoint-initdb.d/  is a specific folder that carries .sql files and other similar files
# and run automatically when creating the images
COPY ["init.sql","/docker-entrypoint-initdb.d/init.sql"]   
EXPOSE 3306

