var utils = (function() {

  function calculateScore(recordsIndexed, wardHandicap, wardStartValue) {
    return Math.floor((recordsIndexed - wardStartValue) * wardHandicap);
  }

  function svgTranslateString(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  function deepCopyObject(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  return {
    calculateScore: calculateScore,
    svgTranslateString: svgTranslateString,
    deepCopyObject: deepCopyObject,
  };

}());
