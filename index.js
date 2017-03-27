(function($, d3, firebase) {
  "use strict";

  var allData;
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
      var line = d3.select('.chart-container').append("div");
      line.call(lineChart().data(allData).wardInfo(wardInfo));
      lineChartExists = true;
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

      return db.ref().child('contributors').limitToLast(1).once('value');
    })
    .then(function(snapshot) {

      contributorStats = getFirstItem(snapshot.val());

      //return db.ref().child('stake_and_ward_indexing').limitToLast(1).once('value');
      var stakeRef = db.ref().child('stake_and_ward_indexing')
        .orderByChild('timestamp');
      return stakeRef.once('value');
    })
    .then(function(snapshot) {
      var val = snapshot.val();

      var elapsed = (Date.now() - startTime) / 1000;
      console.log("Seconds to retrieve data:", elapsed);

      makeCharts(val, contributorStats);
    });
  }

  function makeCharts(data, contributorStats) {

    allData = transformData(data);

    //console.log(allData);

    //roundStartIndices = calculateRoundStartIndices(allData);

    latestEntry = allData[allData.length - 1];
    console.log("Processing data from:", latestEntry.timestamp);

    d3.select('.tree-container')
      .node().appendChild(treeXml.documentElement);

    var svg = d3.select("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var tree = treeChart();
    svg.call(tree);

    var stats = d3.select('.stats-container').append("div")
        //.attr("width", "100%")
        //.attr("height", "100%");

    stats.call(statsChart().data(contributorStats));

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
        { "name": "???", "x": 282, "y": 365 },
        { "name": "???", "x": 364, "y": 323 },
        { "name": "???", "x": 446, "y": 345 }
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
          .style("fill", "#279e33")
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

      var oldRecord = 6970;
      totalRec.append("div")
          .text("Stake Total:");

      totalRec.append("div")
          .text(total);

      var prevRecord = selection.append("div")
          .attr("class", "record")
          .classed("record--obselete", function(d) {
            if (total > oldRecord) {
              return true;
            }
            else {
              return false;
            }
          });

      prevRecord.append("div")
          .text("Old Record (July 2016):");

      prevRecord.append("div")
          .text(oldRecord);

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

    switch(round) {
      case 'first':
        score = utils.calculateScore(firstRoundIndexed,
          wardInfo[wardName].size_normalization_ratio,
          wardInfo[wardName].start_value);
        break;
      case 'second':
        var indexed = latestEntry.units[wardName].indexed -
          firstRoundIndexed + wardInfo[wardName].start_value;
        score = utils.calculateScore(indexed,
          wardInfo[wardName].size_normalization_ratio,
          wardInfo[wardName].start_value);
        break;
      case 'third':
        score = 0;
        break;
      default:
        throw "Invalid round";
        break;
    }

    return score;
  }

}($, d3, firebase));
