async function testExport() {
  try {
    const r = await fetch('http://localhost:3000/api/export');
    const t = await r.text();
    console.log("Status:", r.status);
    console.log("Size:", t.length);
    console.log("Contains module?", t.includes('module'));
    console.log("Head snippet:", t.substring(0, 100));
  } catch(e) {
    console.log(e);
  }
}
testExport();
