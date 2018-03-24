var treeChartModule = (function(d3) {
  "use strict";

  var wardInfo = {
    "horizon" : {
      "display_name" : "Horizon",
      "size_normalization_ratio" : 1.0,
    },
    "mcclintock" : {
      "display_name" : "McClintock",
      "size_normalization_ratio" : 1.0,
    },
    "mission_bay" : {
      "display_name" : "Mission Bay",
      "size_normalization_ratio" : 1.0,
    },
    "pioneer" : {
      "display_name" : "Pioneer",
      "size_normalization_ratio" : 1.0,
    },
    "san_marcos" : {
      "display_name" : "San Marcos",
      "size_normalization_ratio" : 1.0,
    },
    "south_mountain" : {
      "display_name" : "South Mtn",
      "size_normalization_ratio" : 1.0,
    },
    "maricopa" : {
      "display_name" : "Maricopa",
      "size_normalization_ratio" : 1.0,
    },
    "towne_lake" : {
      "display_name" : "Towne Lake",
      "size_normalization_ratio" : 1.0,
    },
    "university" : {
      "display_name" : "University",
      "size_normalization_ratio" : 1.0,
    }
  }

  var latestEntry;

  function TreeChart(options) {
    var domElem  = options.domElement;
    var data = options.data;
    var treeXml = options.treeXml;

    latestEntry = data;

    console.log(latestEntry);

    d3.select(domElem)
      .node().appendChild(treeXml.documentElement);

    var svg = d3.select("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var tree = treeChart();
    svg.call(tree);

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
        { "name": "maricopa", "x": 719, "y": 110 }
      ]
    ];

    var secondRoundData = [
      [
        { "name": "", "x": 103, "y": 265 },
        { "name": "", "x": 63, "y": 335 }
      ],
      [
        { "name": "", "x": 335, "y": 192 },
        { "name": "", "x": 430, "y": 188 }
      ],
      [
        { "name": "", "x": 664, "y": 268 },
        { "name": "", "x": 576, "y": 209 }
      ]
    ];

    var thirdRoundData = [
      [
        { "name": "", "x": 282, "y": 365 },
        { "name": "", "x": 364, "y": 323 },
        { "name": "", "x": 446, "y": 345 }
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
            return utils.svgTranslateString(500, 500);
          });

      var group = legend.selectAll(".legend-ward")
          .data(legendData).enter()
        .append("g")
          .attr("class", "legend-ward")
          .attr("transform", function(d, i) {
            return utils.svgTranslateString(i*(width+10), 0);
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
            return utils.svgTranslateString(d.x, d.y);
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
            if (d.name === "") return "";
            return wardInfo[d.name].display_name;
          });

      group.append("text")
          .attr("font-size", 20)
          .attr("font-weight", "bold")
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", 40)
          .text(function(d) { 

            if (d.name === "") return null;

            if (latestEntry[d.name] !== undefined) {
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
          utils.svgTranslateString(d.x = d3.event.x, d.y = d3.event.y));
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

  function calculateScoreForRound(wardName, round) {
    return latestEntry[wardName].indexed;
  }

  return {
    TreeChart: TreeChart,
  };

}(d3));
