const isReqDone = (req) => (req.status || 'TODO') === 'DONE' || (req.status || 'TODO') === '검토완료';
console.log(isReqDone({ status: 'TODO' }));
console.log(isReqDone({ status: 'DONE' }));
console.log(isReqDone({ status: '검토완료' }));
console.log(isReqDone({ status: '' }));
