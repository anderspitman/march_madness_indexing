var leaderboardModule = (function(d3) {
  "use strict";

  function Leaderboard(options) {
    var domElem  = options.domElement;
    var data = options.data;

    var stats = d3.select(domElem).append("div");
    stats.call(statsChart().data(data));
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
      //Object.keys(data.wards).forEach(function(ward_name) {
      //  var ward = data.wards[ward_name];
      //  ward.forEach(function(person) {
      //    total += person.indexed;
      //  });
      //});

      //var oldRecord = 6970;
      //totalRec.append("div")
      //    .text("Stake Total for month:");

      //totalRec.append("div")
      //    .text(total);

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
            //var nameSplit = d.name.split(" ");
            var nameSplit = d.display_name.split(" ");

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
          .text(function(d) { return shortNameMap[d.wardKey]; });

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

  function computeLeaderboard(data) {

    //var dataArray = [];
    //Object.keys(data.wards).forEach(function(wardName) {
    //  data.wards[wardName].forEach(function(person) {
    //    person.ward_name = wardName;
    //  });
    //  dataArray.push(data.wards[wardName]);
    //});

    //var flat = dataArray.reduce(function(acc, val) {
    //  return acc.concat(val);
    //});

    //var sorted = flat.sort(function(a, b) {
    var sorted = data.sort(function(a, b) {
      var keyA = a.indexed;
      var keyB = b.indexed;

      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    }).reverse();

    var leaders = sorted.slice(0, 20);

    return leaders;
  }

  return {
    Leaderboard: Leaderboard,
  };

}(d3));
