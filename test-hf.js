async function test() {
  const prompt = 'A boy working on laptop';
  
  try {
    const stopWords = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'for', 'with', 'and', 'or', 'to', 'is', 'are', 'some']);
    const keywords = prompt.toLowerCase().split(/[^a-z0-9]+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .slice(0, 3)
        .join(',');
    console.log("Keywords:", keywords);
    const url = `https://loremflickr.com/1024/1024/${keywords}?all=1`;
    console.log("Fetching:", url);
    const response = await fetch(url);
    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get('content-type'));
  } catch (e) {
    console.error(e);
  }
}
test();
