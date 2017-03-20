#! /usr/bin/env python

import time
import csv
import subprocess
import json


def download_file():
    subprocess.run(["casperjs", "download_file.js"])

def process_file():
    with open("data.csv", newline='') as csv_file:
        reader = csv.DictReader(csv_file)

        data = []
        for record in reader:
            data.append(record)
        print(data)
        return data

def update_git():
    subprocess.run(["git", "add", "data.json"])
    subprocess.run(["git", "commit", "-m", "'Update data.json'"])
    subprocess.run(["git", "checkout", "gh-pages"])
    subprocess.run(["git", "push", "origin", "gh-pages"])

if __name__ == '__main__':
    period_seconds = 10*60 # 10 minutes

    with open("data.json", "r") as prev_data_file:
        prev_data = json.load(prev_data_file)

    time_start = time.time()
    while True:
        download_file()
        data = process_file()

        if prev_data is not None:
            if int(data[0]['Indexed']) != int(prev_data[0]['Indexed']):
                # update data on server
                print("New data")
                with open("data.json", "w") as out_file:
                    json.dump(data, out_file, indent=2)
                update_git()

        prev_data = data

        curr_time = time.time()
        elapsed = curr_time - time_start
        print("elapsed: {}".format(elapsed))

        sleep_for = period_seconds - elapsed

        if sleep_for > 0:
            print("sleep for: {}".format(sleep_for))
            time.sleep(sleep_for)
        else:
            print("Not sleeping")
        time_start = time.time()
