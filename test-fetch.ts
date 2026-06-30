try {
  const r = await fetch('http://localhost:3000/api/export');
  const t = await r.text();
  console.log(r.status);
  console.log(t.substring(0, 100));
} catch(e) {
  console.log(e);
}
