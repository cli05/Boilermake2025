from django.shortcuts import render

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings


@api_view(['POST'])
def classify_text(request):
    text = request.data.get('text', '').strip() # input data from the api call, strip whitespace
    song_list = request.data.get('song_list', [])

    if not text: # return error 400 if no text
        return Response({"error": "No text provided"}, status=400)

    try:
        print('checkpoint 0')
        result = generate_subplaylist(text, song_list)
        print('Result is ', result)

        return Response({
            'tracks': result
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)

def generate_zsc_output(prompt):
    classes_verbalized = settings.ZERO_SHOT_LABELS
    zeroshot_classifier = settings.ZERO_SHOT_PIPELINE
    print(classes_verbalized, zeroshot_classifier)
    try:
        output = zeroshot_classifier(prompt, classes_verbalized, multi_label=True)
    except Exception as e:
        print(e)
    return output

# First method, filters playlist according to songs that fit AT LEAST one criteria
def generate_subplaylist(prompt, playlist):
    output = generate_zsc_output(prompt)
    print(output)
    print('Model successfully processed prompt.')
    use_labels = [output["labels"][x] for x in range(len(output["labels"])) if output["scores"][x] > 0.95]
    final_playlist = []
    df = settings.DF
    print('Labels have been parsed and dataframe instantiated. 2')
    for song_id in playlist:
        row = df[df["track_id"] == song_id]
        if len(row) == 0:
            continue

        print("Current song id: ", song_id)
        for label in use_labels:
            print('Current label = ', label)
            label_val = settings.KV_LABELS[label]
            if label_val is None:
                print('Label is a genre')
                gen_list = row['track_genre'].iloc[0].split(",")
                found = False
                for gen in gen_list:
                    if gen == label:
                        found = True
                        if song_id not in final_playlist:
                            final_playlist.append(song_id)
                        break
                if found:
                    break
            else:
                print('Label is a description')
                ind = settings.ZERO_SHOT_LABELS.index(label)
                col = settings.FEATURES[ind // 3]
                min = label_val[0]
                max = label_val[1]
                if row[col].iloc[0] <= max and row[col].iloc[0] >= min:
                    if song_id not in final_playlist:
                        final_playlist.append(song_id)
                    break

    return final_playlist
