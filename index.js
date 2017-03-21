(function(d3, firebase) {
  "use strict";

  var roundOneData = [
    [
      "university",
      "san_marcos",
      "horizon"
    ],
    [
      "south_mountain",
      "towne_lake",
      "pioneer"
    ],
    [
      "mission_bay",
      "mcclintock",
      "southshore"
    ]
  ];


  var allData;
  var width;
  var wardInfo;

  firebaseStuff();


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

      return db.ref().child('indexing').limitToLast(1).once('value');
    })
    .then(function(snapshot) {
      var val = snapshot.val();

      makeCharts(getFirstItem(val));
    });
  }

  function makeCharts(data) {

    allData = data;

    var svg = d3.select('.container').append('svg')
        .style("width", "100%")
        .style("height", "100%");

    width = parseInt(svg.style("width"));

    var roundOne = roundOneChart();

    svg.call(roundOne);
  }

  function roundOneChart() {

    var faceoff = faceoffChart();

    function my(selection) {
      var roundOne = selection.append("g")
          .attr("class", "round-one")
          .attr("transform", function(d, i) {
            return svgTranslateString(0, 50);
          })

      roundOne.append("text")
          .attr("class", "title")
          .attr("dx", 0)
          .style("font-size", 36)
        .text("Round One (Mon 3/20 to Sun 3/26)");

      roundOne.append("g")
          .attr("class", 'groups')
          .attr("transform", function(d, i) {
            return svgTranslateString(15, 50);
          })
          .attr("alignment-baseline", "middle")
        .selectAll(".faceoff")
          .data(roundOneData)
        .enter()
          .call(faceoff);
    }

    return my;
  }

  function faceoffChart() {

    var ward = wardMaker();

    function my(selection) {
      selection.append("g")
          .attr("class", "faceoff")
          .attr("transform", function(d, i) {
            return svgTranslateString(0, i*200);
          })
        .selectAll(".ward")
          .data(function(d) { return d; })
        .enter()
        .call(ward);
    }

    return my;
  }

  function wardMaker() {

    function my(selection) {
      var group = selection.append("g")
          .attr("transform", function(d, i) {
            return svgTranslateString(0, i*30);
          });

      group.append("circle")
          .style("fill", "steelblue")
          .attr("r", 10);

      group.append("text")
          .attr("dx", 15)
          .attr("dy", 5)
          .text(function(d) { 
            return wardInfo[d].display_name;
          });

      group.append("text")
          .attr("dx", 150)
          .attr("dy", 5)
          .text(function(d) { 
            if (allData[d] !== undefined) {
              return Math.floor(wardInfo[d].size_normalization_ratio *
                (allData[d].Indexed - wardInfo[d].start_value));
            }
            else {
              return "0";
            }
          });
      
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
