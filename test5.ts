async function testExport2() {
  try {
    const r = await fetch('http://localhost:3000/api/export');
    const t = await r.text();
    const lines = t.split(/<script/);
    lines.forEach((l, i) => {
      if (i > 0) console.log("<script" + l.substring(0, 50));
    });
  } catch(e) {
    console.log(e);
  }
}
testExport2();
