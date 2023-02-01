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


    with open("d:\\journal_translated.txt", "a", encoding="utf-8") as s:
        for x in xlines:
            newxlines = []
            res = json.loads(x)
            try:
                for page in res["pages"]:
                    content = page["text"]["content"]

                    soup = bs4.BeautifulSoup(content, "html.parser")
                    for st in soup.find_all('p', string=True):
                        pass
                        #new_string = translate_text(st.string, 'ru')
                        #st.string.replace_with(new_string['translatedText'])
                    newxlines.append({"name": page["name"], "text": str(soup)})
            except:
                continue
            newxlines = sorted(newxlines, key=lambda x: x['name'])
            s.write(res["name"])
            s.write("\n---------------\n")
            for x in newxlines:
                s.write(x["name"])
                s.write("\n---------------\n")
                s.write(x["text"])
                s.write("\n---------------\n")

