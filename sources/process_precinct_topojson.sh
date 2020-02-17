echo "Downloading 2018 precincts ..." &&
wget -O basemaps/shp_bdry_votingdistricts.zip ftp://ftp.gisdata.mn.gov/pub/gdrs/data/pub/us_mn_state_sos/bdry_votingdistricts/shp_bdry_votingdistricts.zip && \
cd basemaps && \
unzip shp_bdry_votingdistricts.zip && \
shp2json bdry_votingprecincts.shp | \
mapshaper - -quiet -proj longlat from=bdry_votingprecincts.prj -o ./bdry_votingdistricts.json format=geojson && \
cat bdry_votingdistricts.json | \
geo2topo precincts=- | ndjson-cat > mn_precincts_topojson.ndjson && \
rm bdry_votingdistricts.* && \
rm -rf ./metadata && \
rm bdry_votingprecincts*
