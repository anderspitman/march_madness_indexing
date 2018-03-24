var utils = (function() {

  function calculateScore(recordsIndexed, wardHandicap, wardStartValue) {
    return Math.floor((recordsIndexed - wardStartValue) * wardHandicap);
  }

  function svgTranslateString(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  return {
    calculateScore: calculateScore,
    svgTranslateString: svgTranslateString,
  };

}());
