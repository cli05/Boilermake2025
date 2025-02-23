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
        print('checkpoint >9000')

        return Response({
            result
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)

def generate_zsc_output(prompt):
    classes_verbalized = settings.ZERO_SHOT_LABELS
    zeroshot_classifier = settings.ZERO_SHOT_PIPELINE
    print(zeroshot_classifier)
    output = zeroshot_classifier(prompt, classes_verbalized, multi_label=True)
    print(output)
    return output

# First method, filters playlist according to songs that fit AT LEAST one criteria
def generate_subplaylist(prompt, playlist):
    print('checkpoint 0.5')
    output = generate_zsc_output(prompt)
    use_labels = [output["labels"][x] for x in range(len(output["labels"])) if output["scores"][x] > 0.95]
    final_playlist = []
    print('checkpoint 1')
    for label in use_labels:
        label_val = settings.KV_LABELS[label]
        col = None 
        print('checkpoint 2', label)
        if label_val is None:
            #if the label is a genre
            col = "track_genre"
        else:
            #if label is any other category
            ind = settings.ZERO_SHOT_LABELS.index(label)
            col = settings.FEATURES[ind // 3]
        print('checkpoint 3', label)
        for song_id in playlist:
            row = df[df["track_id"] == song_id]
            if not len(row):
                if song_id not in final_playlist:
                    final_playlist.append(song_id)
                    continue

            print('checkpoint 4', label, song_id)
            if (col == "track_genre"):
                gen_list = row[col].iloc[0].split(",")
                for gen in gen_list:
                    if gen == label:
                        if song_id not in final_playlist:
                            final_playlist.append(song_id)
            else:
                min = label_val[0]
                max = label_val[1]
                if row[col].iloc[0] <= max and row[col].iloc[0] >= min:
                    if song_id not in final_playlist:
                        final_playlist.append(song_id)

            print('checkpoint 5', label, song_id)
    return final_playlist

# Second method, filters playlist according to songs that fit ALL criteria
def generate_subplaylist2(prompt, playlist):
    output = generate_zsc_output(prompt)
    use_labels = [output["labels"][x] for x in range(len(output["labels"])) if output["scores"][x] > 0.97]
    df = settings.DF
    for song_id in playlist:
        row = df[df["track_id"] == song_id]
        for label in use_labels:
            label_val = settings.KV_LABELS[label]
            if label_val is None:
                gen_list = row[col].iloc[0].split(",")
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
                ind = settings.ZERO_SHOT_LABELS.index(label)
                col = settings.FEATURES[ind // 3]
                min = label_val[0]
                max = label_val[1]
                if row[col].iloc[0] <= max and row[col].iloc[0] >= min:
                    if song_id not in final_playlist:
                        final_playlist.append(song_id)
                    break
                
    return final_playlist
