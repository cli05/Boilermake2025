import pandas as pd

df = pd.read_csv('dataset.csv')
print(df.head(10))
print(df[df['track_id'] == '1EzrEOXmMH3G43AXT1y7pA'])
