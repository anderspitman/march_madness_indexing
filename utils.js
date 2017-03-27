var utils = (function() {

  function calculateScore(recordsIndexed, wardHandicap, wardStartValue) {
    return Math.floor((recordsIndexed - wardStartValue) * wardHandicap);
  }

  return {
    calculateScore: calculateScore
  };

}());
