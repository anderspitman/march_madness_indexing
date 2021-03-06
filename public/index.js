(function($, d3, firebase) {
  "use strict";

  var displayNameMap = {
    'south_mountain': 'South Mountain',
    'university': 'University',
    'san_marcos': 'San Marcos',
    'towne_lake': 'Towne Lake',
    'southshore': 'Southshore',
    'horizon': 'Horizon',
    'mcclintock': 'McClintock',
    'mission_bay': 'Mission Bay',
    'pioneer': 'Pioneer'
  };

  var allData;
  var aprilData;
  var wardInfo;
  var latestEntry;
  //var roundStartIndices;
  var treeXml;

  $('#mainTabs a').click(function(e) {
    e.preventDefault();
    $(this).tab('show');
  });

  var lineChartExists = false;
  $('#mainTabs a[href="#chart"]').on('shown.bs.tab', function(e) {

    // TODO: Hack. Figure out proper way to not add a chart every time the
    // tab is clicked.
    if (!lineChartExists) {

      var lc = lineChart();
      var line = d3.select('.chart-container').append("div");
      lc
        .data(allData)
        .wardInfo(wardInfo)
        .startDate(new Date("2017-03-22T23:00:00-07:00"))
        .endDate(new Date());
      line.call(lc);

      lineChartExists = true;
    }
  });

  var round1ChartExists = false;
  $('#mainTabs a[href="#chart_round1"]').on('shown.bs.tab', function(e) {
    if (!round1ChartExists) {

      var lc = lineChart();
      var lineRound1 = d3.select('.chart-round1-container').append("div");
      lc
        .data(allData)
        .round('first')
        .wardInfo(wardInfo)
        .startDate(new Date("2017-03-22T23:00:00-07:00"))
        .endDate(new Date("2017-03-27T00:00:00-07:00"));
      lineRound1.call(lc);
      round1ChartExists = true;
    }
  });

  var round2ChartExists = false;
  $('#mainTabs a[href="#chart_round2"]').on('shown.bs.tab', function(e) {
    if (!round2ChartExists) {

      var lc = lineChart();
      var lineRound2 = d3.select('.chart-round2-container').append("div");
      lc
        .data(allData)
        .round('second')
        .wardInfo(wardInfo)
        .startDate(new Date("2017-03-27T00:00:00-07:00"))
        .endDate(new Date("2017-04-03T00:00:00-07:00"));
      lineRound2.call(lc);
      round2ChartExists = true;
    }
  });

  var round3ChartExists = false;
  $('#mainTabs a[href="#chart_round3"]').on('shown.bs.tab', function(e) {
    if (!round3ChartExists) {

      var lc = lineChart();
      var lineRound3 = d3.select('.chart-round3-container').append("div");
      lc
        .data(allData)
        .round('third')
        .wardInfo(wardInfo)
        .startDate(new Date("2017-04-03T00:00:00-07:00"))
        .endDate(new Date());
      lineRound3.call(lc);
      round3ChartExists = true;
    }
  });

  //$('#mainTabs a:last').tab('show');

  d3.xml("assets/tree.svg").mimeType("image/svg+xml").get(function(error, xml) {
    if (error) throw error;

    treeXml = xml;

    firebaseStuff();
  });


  function firebaseStuff() {

    var contributorStats;
    var contributorStatsMarch;

    var config = {
      apiKey: "AIzaSyAkHMLIBu1BMxSSrv7jX_6wnbg2WnujlCg",
      authDomain: "march-madness-indexing.firebaseapp.com",
      databaseURL: "https://march-madness-indexing.firebaseio.com",
      storageBucket: "march-madness-indexing.appspot.com",
      messagingSenderId: "554642006729"
    };
    var firebaseApp = firebase.initializeApp(config);

    var db = firebase.database();

    var startTime = Date.now();

    db.ref().child('ward_information').once('value')
    .then(function(snapshot) {

      wardInfo = snapshot.val();

      return db.ref().child('contributors').orderByKey().limitToLast(1).once('value');
    })
    .then(function(snapshot) {
      contributorStatsMarch = getFirstItem(snapshot.val());

      return db.ref().child('contributors_april').orderByKey().limitToLast(1).once('value');
    })
    .then(function(snapshot) {
      contributorStats = getFirstItem(snapshot.val());

      var ref = db.ref().child('stake_and_ward_indexing_april')
        .orderByChild('timestamp');
      return ref.once('value');
    })
    .then(function(snapshot) {

      aprilData = snapshot.val();


      //return db.ref().child('stake_and_ward_indexing').limitToLast(1).once('value');
      var stakeRef = db.ref().child('stake_and_ward_indexing')
        .orderByChild('timestamp');
      return stakeRef.once('value');
    })
    .then(function(snapshot) {
      var val = snapshot.val();

      var elapsed = (Date.now() - startTime) / 1000;
      console.log("Seconds to retrieve data:", elapsed);

      makeCharts(val, contributorStatsMarch, contributorStats);
    });
  }

  function makeCharts(data, contributorStatsMarch, contributorStats) {

    var apd = transformData(aprilData);
    allData = transformData(data);

    //roundStartIndices = calculateRoundStartIndices(allData);

    latestEntry = allData[allData.length - 1];
    console.log("Processing data from:", latestEntry.timestamp);

    apd.forEach(function(entry) {
      //if (entry.date < new Date("2017-04-01T00:00:00-07:00")) {

      var units = {};
      Object.keys(latestEntry.units).forEach(function(unit) {

        // clone it
        units[unit] = $.extend(true, {}, latestEntry.units[unit]);

        if (entry.units[unit]) {
          units[unit].arbitrated += entry.units[unit].arbitrated;
          units[unit].indexed += entry.units[unit].indexed;
          units[unit].redo_batches += entry.units[unit].redo_batches;
        }
      });

      var combined = {
        timestamp: entry.timestamp,
        date: entry.date,
        units: units
      };

      allData.push(combined);
      //}
    });

    latestEntry = allData[allData.length - 1];

    d3.select('.tree-container')
      .node().appendChild(treeXml.documentElement);

    var svg = d3.select("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var tree = treeChart();
    svg.call(tree);

    var stats = d3.select('.leaderboard-march-container').append("div");
    stats.call(statsChart().data(contributorStatsMarch));

    var stats = d3.select('.leaderboard-april-container').append("div");
    stats.call(statsChart().data(contributorStats));

    var wardTotals = d3.select('.ward-totals-container').append("div");
    wardTotals.call(wardTotalsChart().data(latestEntry));

    // line chart
    //var line = d3.select('.chart-container').append("div");
    //line.call(lineChart().data(allData).wardInfo(wardInfo));
    
  }

  function treeChart() {

    var firstRoundData = [
      [
        { "name": "university", "x": 54, "y": 101 },
        { "name": "san_marcos", "x": 151, "y": 95 },
        { "name": "horizon", "x": 213, "y": 121 }
      ],
      [
        { "name": "south_mountain", "x": 291, "y": 31 },
        { "name": "towne_lake", "x": 365, "y": 22 },
        { "name": "pioneer", "x": 452, "y": 30 }
      ],
      [
        { "name": "mission_bay", "x": 569, "y": 88 },
        { "name": "mcclintock", "x": 650, "y": 62 },
        { "name": "southshore", "x": 719, "y": 110 }
      ]
    ];

    var secondRoundData = [
      [
        { "name": "mission_bay", "x": 103, "y": 265 },
        { "name": "horizon", "x": 63, "y": 335 }
      ],
      [
        { "name": "south_mountain", "x": 335, "y": 192 },
        { "name": "university", "x": 430, "y": 188 }
      ],
      [
        { "name": "pioneer", "x": 664, "y": 268 },
        { "name": "mcclintock", "x": 576, "y": 209 }
      ]
    ];

    var thirdRoundData = [
      [
        { "name": "mission_bay", "x": 282, "y": 365 },
        { "name": "south_mountain", "x": 364, "y": 323 },
        { "name": "mcclintock", "x": 446, "y": 345 }
      ]
    ];

    var round = roundChart();

    function my(selection) {

      selection.append("g")
          .datum(firstRoundData)
          .attr("class", "first-round")
          .call(round.round("first"));

      selection.append("g")
          .datum(secondRoundData)
          .attr("class", "second-round")
          .call(round.round("second"));

      selection.append("g")
          .datum(thirdRoundData)
          .attr("class", "third-round")
          .call(round.round("third"));

      var legendData = ['1st', '2nd', '3rd'];
      var legendColors = ['#d37108', '#b2a210', '#109b09'];

      var width = 54;
      var height = width;

      var legend = selection.append("g")
          .attr("class", "bracket-legend")
          .attr("transform", function(d, i) {
            return svgTranslateString(500, 500);
          });

      var group = legend.selectAll(".legend-ward")
          .data(legendData).enter()
        .append("g")
          .attr("class", "legend-ward")
          .attr("transform", function(d, i) {
            return svgTranslateString(i*(width+10), 0);
          });

      
      group.append("rect")
          .style("fill", function(d, i) {
            return legendColors[i];
          })
          .attr("x", 0)
          .attr("y", 0)
          .attr("rx", 5)
          .attr("ry", 5)
          .attr("width", width)
          .attr("height", height);

      group.append("text")
          .attr("font-size", 16)
          .attr("font-weight", "bold")
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", 22)
          .text(function(d) { 
            return d;
          });

      group.append("text")
          .attr("font-size", 16)
          .attr("font-weight", "bold")
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", 40)
          .text("Round");
    }

    return my;
  }

  function roundChart() {

    var faceoff = faceoffChart();
    var round;

    function my(selection) {

      var cls = "faceoff-" + round + "-round";
      selection.selectAll('.' + cls)
          .data(function(d) { return d; })
        .enter()
          .call(faceoff.round(round));
    }

    my.data = function(value) {
      if (!arguments.length) return data;
      data = value;
      return my;
    }

    my.round = function(value) {
      if (!arguments.length) return round;
      round = value;
      return my;
    }

    return my;
  }

  function faceoffChart() {

    var ward = wardChart();
    var round;

    function my(selection) {

      var cls = "faceoff-" + round + "-round";

      selection.append("g")
          .attr("class", cls)
        .selectAll(".ward-" + round + "-round")
          .data(function(d) { return d; })
        .enter()
        .call(ward.round(round));
    }

    my.round = function(value) {
      if (!arguments.length) return round;
      round = value;
      return my;
    }

    return my;
  }

  function wardChart() {

    var round;

    function my(selection) {
      var group = selection.append("g")
          .attr("class", "ward-" + round + "-round")
          .attr("transform", function(d) {
            return svgTranslateString(d.x, d.y);
          });
          //.call(d3.drag()
          //  .on("start", dragstarted)
          //  .on("drag", dragged)
          //  .on("end", dragended));


      var width = 54;
      var height = width;

      group.append("rect")
          //.style("fill", "#279e33")
          .attr("x", 0)
          .attr("y", 0)
          .attr("rx", 5)
          .attr("ry", 5)
          .attr("width", width)
          .attr("height", height);

      group.append("text")
          .attr("font-size", 8)
          .attr("font-weight", "bold")
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", 15)
          .text(function(d) { 
            if (d.name === "???") return "???";
            return wardInfo[d.name].display_name;
          });

      group.append("text")
          .attr("font-size", 20)
          .attr("font-weight", "bold")
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", 40)
          .text(function(d) { 

            if (d.name === "???") return null;

            if (latestEntry.units[d.name] !== undefined) {
              return calculateScoreForRound(d.name, round);
            }
            else {
              return "0";
            }
          });

      function dragstarted(d) {
        d3.select(this).raise().classed("active", true);
      }

      function dragged(d) {
        //d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
        d3.select(this).attr("transform",
          svgTranslateString(d.x = d3.event.x, d.y = d3.event.y));
      }

      function dragended(d) {
        d3.select(this).classed("active", false);
      }

    }

    my.round = function(value) {
      if (!arguments.length) return round;
      round = value;
      return my;
    }

    return my;
  }

  function statsChart() {

    var shortNameMap = {
      'south_mountain': 'SOMO',
      'university': 'UNIV',
      'san_marcos': 'SANM',
      'towne_lake': 'TNLK',
      'southshore': 'SOSH',
      'horizon': 'HRZN',
      'mcclintock': 'MCTK',
      'mission_bay': 'MISB',
      'pioneer': 'PION'
    };

    var data;

    function my(selection) {

      var totalRec = selection.append("div")
          .attr("class", "record");

      // Calculate total indexed records
      var total = 0;
      Object.keys(data.wards).forEach(function(ward_name) {
        var ward = data.wards[ward_name];
        ward.forEach(function(person) {
          total += person.indexed;
        });
      });

      //var oldRecord = 6970;
      totalRec.append("div")
          .text("Stake Total for month:");

      totalRec.append("div")
          .text(total);

     
      //var total2016Val = 18342;
      //var total2016 = selection.append("div")
      //    .attr("class", "record")
      //    .classed("record--obselete", function(d) {
      //      if (total > total2016Val) {
      //        return true;
      //      }
      //      else {
      //        return false;
      //      }
      //    });

      //total2016.append("div")
      //    .text("Total indexed in ALL of 2016:");

      //total2016.append("div")
      //    .text(total2016Val);

      //var prevRecord = selection.append("div")
      //    .attr("class", "record")
      //    .classed("record--obselete", function(d) {
      //      if (total > oldRecord) {
      //        return true;
      //      }
      //      else {
      //        return false;
      //      }
      //    });

      //prevRecord.append("div")
      //    .text("Old monthly record (July 2016):");

      //prevRecord.append("div")
      //    .text(oldRecord);

      var leaders = computeLeaderboard(data);

      var leaderboard = selection.append("div")
          .attr("class", "leaderboard")

      var table = leaderboard.append("table")
          .attr("class", "table table-striped leader-table");

      var headerRow = table.append("thead")
        .append("tr");

      headerRow.append("th")
          .text("Rank");
      headerRow.append("th")
          .text("Name");
      headerRow.append("th")
          .text("Ward");
      headerRow.append("th")
          .text("Indexed");
      
      var tableBody = table.append("tbody");

      var leaders = tableBody.selectAll(".leader")
          .data(leaders)
        .enter().append("tr")
          .attr("class", "leader")

      leaders.append("td")
          .text(function(d, i) { return i + 1; });

      leaders.append("td")
          .attr("class", "leaderboard__leader__name")
          .text(function(d) {
            var nameSplit = d.name.split(" ");

            var name = nameSplit[0];

            if (nameSplit.length === 1) {
              name = nameSplit[0];
            }
            else {
              name = nameSplit[0] + " " + nameSplit[nameSplit.length - 1];
            }

            return name;
          })

      leaders.append("td")
          .text(function(d) { return shortNameMap[d.ward_name]; });

      leaders.append("td")
          .text(function(d) { return d.indexed; });
    }

    my.data = function(value) {
      if (!arguments.length) return data;
      data = value;
      return my;
    }

    return my;
  }

  function wardTotalsChart() {
    var data;

    function my(selection) {
      var totals = calculateWardTotals(data);

      var wardTotals = selection.append("div")
          .attr("class", "ward-totals")

      var table = wardTotals.append("table")
          .attr("class", "table table-striped ward-totals-table");

      var headerRow = table.append("thead")
        .append("tr");

      headerRow.append("th")
          .text("Rank");
      headerRow.append("th")
          .text("Ward");
      headerRow.append("th")
          .text("Total Indexed Records");
      
      var tableBody = table.append("tbody");

      var wards = tableBody.selectAll(".ward-totals__ward")
          .data(totals)
        .enter().append("tr")
          .attr("class", "ward-totals__ward")

      wards.append("td")
          .text(function(d, i) { return i + 1; });

      wards.append("td")
          .text(function(d) { return displayNameMap[d.ward_name]; });

      wards.append("td")
          .text(function(d) { return d.total_records; });

    }

    my.data = function(value) {
      if (!arguments.length) return data;
      data = value;
      return my;
    }

    return my;
  }

  //function leaderBoardRow() {
  //  function my(selection) {
  //    selection.append("tr")
  //        .data(function(d) { return d; })
  //      .enter().append("td"
  //  }

  //  return my;
  //}

  function svgTranslateString(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  function getFirstItem(obj) {
    return obj[Object.keys(obj)];
  }

  function calculateWardTotals(data) {

    var wards = [];
    Object.keys(data.units).forEach(function(wardName) {

      if (wardName !== 'full_stake') {
        var indexed = data.units[wardName].indexed;
        var totalRecords = indexed - wardInfo[wardName].start_value;
        wards.push({ ward_name: wardName, total_records: totalRecords });
      }

    });

    wards.sort(function(a, b) {
      var aRecs = a.total_records;
      var bRecs = b.total_records;
      if (aRecs > bRecs) return -1;
      if (bRecs > aRecs) return 1;
      return 0;
    });

    return wards;
  }

  function computeLeaderboard(data) {

    var dataArray = [];
    Object.keys(data.wards).forEach(function(wardName) {
      data.wards[wardName].forEach(function(person) {
        person.ward_name = wardName;
      });
      dataArray.push(data.wards[wardName]);
    });

    var flat = dataArray.reduce(function(acc, val) {
      return acc.concat(val);
    });

    var sorted = flat.sort(function(a, b) {
      var keyA = a.indexed;
      var keyB = b.indexed;

      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    }).reverse();

    var leaders = sorted.slice(0, 20);

    return leaders;
  }

  function transformData(data) {
    var dataArray = objectToArray(data, function(elem) {
      elem.date = new Date(elem.timestamp);
      return elem;
    });

    var sorted = dataArray.sort(function(a, b) {
      var aTime = a.date.getTime();
      var bTime = b.date.getTime();

      // ascending order
      if (aTime < bTime) return -1;
      if (aTime > bTime) return 1;
      return 0;
    });

    return sorted;
  }

  function objectToArray(obj, transformFunc) {
    var array = [];
    Object.keys(obj).forEach(function(key) {
      if (transformFunc !== undefined) {
        array.push(transformFunc(obj[key]));
      }
      else {
        array.push(obj[key]);
      }
    });

    return array;
  }

  //function calculateRoundStartIndices(data) {
  //  var roundStartDates = {
  //    first: new Date("2017-03-20T00:00:00-07:00"),
  //    second: new Date("2017-03-27T00:00:00-07:00"),
  //    third: new Date("2017-04-03T00:00:00-07:00")
  //  };

  //  // find indices of start dates
  //  var indices = {
  //    first: 0,
  //    second: 0,
  //    third: 0
  //  };

  //  data.forEach(function(entry, index) {

  //    ['first', 'second', 'third'].forEach(function(round) {
  //      if (entry.date < roundStartDates[round]) {
  //        indices[round] = index;
  //      }
  //    });

  //  });

  //  console.log(indices);

  //  return indices;
  //}

  function calculateScoreForRound(wardName, round) {

    //var correction;
    //if (round === 'first') {
    //  correction = 0;
    //}
    //else {
    //  correction = allData[roundStartIndices[round]].units[wardName].indexed;
    //}

    //var indexed =
    //  latestEntry.units[wardName].indexed -
    //  correction +
    //  wardInfo[wardName].start_value;

    //var score = utils.calculateScore(indexed,
    //  wardInfo[wardName].size_normalization_ratio,
    //  wardInfo[wardName].start_value);

    var score;

    var firstRoundIndexed = allData[278].units[wardName].indexed;
    var secondRoundIndexed = allData[870].units[wardName].indexed;

    switch(round) {
      case 'first':
        score = utils.calculateScore(firstRoundIndexed,
          wardInfo[wardName].size_normalization_ratio,
          wardInfo[wardName].start_value);
        break;
      case 'second':
        //var indexed = latestEntry.units[wardName].indexed -
        //  firstRoundIndexed + wardInfo[wardName].start_value;
        //score = utils.calculateScore(indexed,
        //  wardInfo[wardName].size_normalization_ratio,
        //  wardInfo[wardName].start_value);
        var indexed = secondRoundIndexed -
          firstRoundIndexed + wardInfo[wardName].start_value;

        // correction for the "Bills Bomb"
        if (wardName === 'south_mountain') {
          indexed -= 1489;
        }

        // correction for Jeff's web indexing
        if (wardName === 'university') {
          indexed += 213;
        }

        score = utils.calculateScore(indexed,
          wardInfo[wardName].size_normalization_ratio,
          wardInfo[wardName].start_value);
        break;
      case 'third':
        var indexed = latestEntry.units[wardName].indexed -
          secondRoundIndexed + wardInfo[wardName].start_value;
        score = utils.calculateScore(indexed,
          wardInfo[wardName].size_normalization_ratio,
          wardInfo[wardName].start_value);
        break;
      default:
        throw "Invalid round";
        break;
    }

    return score;
  }

}($, d3, firebase));
