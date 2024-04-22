import pandas as pd

#DATASET_COLUMNS = ["Name", "School", "Job Description", "Department", "Earnings", "Year"]

df = pd.read_csv("db/higher_ed_employee_salaries.csv")

print(df.head())

# df.to_csv('tweets.csv', index=False)

print(df.isnull().sum())

df["Earnings"] = df["Earnings"].fillna(0)

print(df.isnull().sum())

df.to_csv('salaries.csv', index=False)