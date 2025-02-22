from django.shortcuts import render

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings


@api_view(['POST'])
def classify_text(request):
    text = request.data.get('text', '').strip() # input data from the api call, strip whitespace

    if not text: # return error 400 if no text
        return Response({"error": "No text provided"}, status=400)

    try:
        result = settings.ZERO_SHOT_PIPELINE(
            text,
            candidate_labels=settings.ZERO_SHOT_LABELS, #This is referenced at the bottom of settings.py, CALEB LI GO CHANGE THIS
            multi_label=True
        )

        return Response({
            "labels": result["labels"], #Right now returns the labels and scores rounded to 4 decimals but you change it
            "scores": [round(score, 4) for score in result["scores"]]
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)
