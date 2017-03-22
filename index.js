(function(d3, firebase) {
  "use strict";

 
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


    allData = data;

    console.log(roundOneData);
    console.log(allData);
    console.log(wardInfo);

    var svg = d3.select('.container').append('svg')
        .style("width", "100%")
        .style("height", "100%");

    width = parseInt(svg.style("width"));

    var roundOne = roundOneChart()
      .data(allData)
      .matchupData(roundOneData);

    svg.call(roundOne);
  }

  function roundOneChart() {

    var faceoff = faceoffChart();

    var data;
    var matchupData;

    function my(selection) {

      // compute ward that indexed the most
      var max = Number.MIN_SAFE_INTEGER;
      var maxKey;
      for (var key in data) {
        if (key === 'full_stake') continue;

        if (data[key].Indexed > max) {
          max = data[key].Indexed;
          maxKey = key;
        }
      }

      console.log(maxKey);
      
      var roundOne = selection.append("g")
          .attr("class", "round-one")
          .attr("transform", function(d, i) {
            return svgTranslateString(100, 50);
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
        .selectAll(".faceoff")
          .data(matchupData)
        .enter()
          .call(faceoff.data(data));
    }

    my.data = function(value) {
      if (!arguments.length) return data;
      data = value;
      return my;
    }

    my.matchupData = function(value) {
      if (!arguments.length) return matchupData;
      matchupData = value;
      return my;
    }

    return my;
  }

  function faceoffChart() {

    var ward = wardMaker();

    var data;

    function my(selection) {
      selection.append("g")
          .attr("class", "faceoff")
          .attr("transform", function(d, i) {
            return svgTranslateString(i*350, 0);
          })
        .selectAll(".ward")
          .data(function(d) { return d; })
        .enter()
        .call(ward);
    }

    my.data = function(value) {
      if (!arguments.length) return data;
      data = value;
      return my;
    }

    return my;
  }

  function wardMaker() {

    function my(selection) {
      var group = selection.append("g")
          .attr("transform", function(d, i) {
            return svgTranslateString(i*80, 0);
          });

      group.append("path")
          .attr("d", d3.symbol()
            .type(d3.symbolSquare)
            .size(5000)
          )
          .style("fill", "#31a533")

      group.append("text")
          .attr("font-size", "12px")
          .attr("text-anchor", "middle")
          .attr("dx", 0)
          .attr("dy", 25)
          .text(function(d) { 
            return wardInfo[d].display_name;
          });

      group.append("text")
          .attr("font-size", "12px")
          .attr("text-anchor", "middle")
          .attr("dx", 0)
          .attr("dy", -20)
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


  function branchChart() {

    var topLeft;
    var bottomLeft;
    var topRight;
    var bottomRight;

    var area = d3.area()
      .x1(function(d) { return d.x1; })
      .y1(function(d) { return d.y1; })
      .x0(function(d) { return d.x0; })
      .y0(function(d) { return d.y0; });

    function my(selection) {

      var lineData = [
        { x0: topLeft.x, y0: topLeft.y, x1: topRight.x, y1: topRight.y },
        { x0: bottomLeft.x, y0: bottomLeft.y, x1: bottomRight.x, y1: bottomRight.y }
      ];

      selection.append("path")
        .datum(lineData)
        .attr("fill", "#6b4502")
        //.attr("stroke-width", 10)
        //.attr("stroke", "steelblue")
        .attr("d", area);
    }

    my.topLeft = function(value) {
      if (!arguments.length) return topLeft;
      topLeft = value;
      return my;
    };

    my.bottomLeft = function(value) {
      if (!arguments.length) return bottomLeft;
      bottomLeft = value;
      return my;
    };

    my.topRight = function(value) {
      if (!arguments.length) return topRight;
      topRight = value;
      return my;
    };

    my.bottomRight = function(value) {
      if (!arguments.length) return bottomRight;
      bottomRight = value;
      return my;
    };

    return my;
  }


  function svgTranslateString(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  function getFirstItem(obj) {
    return obj[Object.keys(obj)];
  }

}(d3, firebase));
