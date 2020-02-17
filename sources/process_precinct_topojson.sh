echo "Downloading 2018 precincts ..." &&
wget ftp://ftp.gisdata.mn.gov/pub/gdrs/data/pub/us_mn_state_sos/bdry_votingdistricts/shp_bdry_votingdistricts.zip && \
unzip shp_bdry_votingdistricts.zip
shp2json bdry_votingprecincts.shp | \
mapshaper - -quiet -proj longlat from=bdry_votingprecincts.prj -o ./bdry_votingdistricts.json format=geojson
cat bdry_votingdistricts.json | \
geo2topo precincts=- | ndjson-cat > mn_precincts_topojson.ndjson && \
# rm bdry_votingdistricts.* && \
rm -rf ./metadata && \
rm bdry_votingprecincts.shp &&
rm bdry_votingprecincts.shx &&
rm bdry_votingprecincts.prj &&
rm bdry_votingprecincts.dbf


# echo "Turning SOS GEOJSON into topojson ..." &&
# geo2topo precincts=mn_precincts_20190701.json | toposimplify -S 0.007 --filter-all | topoquantize 1e3 | ndjson-cat > mn_precincts_topojson.ndjson

# May need to use shapefile version to get area
# ftp://ftp.gisdata.mn.gov/pub/gdrs/data/pub/us_mn_state_sos/bdry_votingdistricts/shp_bdry_votingdistricts.zip
