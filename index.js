(function(d3, firebase) {

  var wardInfo;
  var allData;
  var treeXml;

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

    db.ref().child('ward_information').once('value')
    .then(function(snapshot) {

      wardInfo = snapshot.val();

      return db.ref().child('contributors').limitToLast(1).once('value');
    })
    .then(function(snapshot) {

      contributorStats = getFirstItem(snapshot.val());

      return db.ref().child('stake_and_ward_indexing').limitToLast(1).once('value');
    })
    .then(function(snapshot) {
      var val = snapshot.val();

      makeCharts(getFirstItem(val), contributorStats);
    });
  }

  function makeCharts(data, contributorStats) {

    console.log("Processing data from:", data.timestamp);
    allData = data.units;

    d3.select('.tree-container')
      .node().appendChild(treeXml.documentElement);

    var svg = d3.select("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var tree = treeChart();
    svg.call(tree);

    var stats = d3.select('.stats-container').append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    stats.call(statsChart().data(contributorStats));
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
        { "name": "???", "x": 103, "y": 265 },
        { "name": "???", "x": 63, "y": 335 }
      ],
      [
        { "name": "???", "x": 335, "y": 192 },
        { "name": "???", "x": 430, "y": 188 }
      ],
      [
        { "name": "???", "x": 664, "y": 268 },
        { "name": "???", "x": 576, "y": 209 }
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

            if (allData[d.name] !== undefined) {
              return Math.floor(wardInfo[d.name].size_normalization_ratio *
                (allData[d.name].indexed - wardInfo[d.name].start_value));
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

      var totalRec = selection.append("g")
          .attr("transform", svgTranslateString(0, 20))
          .attr("class", "total-records");

      // Calculate total indexed records
      var total = 0;
      Object.keys(data.wards).forEach(function(ward_name) {
        var ward = data.wards[ward_name];
        ward.forEach(function(person) {
          total += person.indexed;
        });
      });

      var oldRecord = 6970;
      totalRec.append("text")
          .attr("font-size", 16)
          .attr("font-weight", "bold")
          .text("Stake Total:");

      totalRec.append("text")
          .attr("y", 20)
          .attr("font-size", 16)
          .attr("font-weight", "bold")
          .text(total);

      var prevRecord = selection.append("g")
          .attr("transform", svgTranslateString(0, 70))
          .attr("class", "previous-record")

      prevRecord.append("text")
          .attr("font-size", 16)
          .attr("font-weight", "bold")
          .attr("text-decoration", function(d) {
            if (total > oldRecord) {
              return "line-through";
            }
            else {
              return null;
            }
          })
          .text("Old Record (July 2016):");

      prevRecord.append("text")
          .attr("font-size", 16)
          .attr("font-weight", "bold")
          .attr("y", 20)
          .attr("text-decoration", function(d) {
            if (total > oldRecord) {
              return "line-through";
            }
            else {
              return null;
            }
          })
          .text(oldRecord);

      var leaders = computeLeaderboard(data);

      console.log(leaders);

      var leaderboard = selection.append("g")
          .attr("class", "leaderboard")
          .attr("transform", svgTranslateString(0, 120));

      leaderboard.append("text")
          .attr("font-size", 16)
          .attr("font-weight", "bold")
          //.attr("text-anchor", "middle")
          .attr("text-decoration", "underline")
          //.attr("x", 70)
          .text("Leaderboard");

      leaderboard.append("g")
          .attr("class", "leaders")
          .attr("transform", svgTranslateString(0, 20))
        .selectAll(".leader")
          .data(leaders)
        .enter().append("g")
          .attr("class", "leader")
          .attr("transform", function(d, i) {
            return svgTranslateString(0, i*20);
          })
        .append("text")
          .text(function(d, i) {
            var nameSplit = d.name.split(" ");

            var name = nameSplit[0];

            if (nameSplit.length === 1) {
              name = nameSplit[0];
            }
            else {
              name = nameSplit[0] + " " + nameSplit[nameSplit.length - 1];
            }

            return (i + 1) + " " + name + " (" + shortNameMap[d.ward_name] + ")" + " - " + d.indexed;
          })
    }

    my.data = function(value) {
      if (!arguments.length) return data;
      data = value;
      return my;
    }

    return my;
  }

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

}(d3, firebase));
