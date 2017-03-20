fetch("https://rawgit.com/anderspitman/march_madness_indexing_data/master/data.json")
.then(response => {
  return response.text();
})
.then(text => {
  const data = JSON.parse(text).map(record => {
    record.Indexed = +record.Indexed;
    record.Arbitrated = +record.Arbitrated;
    record['Redo Batches'] = +record['Redo Batches'];
    return record;
  });

  console.log(data);
});
