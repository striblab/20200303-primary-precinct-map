echo "Downloading precinct results ..." &&
echo "state;county_id;precinct_id;office_id;office_name;district;\
cand_order;cand_name;suffix;incumbent;party;precincts_reporting;\
precincts_voting;votes;votes_pct;votes_office" | \
  # cat - <(wget -O - -o /dev/null https://electionresults.sos.state.mn.us/Results/MediaResult/115?mediafileid=13) > local.csv
  cat - <(wget -O - -o /dev/null https://electionresultsfiles.sos.state.mn.us/20200303/PNPPrecinct.txt) > primary_pres_precinct_20200303.csv

csv2json -s ";" primary_pres_precinct_20200303.csv | \
  ndjson-cat | \
  ndjson-split | \
  ndjson-filter 'd.office_id == "0100" && d.party == "DFL"' > primary_pres_precinct_20200303.ndjson
