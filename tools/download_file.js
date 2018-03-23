var casper = require('casper').create();

var x = require('casper').selectXPath;

var auth;

downloadStateAprilReport(casper);
//downloadContributorStatistics(casper);


function downloadStateAprilReport(casper) {
  casper.options.waitTimeout = 60000;

  casper.start('https://www.familysearch.org/indexing/groups/74e8852f-dfd0-42a8-bd3d-9bb0ee2e4760/reports');

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
    this.click(x('//button[@id="login"]'));
  });

  //var reportsSelector = x('//button[contains(@class, "download-button")]');
  //casper.waitForSelector(reportsSelector, function() {
  //  //this.click(reportsSelector);
  //  casper.wait(3000);
  //});


  //var timelineSelector = 'select[name="reports:_id101"]';
  //casper.waitForSelector(timelineSelector, function() {
  //  casper.selectOptionByValue(timelineSelector, 'report_type.monthly');
  //});

  sleep(casper, 3000);

  //var monthSelector = x('//select/option[@value="report_period.monthly_april"]');
  //var formatSelector= x('//select[@ng-model="reportsManager.reportData.format"]');
  var formatSelector = 'select[ng-model="reportsManager.reportData.format"]';
  casper.waitForSelector(formatSelector, function() {
    casper.selectOptionByValue(formatSelector, 'CSV');
  });

  sleep(casper, 1000);

  casper.then(function() {
    var downloadButtonSelector =
      x('//button[contains(@class, "download-button")]');
    this.click(downloadButtonSelector);
  });

  casper.then(function() {
    console.log("Saving file");
    casper.capture('debug_screenshot.png');
  });

  //generateReport(casper);

  downloadReport(casper, 'data.csv');
}

function sleep(casper, millis) {
  return casper.then(function() {
    casper.wait(millis)
  });
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
  //var downloadReportSelector = x('//a[text()="Download Report"]');
  //casper.waitForSelector(downloadReportSelector, function() {
  //  var url = casper.getElementAttribute(downloadReportSelector, 'href');
  //  this.download(url, filename);
  //});

  var url = "https://www.familysearch.org/indexing/reports/statistic/groups/74e8852f-dfd0-42a8-bd3d-9bb0ee2e4760/contributor?format=CSV&fromDate=1/1/2018&includeSubGroupMembers=true&isContributors=true&isDownload=true&isGeneralGroupMembers=true&isNonContributors=true&isSystemAssignedGroupMembers=true&locale=en&notes=&paginateSubgroups=true&range=YEARLY&sortDirection=ASCENDING&sortOrderByField=CONTACT_NAME&timeZone=US/Mountain&toDate=3/16/2018";
  casper.then(function() {
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
