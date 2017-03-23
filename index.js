(function(d3, firebase) {

  var firstRoundData = [
    [
      { "name": "university", "x": 8, "y": 10 },
      { "name": "san_marcos", "x": 30, "y": 7 },
      { "name": "horizon", "x": 51, "y": 10 }
    ],
    [
      { "name": "south_mountain", "x": 72, "y": 10 },
      { "name": "towne_lake", "x": 93, "y": 8 },
      { "name": "pioneer", "x": 114, "y": 10 }
    ],
    [
      { "name": "mission_bay", "x": 136, "y": 10 },
      { "name": "mcclintock", "x": 158, "y": 8 },
      { "name": "southshore", "x": 180, "y": 10 }
    ]
  ];

  var secondRoundData = [
    [
      { "name": "???", "x": 18, "y": 55 },
      { "name": "???", "x": 56, "y": 52 }
    ],
    [
      { "name": "???", "x": 81, "y": 54 },
      { "name": "???", "x": 112, "y": 54 }
    ],
    [
      { "name": "???", "x": 136, "y": 54 },
      { "name": "???", "x": 180, "y": 55 }
    ]
  ];

  var thirdRoundData = [
    [
      { "name": "???", "x": 38, "y": 108 },
      { "name": "???", "x": 84, "y": 108 },
      { "name": "???", "x": 123, "y": 111 }
    ]
  ];


  var allData;
  var width;
  var wardInfo;
  var treeXml;

  d3.xml("assets/tree-no-leaves.svg").mimeType("image/svg+xml").get(function(error, xml) {
    if (error) throw error;
    //document.querySelector(".container").appendChild(xml.documentElement);

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

    //console.log(allData);

    //var svg = d3.select('.container').append('svg')
    //    .attr("width", "100%")
    //    .attr("height", "100%");

    //svg.append("g")
    //    .attr("class", "tree-container")
    //    .node().appendChild(treeXml.documentElement);
    
    var container = d3.select('.container')
      .append("g")
        .attr("class", "tree-container")
        .node().appendChild(treeXml.documentElement);


    var svg = d3.select("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    //var tree = svg.select(".tree-container")
    //  .select("svg")
    //    .attr("width", "100%")
    //    .attr("height", "100%");

    //var svg = d3.select('svg')
    //    .style("width", "100%")
    //    .style("height", "100%");

    width = parseInt(svg.style("width"));

    //var roundOne = roundOneChart();
    //svg.call(roundOne);
    
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

      var width = 20;

      group.append("rect")
          .style("fill", "#279e33")
          .attr("x", 0)
          .attr("y", 0)
          .attr("rx", 5)
          .attr("ry", 5)
          .attr("width", width)
          .attr("height", 20);

      group.append("text")
          .attr("font-size", 3)
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", 6)
          .text(function(d) { 
            if (d.name === "???") return "???";
            return wardInfo[d.name].display_name;
          });

      group.append("text")
          .attr("font-size", 7)
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", 15)
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
      
    }

    my.round = function(value) {
      if (!arguments.length) return round;
      round = value;
      return my;
    }

    return my;
  }

//  function roundOneChart() {
//
//    var faceoff = faceoffChart();
//
//    function my(selection) {
//      var roundOne = selection.append("g")
//          .attr("class", "round-one")
//          .attr("transform", function(d, i) {
//            return svgTranslateString(0, 50);
//          })
//
//      roundOne.append("text")
//          .attr("class", "title")
//          .attr("dx", 0)
//          .style("font-size", 36)
//        .text("Round One (Mon 3/20 to Sun 3/26)");
//
//      roundOne.append("g")
//          .attr("class", 'groups')
//          .attr("transform", function(d, i) {
//            return svgTranslateString(15, 50);
//          })
//          .attr("alignment-baseline", "middle")
//        .selectAll(".faceoff")
//          .data(firstRoundData)
//        .enter()
//          .call(faceoff);
//    }
//
//    return my;
//  }
//
//  function faceoffChart() {
//
//    var ward = wardChart();
//
//    function my(selection) {
//      selection.append("g")
//          .attr("class", "faceoff")
//          .attr("transform", function(d, i) {
//            return svgTranslateString(0, i*200);
//          })
//        .selectAll(".ward")
//          .data(function(d) { return d; })
//        .enter()
//        .call(ward);
//    }
//
//    return my;
//  }
//
//  function wardChart() {
//
//    function my(selection) {
//      var group = selection.append("g")
//          .attr("transform", function(d, i) {
//            return svgTranslateString(0, i*30);
//          });
//
//      group.append("circle")
//          .style("fill", "steelblue")
//          .attr("r", 10);
//
//      group.append("text")
//          .attr("dx", 15)
//          .attr("dy", 5)
//          .text(function(d) { 
//            return wardInfo[d.name].display_name;
//          });
//
//      group.append("text")
//          .attr("dx", 150)
//          .attr("dy", 5)
//          .text(function(d) { 
//            if (allData[d.name] !== undefined) {
//              return Math.floor(wardInfo[d.name].size_normalization_ratio *
//                (allData[d.name].indexed - wardInfo[d.name].start_value));
//            }
//            else {
//              return "0";
//            }
//          });
//      
//    }
//
//    return my;
//  }

  function svgTranslateString(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  function getFirstItem(obj) {
    return obj[Object.keys(obj)];
  }

}(d3, firebase));
