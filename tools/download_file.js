var casper = require('casper').create();

var x = require('casper').selectXPath;

var auth;

downloadStateAprilReport(casper);
downloadContributorStatistics(casper);


function downloadStateAprilReport(casper) {
  casper.options.waitTimeout = 60000;

  casper.start('https://indexing.familysearch.org/admin/unit.jsf');

  casper.then(function() {
    var fs = require('fs');
    auth = JSON.parse(fs.read('auth.json'));
  });

  casper.then(function() {
    this.sendKeys('input#userName', auth.username);
  });

  casper.then(function() {
    this.sendKeys('input#password', auth.password);
  });

  casper.then(function() {
    this.click(x('//input[@id="login"]'));
  });

  var reportsSelector = x('//a[text()="Reports"]');
  casper.waitForSelector(reportsSelector, function() {
    this.click(reportsSelector);
  });

  var timelineSelector = 'select[name="reports:_id101"]';
  casper.waitForSelector(timelineSelector, function() {
    casper.selectOptionByValue(timelineSelector, 'report_type.monthly');
  });

  var monthSelector = x('//select/option[@value="report_period.monthly_april"]');
  casper.waitForSelector(monthSelector, function() {
    casper.selectOptionByValue('select[name="reports:_id104"]', 'report_period.monthly_april');
  });

  casper.then(function() {
    casper.selectOptionByValue('select[name="reports:format"]', 'csv');
  });

  generateReport(casper);

  downloadReport(casper, 'data.csv');
}

function downloadContributorStatistics(casper) {
  var statsSelector = 'select[name="reports:_id98"]';
  casper.waitForSelector(statsSelector, function() {
    casper.selectOptionByValue(statsSelector, 'UserStatisticsReport');
  });

  generateReport(casper);
  downloadReport(casper, 'contributor_statistics.csv');
}

function generateReport(casper) {
  var generateReportSelector = 'input[value="Generate Report"]';
  casper.waitForSelector(generateReportSelector, function() {
    this.click(generateReportSelector);
  });
}

function downloadReport(casper, filename) {
  var downloadReportSelector = x('//a[text()="Download Report"]');
  casper.waitForSelector(downloadReportSelector, function() {
    var url = casper.getElementAttribute(downloadReportSelector, 'href');
    this.download(url, filename);
  });
}

function selectContributorOption(casper) {
}

//casper.then(function() {
//  this.capture('screenshot.png');
//});

casper.on('error', function(msg,backtrace) {
  console.log(msg);
});

casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
})

casper.selectOptionByValue = function(selector, valueToMatch){
    this.evaluate(function(selector, valueToMatch){
        var select = document.querySelector(selector),
            found = false;
        Array.prototype.forEach.call(select.children, function(opt, i){
            if (!found && opt.value.indexOf(valueToMatch) !== -1) {
                select.selectedIndex = i;
                found = true;
            }
        });
        // dispatch change event in case there is some kind of validation
        var evt = document.createEvent("UIEvents"); // or "HTMLEvents"
        evt.initUIEvent("change", true, true);
        select.dispatchEvent(evt);
    }, selector, valueToMatch);
};

casper.run();
