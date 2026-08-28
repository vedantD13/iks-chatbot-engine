import urllib.request, json
req = urllib.request.Request('http://127.0.0.1:8000/api/analyze', data=json.dumps({'input_text': 'I am going to visit a doctor.'}).encode(), headers={'Content-Type': 'application/json'})
with open('test_output.txt', 'wb') as f:
    f.write(urllib.request.urlopen(req).read())
