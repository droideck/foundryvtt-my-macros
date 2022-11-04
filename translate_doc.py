import codecs
import copy
import json
import os
import bs4
from google.cloud import translate_v2 as translate

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "D:\\ttrpg\\rock-bonus-366715-9a26661ef419.json"

def translate_text(text, target_language, source_language=None):
    translate_client = translate.Client()
    result = translate_client.translate(text, target_language=target_language, source_language=source_language)

    return result

filename = "d:\\journal.db"
types_of_encoding = ["utf8", "cp1252"]
for encoding_type in types_of_encoding:
    with codecs.open(filename, encoding = encoding_type, errors ='replace') as f:
        xlines = f.readlines()

        newxlines = []

    for x in xlines:
        res = json.loads(x)
        try:
            el0 = dict(res["pages"][0])
            if el0["name"].startswith("J") or el0["name"].startswith("I") or el0["name"].startswith("H") or el0["name"].startswith("G") or el0["name"].startswith("F"):
                content = el0["text"]["content"]
            else:
                continue
        except:
            continue

        soup = bs4.BeautifulSoup(content, "html.parser")
        for st in soup.find_all('p', string=True):
            new_string = translate_text(st.string, 'ru')
            st.string.replace_with(new_string['translatedText'])

        newxlines.append({"name": el0["name"], "text": str(soup)}) 

newxlines = sorted(newxlines, key=lambda x: x['name'])

with open("d:\\journal_translated.txt", "w", encoding="utf-8") as s:
    for x in newxlines:
        s.write(x["name"])
        s.write("\n---------------\n")
        s.write(x["text"])
        s.write("\n---------------\n")