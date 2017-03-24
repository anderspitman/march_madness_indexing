(function(d3, firebase) {

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

  var allData;
  var width;
  var wardInfo;
  var treeXml;

  d3.xml("assets/tree.svg").mimeType("image/svg+xml").get(function(error, xml) {
    if (error) throw error;

    treeXml = xml;

    firebaseStuff();
  });



  function firebaseStuff() {

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

      return db.ref().child('stake_and_ward_indexing').limitToLast(1).once('value');
    })
    .then(function(snapshot) {
      var val = snapshot.val();

      makeCharts(getFirstItem(val));
    });
  }

  function makeCharts(data) {

    console.log("Processing data from:", data.timestamp);
    allData = data.units;

    var container = d3.select('#svg-container')
      .append("g")
        .attr("class", "tree-container")
        .node().appendChild(treeXml.documentElement);


    var svg = d3.select("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    width = parseInt(svg.style("width"));

    var firstRound = firstRoundChart();

    svg.append("g")
        .datum(firstRoundData)
        .attr("class", "first-round")
        .call(firstRound.round("first"));

    svg.append("g")
        .datum(secondRoundData)
        .attr("class", "second-round")
        .call(firstRound.round("second"));

    svg.append("g")
        .datum(thirdRoundData)
        .attr("class", "third-round")
        .call(firstRound.round("third"));
  }

  function firstRoundChart() {

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

  function svgTranslateString(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  function getFirstItem(obj) {
    return obj[Object.keys(obj)];
  }

}(d3, firebase));
