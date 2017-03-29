var lineChart = (function(d3) {
  "use strict";

  function lineChart() {
    var margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 50
    };

    var data;
    var round;
    var wardInfo;
    var startDate;
    var endDate;

    function my(selection) {
      var svg = selection.append("svg")
          .attr("class", "line-chart-svg")
      var width = parseInt(svg.style("width")) - margin.left - margin.right;
      var height = parseInt(svg.style("height")) - margin.top - margin.bottom;

      var g = svg.append("g")
          .attr("transform", svgTranslateString(margin.left, margin.top));

      var tData = transformData(data);
      console.log(tData);

      //var prev = tData.units[8][0];
      //tData.units[8].forEach(function(entry, index) {
      //  if ((entry.indexed - prev.indexed) > 189) {
      //    console.log("Found it", index, entry);
      //  }
      //  prev = entry;
      //});

      var x = d3.scaleTime()
          .domain([startDate, endDate])
          .rangeRound([0, width]);

      var max = calculateMax(tData);

      var y = d3.scaleLinear()
          .domain([0, max])
          .rangeRound([height, 0]);

      var line = d3.line()
          .x(function(d, i) { return x(tData.dates[i]); })
          .y(function(d, i) {



            var date = tData.dates[i];
            // TODO FIXME: Major hack to make the graph look right historically
            // Hard coded to handle some University and Mission Bay stuff
            var offset = 0;
            if (d.unit_name === 'university' &&
                date < new Date('2017-03-25T00:00:00-07:00')) {
              // 248 represents Karen van der Werf's indexing
              offset = 248;
            }
            if (d.unit_name === 'mission_bay' &&
                date < new Date('2017-03-27T23:00:00-07:00')) {
              // 76 represents David Heywood's indexing
              offset = 76;
            }

            // TODO: Very hacky. At least remove the hard coded 2nd round
            // number...
            var indexed = d.indexed;
            if (round === 'second') {

              var round2StartIndex = 278;
              if (i < round2StartIndex) return y(0);

              var firstRoundIndexed =
                data[round2StartIndex].units[d.unit_name].indexed;
              var indexed = d.indexed -
                firstRoundIndexed + wardInfo[d.unit_name].start_value - offset;
            }

            var val = utils.calculateScore(indexed,
              wardInfo[d.unit_name].size_normalization_ratio,
              wardInfo[d.unit_name].start_value - offset);
            return y(val);
          })

      g.append("g")
          .attr("transform", svgTranslateString(0, height))
          .call(d3.axisBottom(x))
      
      g.append("g")
          .call(d3.axisLeft(y));

      g.selectAll(".ward")
          .data(tData.units).enter()
        .append("path")
          .attr("class", "ward")
          .attr("fill", "none")
          .attr("stroke", function(d, i) {
            return d3.schemeCategory10[i];
          })
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 1.5)
          .attr("d", line);

      if (!round) {
        // start of round 2 marker
        var roundTwoMarker = g.append("g")
            .attr("class", "round-start-marker")

        roundTwoMarker.append("text")
            .attr("x", function(d) { return x(new Date("2017-03-27T00:00:00-07:00")); })
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .text("Start of Round 2");

        roundTwoMarker.append("rect")
            .attr("x", function(d) { return x(new Date("2017-03-27T00:00:00-07:00")); })
            .attr("y", 0)
            .attr("width", 2)
            .attr("height", height)
            .attr("fill", "red");
      }

      var legendWards = g.append("g")
          .attr("class", "legend")
          .attr("transform", svgTranslateString(15, 15))
        .selectAll('.ward')
          .data(tData.units).enter()
        .append("g")
          .attr("class", "legend__ward");

      legendWards.append("circle")
          .attr("r", 10)
          .attr("cy", function(d, i) { return i*20; })
          .attr("fill", function(d, i) {
            return d3.schemeCategory10[i];
          });

      legendWards.append("text")
          .attr("x", 15)
          .attr("y", function(d, i) { return i*20 + 5; })
          .text(function(d) {
            return wardInfo[d[0].unit_name].display_name;
          });

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

    my.startDate = function(value) {
      if (!arguments.length) return startDate;
      startDate = value;
      return my;
    }

    my.endDate = function(value) {
      if (!arguments.length) return endDate;
      endDate = value;
      return my;
    }

    my.wardInfo = function(value) {
      if (!arguments.length) return wardInfo;
      wardInfo = value;
      return my;
    }

    function transformData(data) {
      var wards = [];

      var newData = {
        dates : [],
        units: {}
      };

      // get into object form
      data.forEach(function(entry) {
        newData.dates.push(entry.date);

        Object.keys(entry.units).forEach(function(unitName) {
          if (unitName !== "full_stake" && unitName !== "moved") {
            if (newData.units[unitName] === undefined) {
              newData.units[unitName] = []
            }
            newData.units[unitName].push(entry.units[unitName].indexed);
          }
        });
      });

      // back into array
      var finalData = {
        dates: newData.dates,
        units: []
      };

      // TODO: Lots of duplication storing the name for every entry but I'm
      // too fried to think of a better solution right now
      Object.keys(newData.units).forEach(function(unitName) {
        //finalData.units.push({
        //  unit_name: unitName,
        //  data: newData.units[unitName]
        //});
        var arr = [];
        newData.units[unitName].forEach(function(entry) {
          arr.push({
            unit_name: unitName,
            indexed: entry
          });
        });

        finalData.units.push(arr);
      });

      return finalData;
    }

    function calculateMax(data) {
      var max = 0;

      data.units.forEach(function(ward) {

        // max should be last entry for the ward
        var last = ward[ward.length - 1];
        var wardMax = utils.calculateScore(last.indexed,
          wardInfo[last.unit_name].size_normalization_ratio,
          wardInfo[last.unit_name].start_value);

        if (wardMax > max) {
          max = wardMax;
        }
      });

      return max;
    }

    return my;
  }

  function svgTranslateString(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  return lineChart;
}(d3));
