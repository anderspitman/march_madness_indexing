(function(d3) {
  "use strict";

  var unitMap = {
    "Tempe Arizona YSA Stake": "full_stake",
    "Horizon YSA Ward": "horizon",
    "McClintock YSA Ward": "mcclintock",
    "Mission Bay YSA Ward": "mission_bay",
    "San Marcos YSA Ward": "san_marcos",
    "South Mountain YSA Ward": "south_mountain",
    "Towne Lake YSA Ward": "towne_lake",
    "University YSA Ward": "university",
    "Southshore YSA Ward": "southshore",
    "Pioneer YSA Ward": "pioneer"
  };

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

  var displayNames = {
    "university": "University",
    "san_marcos": "San Marcos",
    "horizon": "Horizon",
    "south_mountain": "South Mountain",
    "towne_lake": "Town Lake",
    "pioneer": "Pioneer",
    "mission_bay": "Mission Bay",
    "mcclintock": "McClintock",
    "southshore": "Southshore"
  };

  var startCorrections = {
    "university": 572,
    "san_marcos": 83,
    "horizon": 20,
    "south_mountain": 0,
    "towne_lake": 49,
    "pioneer": 0,
    "mission_bay": 778,
    "mcclintock": 441,
    "southshore": 0
  };

  var ratios = {
    "university": 1.30,
    "san_marcos": 1.34,
    "horizon": 1.96,
    "south_mountain": 1.55,
    "towne_lake": 1.0,
    "pioneer": 1.60,
    "mission_bay": 1.46,
    "mcclintock": 2.04,
    "southshore": 1.72
  };

  d3.json("https://rawgit.com/anderspitman/march_madness_indexing_data/master/data.json", function(data) {
    var data = data.map(function(record) {
      record.Indexed = +record.Indexed;
      record.Arbitrated = +record.Arbitrated;
      record['Redo Batches'] = +record['Redo Batches'];
      return record;
    });

    main(data);
  });

  var allData;
  var width;

  function main(data) {

    allData = transformData(data);

    console.log(allData);

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
            return svgTranslateString(width/4, 50);
          })

      roundOne.append("text")
          .attr("class", "title")
          .attr("dx", 0)
          .style("font-size", 36)
        .text("Round One (Mon 3/20 to Sun 3/26)");

      roundOne.append("g")
          .attr("class", 'groups')
          .attr("transform", function(d, i) {
            return svgTranslateString(190, 50);
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
            return displayNames[d];
          });

      group.append("text")
          .attr("dx", 150)
          .attr("dy", 5)
          .text(function(d) { 
            if (allData[d] !== undefined) {
              return Math.floor(ratios[d] * (allData[d].Indexed - startCorrections[d]));
            }
            else {
              return "0";
            }
          });
      
    }

    return my;
  }

  function transformData(data) {
    var newData = {};


    data.forEach(function(record) {
      if (unitMap[record.Name] !== undefined) {
        newData[unitMap[record.Name]] = record;
      }
    });

    return newData;
  }

  function svgTranslateString(x, y) {
    return "translate(" + x + "," + y + ")";
  }

}(d3));
