(function($, d3) {
  "use strict";

  var TreeChart = treeChartModule.TreeChart;
  var Leaderboard = leaderboardModule.Leaderboard;
  var Api = apiModule.Api;

  //var keyMapping = {
  //  "Horizon YSA Ward": 'horizon',
  //  "McClintock YSA Ward": 'mcclintock',
  //  "Mission Bay YSA Ward": 'mission_bay',
  //  "Other": 'other',
  //  "Pioneer YSA Ward": 'pioneer',
  //  "San Marcos YSA Ward": 'san_marcos',
  //  "South Mountain YSA Ward": 'south_mountain',
  //  "Towne Lake YSA Ward": 'towne_lake',
  //  "University YSA Ward": 'university',
  //};

  var keyMapping = {
    "08fde382-b526-44be-bdd0-cc43a8eb4d00": 'horizon',
    "45694276-673f-40c4-92f5-b8b3dbbd0243": 'mcclintock',
    "bcfd526e-c048-4595-81f3-11a6f9c39eaf": 'mission_bay',
    "74e8852f-dfd0-42a8-bd3d-9bb0ee2e4760": 'other',
    "1e0a2280-d4b4-4de9-9837-7a2f8b6df72e": 'pioneer',
    "6623ec73-500f-4eca-aa7d-02287c7d0451": 'san_marcos',
    "37e4f8b1-f82d-467e-a584-7c266eaaf266": 'south_mountain',
    "fa55e275-6135-4d09-a223-a5350b8ec88b": 'towne_lake',
    "e1fa9978-8f55-4e5c-88f5-834c822fc30e": 'university',
  };

  // TODO: change to AZ timezone
  var start = '2018-03-25T07:00:00.000000';
  var endRound1 = '2018-04-01T06:59:59.999999';
  var endRound2 = '2018-04-08T06:59:59.999999';
  var endRound3 = '2018-04-15T06:59:59.999999';

  var api = new Api();

  var baseGroupData;
  var groupDataEndRound1;
  var groupDataEndRound2;
  var groupDataEndRound3;

  var baseContributorData;
  var contributorDataEnd;

  $('#mainTabs a').click(function(e) {
    e.preventDefault();
    $(this).tab('show');
  });

  api.contributorData({
      targetDatetime: start,
  })
  .then(function(result) {

    baseContributorData = result.data;

    return api.contributorData({
      targetDatetime: endRound3,
    })
  })
  .then(function(result) {

    contributorDataEnd = result.data;

    return api.groupData({
      targetDatetime: start,
    })
  })
  .then(function(result) {

    baseGroupData = result.data;

    return api.groupData({
      targetDatetime: endRound1,
    })
  })
  .then(function(result) {

    groupDataEndRound1 = result.data;

    return api.groupData({
      targetDatetime: endRound2,
    })
  })
  .then(function(result) {

    groupDataEndRound2 = result.data;

    return api.groupData({
      targetDatetime: endRound3,
    })
  })
  .then(function(result) {

    groupDataEndRound3 = result.data;

    var data = [
      baseGroupData,
      groupDataEndRound1,
      groupDataEndRound2,
      groupDataEndRound3,
    ];

    var contributorData = {
      base: baseContributorData,
      end: contributorDataEnd,
    }

    d3.xml("assets/tree.svg").mimeType("image/svg+xml").get(function(error, treeXml) {
      if (error) throw error;

      createCharts(data, contributorData, treeXml);
    });
  })


  function createCharts(data, contributorData, treeXml) {

    console.log(data);

    var diffed = calculateDifferences(data);
    var groupData = {
      round1: transformGroupData(diffed[0]),
      round2: transformGroupData(diffed[1]),
      round3: transformGroupData(diffed[2]),
    };

    var diffedContrib = calculateDifference(
      contributorData.base.table, contributorData.end.table, 'indexed');
    var contributorDataTransformed = transformContributorData(diffedContrib);

    console.log(contributorDataTransformed);

    var bracket = new TreeChart({
      domElement: document.querySelector('.tree-container'),
      data: groupData,
      treeXml: treeXml,
    });

    var leaderboard = new Leaderboard({
      domElement: document.querySelector('.leaderboard-container'),
      data: contributorDataTransformed,
    });
  }

  function transformGroupData(data) {

    var groupData = {};

    Object.keys(data.table).forEach(function(key) {
      var group = data.table[key];
      var shortKey = keyMapping[group.group_uuid];
      groupData[shortKey] = group;
    });

    return groupData;
  }

  function transformContributorData(data) {

    var contributorData = [];

    Object.keys(data).forEach(function(key) {
      var contributor = data[key];
      contributorData.push(contributor);
    });

    return contributorData;
  }

  function calculateDifferences(data) {

    var newData = [];
    var baseGroupData = data[0];

    for (let i = 1; i < data.length; i++) {
      var round = data[i];
      var prev = data[i - 1];
      newData.push({
        timestamp_utc: round.timestamp_utc,
        table: {},
      });

      var j = i - 1;

      for (let key in round.table) {
        var entry = round.table[key];
        var prevEntry = prev.table[key];

        newData[j].table[key] = utils.deepCopyObject(entry);

        if (prevEntry) {
          newData[j].table[key].indexed = entry.indexed - prevEntry.indexed;
        }
      }
    }

    return newData;
  }

  function calculateDifference(startData, endData, valueKey) {

    var newData = utils.deepCopyObject(endData);

    for (let key in endData) {
      var entry = endData[key];
      var prevEntry = startData[key];

      if (prevEntry) {
        newData[key][valueKey] = entry[valueKey] - prevEntry[valueKey];
      }
    }

    return newData;
  }

}($, d3));
