var apiModule = (function(axios) {
  "use strict";

  function Api(options) {
  }

  Api.prototype.groupDataRange = function(options) {

    var fromDate = options.fromDate;
    var toDate = options.toDate;

    return axios({
      method: 'get',
      url: '/group_range',
      params: {
        fromDate: fromDate,
        toDate: toDate,
      }
    });
  };

  Api.prototype.groupData = function(options) {

    var targetDatetime = options.targetDatetime;

    return axios({
      method: 'get',
      url: '/group_data',
      params: {
        targetDatetime: targetDatetime,
      }
    });
  };

  Api.prototype.contributorData = function(options) {

    var targetDatetime = options.targetDatetime;

    return axios({
      method: 'get',
      url: '/contributor_data',
      params: {
        targetDatetime: targetDatetime,
      }
    });
  };

  return {
    Api: Api,
  };

}(axios));
