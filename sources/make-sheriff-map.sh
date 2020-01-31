# echo "Downloading 2018 precincts ..." &&
# # wget ftp://ftp.gisdata.mn.gov/pub/gdrs/data/pub/us_mn_state_sos/bdry_votingdistricts/shp_bdry_votingdistricts.zip && \
#   unzip shp_bdry_votingdistricts.zip  && \
#   shp2json bdry_votingdistricts.shp | \
#   mapshaper - -quiet -filter 'COUNTYCODE==27' -proj longlat from=bdry_votingdistricts.prj -o ./bdry_votingdistricts.json format=geojson && \
#   cat bdry_votingdistricts.json | \
#   geo2topo precincts=- > ./hennepin-precincts-longlat.tmp.json && \
#   rm bdry_votingdistricts.* && \
#   rm -rf ./metadata && \
#   rm shp_bdry_votingdistricts.shp &&
#   rm shp_bdry_votingdistricts.shx &&
#   rm shp_bdry_votingdistricts.prj &&
#   rm shp_bdry_votingdistricts.dbf &&

echo "Getting vote totals ..." &&
cat sheriff-results.ndjson | \
  ndjson-map '{"id":  d.county_id + d.precinct_id, "county_id": d.county_id, "precinct_id": d.precinct_id, "name": d.cand_name, "votes": parseInt(d.votes), "votes_pct": parseFloat(d.votes_pct)}' | \
  ndjson-reduce '(p[d.id] = p[d.id] || []).push({name: d.name, votes: d.votes, votes_pct: d.votes_pct}), p' '{}' | \
  ndjson-split 'Object.keys(d).map(key => ({id: key, votes: d[key]}))' | \
  ndjson-map '{"id": d.id, "votes": d.votes.filter(obj => obj.name != "").sort((a, b) => b.votes - a.votes)}' | \
  ndjson-map '{"id": d.id, "votes": d.votes, "winner": d.votes[0].votes != d.votes[1].votes ? d.votes[0].name : "even", "winner_margin": (d.votes[0].votes_pct - d.votes[1].votes_pct).toFixed(2)}' | \
  ndjson-map '{"id": d.id, "winner": d.winner, "winner_margin": d.winner_margin, "total_votes": d.votes.reduce((a, b) => a + b.votes, 0), "votes_obj": d.votes}' > joined.tmp.ndjson &&

echo "Joining results to precinct map ..." &&
ndjson-split 'd.objects.precincts.geometries' < hennepin-precincts-longlat.ndjson | \
  ndjson-map -r d3 '{"type": d.type, "arcs": d.arcs, "properties": {"id": d3.format("02")(d.properties.COUNTYCODE) + d.properties.PCTCODE, "county": d.properties.COUNTYNAME, "precinct": d.properties.PCTNAME, "area_sqmi": d.properties.Shape_Area * 0.00000038610}}' | \
  ndjson-join --left 'd.properties.id' 'd.id' - <(cat joined.tmp.ndjson) | \
   ndjson-map '{"type": d[0].type, "arcs": d[0].arcs, "properties": {"id": d[0].properties.id, "county": d[0].properties.county, "precinct": d[0].properties.precinct, "area_sqmi": d[0].properties.area_sqmi, "winner": d[1] != null ? d[1].winner : null, "winner_margin": d[1] != null ? d[1].winner_margin : null, "votes_sqmi": d[1] != null ? d[1].total_votes / d[0].properties.area_sqmi : null, "total_votes": d[1] != null ? d[1].total_votes : null, "votes_obj": d[1] != null ? d[1].votes_obj : null}}' | \
   ndjson-reduce 'p.geometries.push(d), p' '{"type": "GeometryCollection", "geometries":[]}' > hennepin-precincts.geometries.tmp.ndjson &&

echo "Putting it all together ..." &&
ndjson-join '1' '1' <(ndjson-cat hennepin-precincts-longlat.ndjson) <(cat hennepin-precincts.geometries.tmp.ndjson) |
  ndjson-map '{"type": d[0].type, "bbox": d[0].bbox, "transform": d[0].transform, "objects": {"precincts": {"type": "GeometryCollection", "geometries": d[1].geometries}}, "arcs": d[0].arcs}' > hennepin-precincts-final.json &&
topo2geo precincts=sheriff-results-geo.json < hennepin-precincts-final.json &&

echo "Creating MBtiles for Mapbox upload ..." &&
tippecanoe -o ./hennepin_sheriff.mbtiles -Z 2 -z 14 --generate-ids ./sheriff-results-geo.json &&

echo "Creating SVG ..." &&
mapshaper sheriff-results-geo.json \
  -quiet \
  -proj +proj=utm +zone=15 +ellps=GRS80 +datum=NAD83 +units=m +no_defs \
  -colorizer name=calcFill colors='#feb236,#6b5b95' nodata='#dfdfdf' categories='Rich Stanek,Dave Hutch' \
  -style fill='calcFill(winner)' \
  -o hennepin-sheriff.svg

echo 'Cleaning up ...' &&
rm *.tmp.* &&
rm hennepin-precincts-final.json
