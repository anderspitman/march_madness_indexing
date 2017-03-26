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
    var wardInfo;

    function my(selection) {
      var svg = selection.append("svg")
          .style("width", "100%")
          .style("height", "70%");
      var width = parseInt(svg.style("width")) - margin.left - margin.right;
      var height = parseInt(svg.style("height")) - margin.top - margin.bottom;
      var g = svg.append("g")
          .attr("transform", svgTranslateString(margin.left, margin.top));

      var tData = transformData(data);

      var x = d3.scaleTime()
          .domain(d3.extent(tData.dates))
          .rangeRound([0, width]);

      var max = calculateMax(tData);

      var y = d3.scaleLinear()
          .domain([0, max])
          .rangeRound([height, 0]);

      var line = d3.line()
          .x(function(d, i) { return x(tData.dates[i]); })
          .y(function(d) {
            var val = calculateScore(d.indexed,
              wardInfo[d.unit_name].size_normalization_ratio,
              wardInfo[d.unit_name].start_value);
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
          if (unitName !== "full_stake") {
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
        var wardMax = calculateScore(last.indexed,
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

  function calculateScore(recordsIndexed, wardHandicap, wardStartValue) {
    return (recordsIndexed - wardStartValue) * wardHandicap;
  }

  function svgTranslateString(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  return lineChart;
}(d3));