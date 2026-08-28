import urllib.request, json
req = urllib.request.Request('http://localhost:8000/api/analyze', data=json.dumps({'input_text': 'test'}).encode(), headers={'Content-Type': 'application/json'})
try:
    urllib.request.urlopen(req)
except Exception as e:
    print(e.read().decode())
